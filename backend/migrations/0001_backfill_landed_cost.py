"""
One-off backfill: recompute base_cost on existing product rows using the real
landed-cost formula (services/pricing_config.py), replacing the old flat ₹500
placeholder. Run once, after 0001_revenue_split_60_40.sql.

Usage: cd backend && python migrations/0001_backfill_landed_cost.py
"""
import asyncio
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))
from dotenv import load_dotenv
load_dotenv(ROOT_DIR / '.env')

from db import fetch_all, execute, close_pool
from services import pricing_config
from services.qikink_service import qikink_service


async def main():
    products = await fetch_all("SELECT product_id, apparel_type, base_cost FROM products")
    if not products:
        print("No products to backfill.")
        return

    # Conservative fallback for legacy rows whose apparel_type predates the
    # Qikink catalog integration and doesn't resolve to a known product type.
    all_base_prices = [p for meta in qikink_service.PRODUCT_META.values() for p in meta.get("base_prices", [])]
    fallback_base_price = max(all_base_prices) if all_base_prices else 0.0

    for p in products:
        apparel_type = p["apparel_type"]
        breakdown = pricing_config.compute_landed_cost(apparel_type)
        if breakdown["base_price"] == 0.0:
            print(f"  ! {p['product_id']}: apparel_type '{apparel_type}' not in Qikink catalog — "
                  f"using highest known base price (₹{fallback_base_price}) as a conservative fallback.")
            gst = round(fallback_base_price * pricing_config.GST_RATE, 2)
            landed_cost = round(
                fallback_base_price + pricing_config.PRINTING_CHARGE + pricing_config.HANDLING_CHARGE
                + gst + pricing_config.SHIPPING_ALLOWANCE, 2
            )
        else:
            landed_cost = breakdown["landed_cost"]

        await execute(
            "UPDATE products SET base_cost = $1 WHERE product_id = $2",
            landed_cost, p["product_id"],
        )
        print(f"  {p['product_id']} ({apparel_type}): base_cost {p['base_cost']} -> {landed_cost}")

    await close_pool()
    print(f"Backfilled base_cost on {len(products)} product row(s).")


if __name__ == "__main__":
    asyncio.run(main())
