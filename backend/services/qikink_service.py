"""
Qikink Print-on-Demand Integration
Docs: https://documenter.getpostman.com/view/26157218/2sA3kUG2mr

Auth flow: POST /api/token → Accesstoken (valid 1 hour, refreshed automatically)
Orders:    POST /api/order/create  → qikink order_id
Status:    GET  /api/order?id=...  → order details + tracking
"""

import os
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

_SANDBOX_URL = "https://sandbox.qikink.com"
_LIVE_URL    = "https://api.qikink.com"


class QikinkService:
    # ── Qikink SKU map: apparel_type → color → size → SKU
    # These must match the SKUs shown in your Qikink dashboard.
    # Update when new product types are added.
    SKU_MAP: Dict[str, Dict[str, Dict[str, str]]] = {
        "tshirt": {
            "white": {"S": "RTs-Wh-S",  "M": "RTs-Wh-M",  "L": "RTs-Wh-L",  "XL": "RTs-Wh-XL",  "XXL": "RTs-Wh-XXL"},
            "black": {"S": "RTs-Bk-S",  "M": "RTs-Bk-M",  "L": "RTs-Bk-L",  "XL": "RTs-Bk-XL",  "XXL": "RTs-Bk-XXL"},
            "navy":  {"S": "RTs-Nv-S",  "M": "RTs-Nv-M",  "L": "RTs-Nv-L",  "XL": "RTs-Nv-XL",  "XXL": "RTs-Nv-XXL"},
        },
        "oversized_tshirt": {
            "white": {"S": "OTs-Wh-S",  "M": "OTs-Wh-M",  "L": "OTs-Wh-L",  "XL": "OTs-Wh-XL",  "XXL": "OTs-Wh-XXL"},
            "black": {"S": "OTs-Bk-S",  "M": "OTs-Bk-M",  "L": "OTs-Bk-L",  "XL": "OTs-Bk-XL",  "XXL": "OTs-Bk-XXL"},
        },
        "hoodie": {
            "white": {"S": "Hd-Wh-S",   "M": "Hd-Wh-M",   "L": "Hd-Wh-L",   "XL": "Hd-Wh-XL",   "XXL": "Hd-Wh-XXL"},
            "black": {"S": "Hd-Bk-S",   "M": "Hd-Bk-M",   "L": "Hd-Bk-L",   "XL": "Hd-Bk-XL",   "XXL": "Hd-Bk-XXL"},
        },
    }

    # print_type_id 17 = DTF — prints on all fabric types, best default for POD
    DEFAULT_PRINT_TYPE = 17

    def __init__(self) -> None:
        self.client_id     = os.environ.get("QIKINK_CLIENT_ID", "")
        self.client_secret = os.environ.get("QIKINK_CLIENT_SECRET", "")
        use_sandbox        = os.environ.get("QIKINK_SANDBOX", "true").lower() != "false"
        self.base_url      = _SANDBOX_URL if use_sandbox else _LIVE_URL
        self._token: Optional[str]          = None
        self._token_expires: Optional[datetime] = None

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    # ── Token management ────────────────────────────────────────────────────────

    async def _get_token(self) -> str:
        """Return a valid access token, fetching a new one if needed."""
        now = datetime.now(timezone.utc)
        if self._token and self._token_expires and now < self._token_expires:
            return self._token

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/token",
                data={"ClientId": self.client_id, "client_secret": self.client_secret},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        self._token = data["Accesstoken"]
        # Expire 60 s early to avoid edge cases
        self._token_expires = now + timedelta(seconds=data.get("expires_in", 3600) - 60)
        logger.info("Qikink: refreshed access token")
        return self._token

    def _headers(self, token: str) -> Dict[str, str]:
        return {
            "ClientId":    self.client_id,
            "Accesstoken": token,
            "Content-Type": "application/json",
        }

    # ── SKU helpers ─────────────────────────────────────────────────────────────

    def resolve_sku(self, apparel_type: str, color: str, size: str) -> str:
        """Map product attributes → Qikink variant SKU."""
        by_color = self.SKU_MAP.get(apparel_type, self.SKU_MAP["tshirt"])
        by_size  = by_color.get(color.lower(), by_color.get("white", {}))
        sku = by_size.get(size)
        if not sku:
            # Best-effort fallback so the order still reaches Qikink
            logger.warning(f"Qikink: no SKU for {apparel_type}/{color}/{size}, using tshirt/white/{size}")
            sku = self.SKU_MAP["tshirt"]["white"].get(size, f"RTs-Wh-{size}")
        return sku

    # ── Order creation ──────────────────────────────────────────────────────────

    async def create_order(
        self,
        order_number: str,
        items: List[Dict[str, Any]],
        shipping_address: Dict[str, Any],
        total_order_value: float,
    ) -> Dict[str, Any]:
        """
        Forward a paid Caesura order to Qikink for printing + shipping.

        Each item dict must contain:
          product:  {apparel_type, ...}
          design:   {design_id, image_url, print_metadata, ...}
          size:     "S" | "M" | "L" | "XL" | "XXL"
          quantity: int
          price:    float
          color:    str  (optional, defaults to "white")
        """
        if not self.is_configured:
            raise ValueError("Qikink not configured — set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET in .env")

        token = await self._get_token()

        line_items = []
        for item in items:
            product = item["product"]
            design  = item["design"]
            size    = item["size"]
            color   = item.get("color", "white")

            image_url = design.get("image_url", "")

            # Qikink requires a public HTTP(S) URL — skip base64 images
            if image_url.startswith("data:"):
                logger.warning(
                    f"Qikink: design {design.get('design_id')} has a base64 image URL. "
                    "Upload the design via /upload/design to get a hosted URL before ordering."
                )
                raise ValueError(
                    f"Design image for '{design.get('title', 'unknown')}' is not publicly accessible. "
                    "Re-upload your design to generate a hosted URL."
                )

            # Use design_id as the Qikink design_code (stable per design)
            design_code = design.get("design_id", f"caesura_{uuid_short()}")

            # Derive print dimensions from stored metadata (cm → inches)
            print_size  = _extract_print_size(design)
            width_in    = round(print_size["width_cm"]  / 2.54, 2)
            height_in   = round(print_size["height_cm"] / 2.54, 2)

            sku = item.get("qikink_sku") or self.resolve_sku(
                product.get("apparel_type", "tshirt"), color, size
            )

            line_items.append({
                "search_from_my_products": 0,
                "quantity": str(item["quantity"]),
                "print_type_id": self.DEFAULT_PRINT_TYPE,
                "price": str(item["price"]),
                "sku": sku,
                "designs": [{
                    "design_code":   design_code,
                    "width_inches":  str(width_in),
                    "height_inches": str(height_in),
                    "placement_sku": "fr",        # front placement
                    "design_link":   image_url,
                    "mockup_link":   image_url,
                }],
            })

        addr       = shipping_address
        name_parts = addr.get("name", "Customer").split(" ", 1)
        first_name = name_parts[0]
        last_name  = name_parts[1] if len(name_parts) > 1 else ""

        payload = {
            "order_number":      order_number,
            "qikink_shipping":   1,
            "gateway":           "Prepaid",
            "total_order_value": str(total_order_value),
            "line_items":        line_items,
            "shipping_address": {
                "first_name":   first_name,
                "last_name":    last_name,
                "address1":     addr.get("address", addr.get("address1", "")),
                "address2":     addr.get("address2", ""),
                "phone":        addr.get("phone", ""),
                "email":        addr.get("email", ""),
                "city":         addr.get("city", ""),
                "zip":          str(addr.get("pincode", addr.get("zip", ""))),
                "province":     addr.get("state", addr.get("province", "")),
                "country_code": addr.get("country_code", "IN"),
            },
        }

        logger.info(f"Qikink: creating order {order_number} with {len(line_items)} line item(s)")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/order/create",
                json=payload,
                headers=self._headers(token),
                timeout=30.0,
            )
            resp.raise_for_status()
            result = resp.json()

        logger.info(f"Qikink: order {order_number} → qikink_order_id={result.get('order_id')}")
        return result

    # ── Order status ────────────────────────────────────────────────────────────

    async def get_order_status(self, qikink_order_id: int) -> Dict[str, Any]:
        """Fetch order status from Qikink. Returns the order dict or {}."""
        if not self.is_configured:
            raise ValueError("Qikink not configured")

        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/api/order",
                params={"id": qikink_order_id},
                headers=self._headers(token),
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        return data[0] if isinstance(data, list) and data else {}

    # ── Token health check ───────────────────────────────────────────────────────

    async def ping(self) -> bool:
        """Return True if credentials are valid and API is reachable."""
        if not self.is_configured:
            return False
        try:
            await self._get_token()
            return True
        except Exception as e:
            logger.error(f"Qikink ping failed: {e}")
            return False


# ── Private helpers ──────────────────────────────────────────────────────────────

def _extract_print_size(design: dict) -> dict:
    """Pull first product's final_print_size from print_metadata, or return safe defaults."""
    meta      = design.get("print_metadata") or {}
    products  = meta.get("products", [])
    size_data = products[0].get("final_print_size", {}) if products else {}
    return {
        "width_cm":  size_data.get("width_cm",  32.0),
        "height_cm": size_data.get("height_cm", 40.0),
    }


def uuid_short() -> str:
    import uuid
    return uuid.uuid4().hex[:12]


# Singleton used throughout the app
qikink_service = QikinkService()
