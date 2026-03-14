"""
Printrove Print-on-Demand API Integration
Base URL: https://api.printrove.com
Auth: Bearer token via email/password
"""

import os
import httpx
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PrintroveService:
    def __init__(self):
        self.base_url = "https://api.printrove.com/api/external"
        self.email = os.environ.get("PRINTROVE_EMAIL", "")
        self.password = os.environ.get("PRINTROVE_PASSWORD", "")
        self._token = None
        self._token_expires = None
        self.mock_mode = not (self.email and self.password)

        if self.mock_mode:
            logger.warning("Printrove running in MOCK mode — no credentials configured")

    # ── Authentication ──────────────────────────────────────────────

    async def _ensure_token(self):
        """Get or refresh the Bearer token."""
        now = datetime.now(timezone.utc)
        if self._token and self._token_expires and now < self._token_expires:
            return

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/token",
                    json={"email": self.email, "password": self.password},
                    timeout=15.0,
                )
                resp.raise_for_status()
                data = resp.json()
                self._token = data.get("access_token") or data.get("token")
                # Default to 23-hour expiry if not provided
                self._token_expires = now.replace(hour=now.hour + 23) if not data.get("expires_at") else datetime.fromisoformat(data["expires_at"])
                logger.info("Printrove token refreshed")
        except Exception as e:
            logger.error(f"Printrove auth failed: {e}")
            self._token = None

    def _headers(self) -> Dict:
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    # ── Catalog ─────────────────────────────────────────────────────

    async def get_categories(self) -> List[Dict]:
        """List all product categories (T-Shirts, Hoodies, Caps, etc.)."""
        if self.mock_mode:
            return self._mock_categories()

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/categories",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to fetch Printrove categories: {e}")
            return self._mock_categories()

    async def get_category_products(self, category_id: str) -> List[Dict]:
        """Get parent products in a category."""
        if self.mock_mode:
            return self._mock_category_products(category_id)

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/categories/{category_id}",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to fetch category products: {e}")
            return self._mock_category_products(category_id)

    async def get_product_variants(self, category_id: str, product_id: str) -> Dict:
        """Get size/color variants for a specific product."""
        if self.mock_mode:
            return self._mock_variants(product_id)

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/categories/{category_id}/products/{product_id}",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to fetch product variants: {e}")
            return self._mock_variants(product_id)

    # ── Designs ─────────────────────────────────────────────────────

    async def upload_design(self, image_url: str, name: str) -> Dict:
        """Upload a design via URL to Printrove's design library."""
        if self.mock_mode:
            return self._mock_upload_design(name)

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/designs/url",
                    headers=self._headers(),
                    json={"url": image_url, "name": name},
                    timeout=60.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to upload design to Printrove: {e}")
            return self._mock_upload_design(name)

    async def upload_design_file(self, file_bytes: bytes, filename: str) -> Dict:
        """Upload a design file directly to Printrove."""
        if self.mock_mode:
            return self._mock_upload_design(filename)

        await self._ensure_token()
        try:
            headers = {
                "Authorization": f"Bearer {self._token}",
                "Accept": "application/json",
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/designs",
                    headers=headers,
                    files={"file": (filename, file_bytes, "image/png")},
                    timeout=60.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to upload design file to Printrove: {e}")
            return self._mock_upload_design(filename)

    async def list_designs(self, page: int = 1, per_page: int = 20) -> Dict:
        """List designs in the Printrove design library."""
        if self.mock_mode:
            return {"data": [], "total": 0}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/designs",
                    headers=self._headers(),
                    params={"page": page, "per_page": per_page},
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to list Printrove designs: {e}")
            return {"data": [], "total": 0}

    async def delete_design(self, design_id: str) -> Dict:
        """Delete a design from Printrove."""
        if self.mock_mode:
            return {"success": True, "mock": True}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.delete(
                    f"{self.base_url}/designs/{design_id}",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to delete Printrove design: {e}")
            return {"success": False, "error": str(e)}

    # ── Products ────────────────────────────────────────────────────

    async def create_product(
        self,
        name: str,
        parent_product_id: int,
        design_id: str,
        variants: List[Dict],
        design_dimensions: Optional[Dict] = None,
        back_design_id: Optional[str] = None,
        back_design_dimensions: Optional[Dict] = None,
    ) -> Dict:
        """Create a product on Printrove with design placement."""
        if self.mock_mode:
            return self._mock_create_product(name, parent_product_id)

        await self._ensure_token()

        design_config = {}
        if design_id:
            front = {"id": design_id}
            if design_dimensions:
                front["dimensions"] = design_dimensions
            design_config["front"] = front

        if back_design_id:
            back = {"id": back_design_id}
            if back_design_dimensions:
                back["dimensions"] = back_design_dimensions
            design_config["back"] = back

        payload = {
            "name": name,
            "product_id": parent_product_id,
            "variants": variants,
            "is_plain": False,
        }
        if design_config:
            payload["design"] = design_config

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/products",
                    headers=self._headers(),
                    json=payload,
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to create Printrove product: {e}")
            return self._mock_create_product(name, parent_product_id)

    async def get_products(self, page: int = 1, per_page: int = 20) -> Dict:
        """List products in Printrove product library."""
        if self.mock_mode:
            return {"data": [], "total": 0}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/products",
                    headers=self._headers(),
                    params={"page": page, "per_page": per_page},
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to list Printrove products: {e}")
            return {"data": [], "total": 0}

    async def get_product(self, product_id: str) -> Dict:
        """Get a single product from Printrove."""
        if self.mock_mode:
            return {}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/products/{product_id}",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to get Printrove product: {e}")
            return {}

    # ── Orders ──────────────────────────────────────────────────────

    async def check_serviceability(
        self, country: str, pincode: str, weight: int = 200, cod: bool = False
    ) -> Dict:
        """Check if delivery is available to a pincode."""
        if self.mock_mode:
            return self._mock_serviceability()

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/serviceability",
                    headers=self._headers(),
                    params={
                        "country": country,
                        "pincode": pincode,
                        "weight": weight,
                        "cod": cod,
                    },
                    timeout=15.0,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Serviceability check failed: {e}")
            return self._mock_serviceability()

    async def create_order(
        self,
        reference_number: str,
        retail_price: float,
        customer: Dict,
        order_products: List[Dict],
        cod: bool = False,
        courier_id: Optional[int] = None,
        invoice_url: Optional[str] = None,
    ) -> Dict:
        """Place an order on Printrove for fulfillment."""
        if self.mock_mode:
            return self._mock_create_order(reference_number)

        await self._ensure_token()

        payload = {
            "reference_number": reference_number,
            "retail_price": retail_price,
            "customer": {
                "name": customer["name"],
                "email": customer.get("email", ""),
                "number": customer.get("phone", customer.get("number", "")),
                "address1": customer.get("address", customer.get("address1", "")),
                "address2": customer.get("address2", ""),
                "pincode": customer.get("pincode", ""),
                "state": customer.get("state", ""),
                "city": customer.get("city", ""),
                "country": customer.get("country", "IN"),
            },
            "order_products": order_products,
            "cod": cod,
        }

        if courier_id:
            payload["courier_id"] = courier_id
        if invoice_url:
            payload["invoice_url"] = invoice_url

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/orders",
                    headers=self._headers(),
                    json=payload,
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to create Printrove order: {e}")
            return self._mock_create_order(reference_number)

    async def get_orders(self, page: int = 1, per_page: int = 20) -> Dict:
        """List all orders."""
        if self.mock_mode:
            return {"data": [], "total": 0}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/orders",
                    headers=self._headers(),
                    params={"page": page, "per_page": per_page},
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to list Printrove orders: {e}")
            return {"data": [], "total": 0}

    async def get_order(self, order_id: str) -> Dict:
        """Get a single order with tracking info."""
        if self.mock_mode:
            return self._mock_order_status(order_id)

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/orders/{order_id}",
                    headers=self._headers(),
                    timeout=30.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Failed to get Printrove order: {e}")
            return self._mock_order_status(order_id)

    async def get_pincode_details(self, pincode: str) -> Dict:
        """Get city/state info for a pincode."""
        if self.mock_mode:
            return {"city": "Mumbai", "state": "Maharashtra"}

        await self._ensure_token()
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.base_url}/pincode/{pincode}",
                    headers=self._headers(),
                    timeout=15.0,
                )
                resp.raise_for_status()
                return resp.json().get("data", resp.json())
        except Exception as e:
            logger.error(f"Pincode lookup failed: {e}")
            return {}

    # ── Mock helpers (dev without credentials) ──────────────────────

    def _mock_categories(self) -> List[Dict]:
        # Matches real Printrove category IDs
        return [
            {"id": 25, "name": "Men's Clothing"},
            {"id": 26, "name": "Women's Clothing"},
            {"id": 27, "name": "Kid's Clothing"},
            {"id": 31, "name": "Accessories"},
        ]

    def _mock_category_products(self, category_id: str) -> List[Dict]:
        # Matches real Printrove product IDs
        products_map = {
            "25": [
                {"id": 460, "name": "Half Sleeve Round Neck T-Shirt", "gst": 5},
                {"id": 461, "name": "Full Sleeve Round Neck T-Shirt", "gst": 5},
                {"id": 463, "name": "Hoodies", "gst": 5},
                {"id": 1216, "name": "Oversized Tshirts", "gst": 5},
                {"id": 1371, "name": "Oversized Hoodies", "gst": 5},
                {"id": 1387, "name": "Bomber Jacket", "gst": 5},
                {"id": 1012, "name": "Sweatshirts", "gst": 5},
                {"id": 1440, "name": "Premium Oversized Tshirt", "gst": 5},
            ],
            "31": [
                {"id": 856, "name": "Mugs", "gst": 5},
                {"id": 860, "name": "Posters", "gst": 18},
                {"id": 1364, "name": "Tote Bags", "gst": 5},
            ],
        }
        return products_map.get(category_id, [])

    def _mock_variants(self, product_id: str) -> Dict:
        return {
            "id": product_id,
            "variants": [
                {"id": f"{product_id}_v1", "size": "S", "color": "Black", "sku": f"SKU-{product_id}-S-BLK"},
                {"id": f"{product_id}_v2", "size": "M", "color": "Black", "sku": f"SKU-{product_id}-M-BLK"},
                {"id": f"{product_id}_v3", "size": "L", "color": "Black", "sku": f"SKU-{product_id}-L-BLK"},
                {"id": f"{product_id}_v4", "size": "XL", "color": "Black", "sku": f"SKU-{product_id}-XL-BLK"},
                {"id": f"{product_id}_v5", "size": "S", "color": "White", "sku": f"SKU-{product_id}-S-WHT"},
                {"id": f"{product_id}_v6", "size": "M", "color": "White", "sku": f"SKU-{product_id}-M-WHT"},
                {"id": f"{product_id}_v7", "size": "L", "color": "White", "sku": f"SKU-{product_id}-L-WHT"},
                {"id": f"{product_id}_v8", "size": "XL", "color": "White", "sku": f"SKU-{product_id}-XL-WHT"},
            ],
        }

    def _mock_upload_design(self, name: str) -> Dict:
        import uuid
        return {
            "id": f"mock_design_{uuid.uuid4().hex[:12]}",
            "name": name,
            "url": "https://placehold.co/4500x5400/png",
            "mock": True,
        }

    def _mock_create_product(self, name: str, parent_id: int) -> Dict:
        import uuid
        return {
            "id": f"mock_product_{uuid.uuid4().hex[:12]}",
            "name": name,
            "parent_product_id": parent_id,
            "variants": [],
            "mock": True,
        }

    def _mock_create_order(self, reference_number: str) -> Dict:
        import uuid
        return {
            "id": f"mock_order_{uuid.uuid4().hex[:12]}",
            "reference_number": reference_number,
            "status": "pending",
            "tracking_number": None,
            "tracking_url": None,
            "mock": True,
        }

    def _mock_order_status(self, order_id: str) -> Dict:
        return {
            "id": order_id,
            "status": "processing",
            "tracking_number": None,
            "tracking_url": None,
            "mock": True,
        }

    def _mock_serviceability(self) -> Dict:
        return {
            "serviceable": True,
            "couriers": [
                {"id": 1, "name": "Delhivery", "estimated_days": "3-5"},
                {"id": 2, "name": "BlueDart", "estimated_days": "2-4"},
            ],
            "mock": True,
        }


# Singleton
printrove_service = PrintroveService()
