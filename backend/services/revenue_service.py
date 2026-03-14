from typing import Dict
import uuid
from datetime import datetime, timezone

# Import the async PostgreSQL helpers
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import fetch_one, fetch_all, fetch_val, execute, to_jsonb


class RevenueService:

    @staticmethod
    def calculate_split(retail_price: float, base_cost: float,
                       creator_commission_rate: float = 0.8,
                       platform_commission_rate: float = 0.2) -> Dict:
        """
        Calculate revenue split between creator and platform.
        """
        gross_profit = retail_price - base_cost

        if gross_profit < 0:
            return {
                'creator_amount': 0,
                'platform_amount': 0,
                'profit_margin': gross_profit,
                'base_cost': base_cost,
                'retail_price': retail_price
            }

        creator_amount = round(gross_profit * creator_commission_rate, 2)
        platform_amount = round(gross_profit * platform_commission_rate, 2)

        return {
            'creator_amount': creator_amount,
            'platform_amount': platform_amount,
            'profit_margin': gross_profit,
            'base_cost': base_cost,
            'retail_price': retail_price
        }

    @staticmethod
    async def record_split(order_id: str, creator_id: str,
                          creator_amount: float, platform_amount: float, **kwargs) -> str:
        """
        Record revenue split in database.
        The `db` kwarg is accepted for backwards compat but ignored (we use the pool).
        """
        split_id = f'split_{uuid.uuid4().hex[:12]}'

        await execute(
            """INSERT INTO revenue_splits
                   (split_id, order_id, creator_id, creator_amount, platform_amount, status, created_at)
               VALUES ($1, $2, $3, $4, $5, 'pending', $6)""",
            split_id, order_id, creator_id, creator_amount, platform_amount,
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
