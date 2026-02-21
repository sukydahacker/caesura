import os
import httpx
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class PrintifyService:
    def __init__(self):
        self.api_token = os.environ.get('PRINTIFY_API_TOKEN', '')
        self.shop_id = os.environ.get('PRINTIFY_SHOP_ID', '')
        self.base_url = 'https://api.printify.com/v1'
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
        self.mock_mode = not (self.api_token and self.shop_id)
        
        if self.mock_mode:
            logger.warning('Printify running in MOCK mode - no API credentials configured')
    
    async def get_blueprints(self) -> List[Dict]:
        """Get available product blueprints from Printify"""
        if self.mock_mode:
            return self._mock_blueprints()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'{self.base_url}/catalog/blueprints.json',
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to fetch Printify blueprints: {e}')
            return self._mock_blueprints()
    
    async def get_blueprint_variants(self, blueprint_id: int) -> Dict:
        """Get variants (sizes, colors) for a specific blueprint"""
        if self.mock_mode:
            return self._mock_variants(blueprint_id)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'{self.base_url}/catalog/blueprints/{blueprint_id}/print_providers.json',
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to fetch blueprint variants: {e}')
            return self._mock_variants(blueprint_id)
    
    async def create_product(self, design_image_url: str, title: str, 
                           description: str, blueprint_id: int, 
                           print_provider_id: int, variants: List[int]) -> Dict:
        """Create a product on Printify"""
        if self.mock_mode:
            return self._mock_create_product(blueprint_id)
        
        try:
            product_data = {
                'title': title,
                'description': description,
                'blueprint_id': blueprint_id,
                'print_provider_id': print_provider_id,
                'variants': [
                    {
                        'id': variant_id,
                        'price': 1999,  # Price in cents
                        'is_enabled': True
                    }
                    for variant_id in variants
                ],
                'print_areas': [
                    {
                        'variant_ids': variants,
                        'placeholders': [
                            {
                                'position': 'front',
                                'images': [
                                    {
                                        'id': design_image_url,
                                        'x': 0.5,
                                        'y': 0.5,
                                        'scale': 1,
                                        'angle': 0
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.base_url}/shops/{self.shop_id}/products.json',
                    headers=self.headers,
                    json=product_data,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to create Printify product: {e}')
            return self._mock_create_product(blueprint_id)
    
    async def publish_product(self, product_id: str) -> Dict:
        """Publish a product to make it available"""
        if self.mock_mode:
            return {'success': True, 'mock': True}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.base_url}/shops/{self.shop_id}/products/{product_id}/publish.json',
                    headers=self.headers,
                    json={'title': True, 'description': True, 'images': True},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to publish Printify product: {e}')
            return {'success': False, 'error': str(e)}
    
    async def create_order(self, product_id: str, variant_id: int, 
                          quantity: int, shipping_address: Dict) -> Dict:
        """Place an order on Printify"""
        if self.mock_mode:
            return self._mock_create_order()
        
        try:
            order_data = {
                'line_items': [
                    {
                        'product_id': product_id,
                        'variant_id': variant_id,
                        'quantity': quantity
                    }
                ],
                'shipping_method': 1,
                'send_shipping_notification': True,
                'address_to': {
                    'first_name': shipping_address['name'].split()[0],
                    'last_name': ' '.join(shipping_address['name'].split()[1:]) or shipping_address['name'],
                    'email': shipping_address['email'],
                    'phone': shipping_address['phone'],
                    'address1': shipping_address['address'],
                    'city': shipping_address['city'],
                    'region': shipping_address['state'],
                    'zip': shipping_address['pincode'],
                    'country': 'IN'
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.base_url}/shops/{self.shop_id}/orders.json',
                    headers=self.headers,
                    json=order_data,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to create Printify order: {e}')
            return self._mock_create_order()
    
    async def get_order_status(self, order_id: str) -> Dict:
        """Get order fulfillment status from Printify"""
        if self.mock_mode:
            return self._mock_order_status()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f'{self.base_url}/shops/{self.shop_id}/orders/{order_id}.json',
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f'Failed to fetch order status: {e}')
            return self._mock_order_status()
    
    # Mock methods for development without API credentials
    def _mock_blueprints(self) -> List[Dict]:
        return [
            {
                'id': 3,
                'title': 'Kids Regular Fit Tee',
                'description': 'Gildan 5000B',
                'brand': 'Gildan',
                'model': '5000B',
                'images': ['https://images.printify.com/mockup/5d39f07672e4bb4a8c23ae0c/3/2194/ladies-organic-shirt.jpg']
            },
            {
                'id': 6,
                'title': 'Unisex Heavy Cotton Tee',
                'description': 'Gildan 5000',
                'brand': 'Gildan',
                'model': '5000',
                'images': ['https://images.printify.com/mockup/5d39f07672e4bb4a8c23ae0c/6/2194/mens-organic-shirt.jpg']
            },
            {
                'id': 77,
                'title': 'Unisex Heavy Blend Hooded Sweatshirt',
                'description': 'Gildan 18500',
                'brand': 'Gildan',
                'model': '18500',
                'images': ['https://images.printify.com/mockup/5d39f07672e4bb4a8c23ae0c/77/2194/unisex-heavy-blend-hoodie.jpg']
            }
        ]
    
    def _mock_variants(self, blueprint_id: int) -> Dict:
        return {
            'id': blueprint_id,
            'variants': [
                {'id': 1, 'title': 'S / Black', 'options': {'size': 'S', 'color': 'Black'}, 'cost': 500},
                {'id': 2, 'title': 'M / Black', 'options': {'size': 'M', 'color': 'Black'}, 'cost': 500},
                {'id': 3, 'title': 'L / Black', 'options': {'size': 'L', 'color': 'Black'}, 'cost': 550},
                {'id': 4, 'title': 'XL / Black', 'options': {'size': 'XL', 'color': 'Black'}, 'cost': 550},
                {'id': 5, 'title': 'S / White', 'options': {'size': 'S', 'color': 'White'}, 'cost': 500},
                {'id': 6, 'title': 'M / White', 'options': {'size': 'M', 'color': 'White'}, 'cost': 500},
            ]
        }
    
    def _mock_create_product(self, blueprint_id: int) -> Dict:
        import uuid
        return {
            'id': f'mock_printify_{uuid.uuid4().hex[:12]}',
            'title': 'Mock Product',
            'blueprint_id': blueprint_id,
            'print_provider_id': 1,
            'shop_id': self.shop_id or 'mock_shop',
            'created_at': '2026-01-01 00:00:00',
            'mock': True
        }
    
    def _mock_create_order(self) -> Dict:
        import uuid
        return {
            'id': f'mock_order_{uuid.uuid4().hex[:12]}',
            'status': 'pending',
            'tracking_number': 'MOCK1234567890',
            'tracking_url': 'https://tracking.example.com/MOCK1234567890',
            'mock': True
        }
    
    def _mock_order_status(self) -> Dict:
        return {
            'id': 'mock_order',
            'status': 'on_hold',
            'tracking_number': 'MOCK1234567890',
            'tracking_url': 'https://tracking.example.com/MOCK1234567890',
            'shipments': [],
            'mock': True
        }

# Singleton instance
printify_service = PrintifyService()