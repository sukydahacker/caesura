from typing import Dict
import uuid
from datetime import datetime, timezone

# Import the async PostgreSQL helpers
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import fetch_one, fetch_all, fetch_val, execute, to_jsonb
from services import pricing_config


class RevenueService:

    @staticmethod
    def calculate_split(retail_price: float, landed_cost: float,
                       creator_commission_rate: float = None,
                       platform_commission_rate: float = None) -> Dict:
        """
        Calculate the 60/40 creator/platform revenue split for a single unit sold.

        net_margin = retail_price - landed_cost - payment_gateway_fee (2% of retail)
        Creator gets creator_commission_rate of net_margin, platform gets the rest —
        but the platform's cut is never less than PLATFORM_MIN_CUT per item; if
        platform_commission_rate * net_margin comes up short, the platform takes the
        floor and the creator absorbs the difference.
        """
        creator_rate = creator_commission_rate if creator_commission_rate is not None else pricing_config.CREATOR_COMMISSION_RATE
        platform_rate = platform_commission_rate if platform_commission_rate is not None else pricing_config.PLATFORM_COMMISSION_RATE

        gateway_fee = round(retail_price * pricing_config.PAYMENT_GATEWAY_FEE_RATE, 2)
        net_margin = round(retail_price - landed_cost - gateway_fee, 2)

        if net_margin <= 0:
            return {
                'creator_amount': 0.0,
                'platform_amount': 0.0,
                'net_margin': net_margin,
                'gateway_fee': gateway_fee,
                'landed_cost': landed_cost,
                'retail_price': retail_price,
            }

        platform_amount = round(net_margin * platform_rate, 2)
        if platform_amount < pricing_config.PLATFORM_MIN_CUT:
            # Floor the platform's cut, but never take more than the margin itself.
            platform_amount = round(min(pricing_config.PLATFORM_MIN_CUT, net_margin), 2)
        creator_amount = round(net_margin - platform_amount, 2)

        return {
            'creator_amount': creator_amount,
            'platform_amount': platform_amount,
            'net_margin': net_margin,
            'gateway_fee': gateway_fee,
            'landed_cost': landed_cost,
            'retail_price': retail_price,
        }

    @staticmethod
    async def record_split(order_id: str, creator_id: str,
                          creator_amount: float, platform_amount: float,
                          landed_cost: float = None, **kwargs) -> str:
        """
        Record revenue split in database, snapshotting the landed cost it was
        computed from so historical earnings stay correct after catalog prices move.
        The `db` kwarg is accepted for backwards compat but ignored (we use the pool).
        """
        split_id = f'split_{uuid.uuid4().hex[:12]}'

        await execute(
            """INSERT INTO revenue_splits
                   (split_id, order_id, creator_id, creator_amount, platform_amount, landed_cost, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)""",
            split_id, order_id, creator_id, creator_amount, platform_amount, landed_cost,
            datetime.now(timezone.utc),
        )
        return split_id

    @staticmethod
    async def get_creator_earnings(creator_id: str, **kwargs) -> Dict:
        """
        Get creator's total earnings and stats.
        The `db` kwarg is accepted for backwards compat but ignored.
        """
        rows = await fetch_all(
            """SELECT status,
                      COALESCE(SUM(creator_amount), 0) AS total,
                      COUNT(*) AS cnt
               FROM revenue_splits
               WHERE creator_id = $1
               GROUP BY status""",
            creator_id,
        )

        earnings = {
            'total_earnings': 0,
            'pending_earnings': 0,
            'completed_earnings': 0,
            'total_orders': 0
        }

        for row in rows:
            amount = float(row['total'])
            count = row['cnt']
            earnings['total_earnings'] += amount
            earnings['total_orders'] += count
            if row['status'] == 'pending':
                earnings['pending_earnings'] = amount
            elif row['status'] == 'completed':
                earnings['completed_earnings'] = amount

        return earnings

    @staticmethod
    async def mark_split_completed(split_id: str, **kwargs):
        """
        Mark a revenue split as completed.
        """
        await execute(
            """UPDATE revenue_splits
               SET status = 'completed', completed_at = $1
               WHERE split_id = $2""",
            datetime.now(timezone.utc), split_id,
        )

revenue_service = RevenueService()
