from typing import Dict
import uuid
from datetime import datetime, timezone

class RevenueService:
    
    @staticmethod
    def calculate_split(retail_price: float, base_cost: float, 
                       creator_commission_rate: float = 0.8,
                       platform_commission_rate: float = 0.2) -> Dict:
        """
        Calculate revenue split between creator and platform.
        
        Args:
            retail_price: Final price customer pays
            base_cost: Production cost from Printify
            creator_commission_rate: Creator's share of profit (default 80%)
            platform_commission_rate: Platform's share of profit (default 20%)
        
        Returns:
            Dict with creator_amount, platform_amount, profit_margin
        """
        gross_profit = retail_price - base_cost
        
        if gross_profit < 0:
            # Price below cost - no profit to split
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
    async def record_split(db, order_id: str, creator_id: str, 
                          creator_amount: float, platform_amount: float) -> str:
        """
        Record revenue split in database.
        
        Args:
            db: MongoDB database instance
            order_id: Order ID
            creator_id: Creator user ID
            creator_amount: Amount for creator
            platform_amount: Amount for platform
        
        Returns:
            split_id
        """
        split_id = f'split_{uuid.uuid4().hex[:12]}'
        
        split_doc = {
            'split_id': split_id,
            'order_id': order_id,
            'creator_id': creator_id,
            'creator_amount': creator_amount,
            'platform_amount': platform_amount,
            'status': 'pending',
            'created_at': datetime.now(timezone.utc)
        }
        
        await db.revenue_splits.insert_one(split_doc)
        return split_id
    
    @staticmethod
    async def get_creator_earnings(db, creator_id: str) -> Dict:
        """
        Get creator's total earnings and stats.
        
        Args:
            db: MongoDB database instance
            creator_id: Creator user ID
        
        Returns:
            Dict with total_earnings, pending_earnings, completed_earnings, order_count
        """
        pipeline = [
            {'$match': {'creator_id': creator_id}},
            {'$group': {
                '_id': '$status',
                'total': {'$sum': '$creator_amount'},
                'count': {'$sum': 1}
            }}
        ]
        
        results = await db.revenue_splits.aggregate(pipeline).to_list(1000)
        
        earnings = {
            'total_earnings': 0,
            'pending_earnings': 0,
            'completed_earnings': 0,
            'total_orders': 0
        }
        
        for result in results:
            status = result['_id']
            amount = result['total']
            count = result['count']
            
            earnings['total_earnings'] += amount
            earnings['total_orders'] += count
            
            if status == 'pending':
                earnings['pending_earnings'] = amount
            elif status == 'completed':
                earnings['completed_earnings'] = amount
        
        return earnings
    
    @staticmethod
    async def mark_split_completed(db, split_id: str):
        """
        Mark a revenue split as completed (after order is fulfilled).
        
        Args:
            db: MongoDB database instance
            split_id: Split ID to mark as completed
        """
        await db.revenue_splits.update_one(
            {'split_id': split_id},
            {'$set': {
                'status': 'completed',
                'completed_at': datetime.now(timezone.utc)
            }}
        )

revenue_service = RevenueService()