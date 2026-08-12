"""
Single source of truth for Caesura's landed-cost and revenue-split economics.

Every ₹ figure that isn't the live Qikink base price lives here, loaded from
PRICING_* env vars (see backend/.env) with sane defaults. Nothing pricing-related
should be hardcoded anywhere else in the codebase — change the env vars to retune.
"""
import os
from typing import Optional
from services.qikink_service import qikink_service


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


# ── Landed-cost surcharges (₹, flat per unit unless noted) ──────────────────
PRINTING_CHARGE    = _env_float("PRICING_PRINTING_CHARGE", 40.0)
HANDLING_CHARGE    = _env_float("PRICING_HANDLING_CHARGE", 30.0)
SHIPPING_ALLOWANCE = _env_float("PRICING_SHIPPING_ALLOWANCE", 60.0)
GST_RATE           = _env_float("PRICING_GST_RATE", 0.05)  # applied to Qikink base price only

# ── Creator markup floor ─────────────────────────────────────────────────────
MIN_MARKUP = _env_float("PRICING_MIN_MARKUP", 250.0)  # ₹ retail must clear above landed cost

# ── Revenue split ────────────────────────────────────────────────────────────
CREATOR_COMMISSION_RATE  = _env_float("PRICING_CREATOR_COMMISSION_RATE", 0.60)
PLATFORM_COMMISSION_RATE = _env_float("PRICING_PLATFORM_COMMISSION_RATE", 0.40)
PAYMENT_GATEWAY_FEE_RATE = _env_float("PRICING_PAYMENT_GATEWAY_FEE_RATE", 0.02)  # % of retail
PLATFORM_MIN_CUT         = _env_float("PRICING_PLATFORM_MIN_CUT", 100.0)  # ₹ floor per item


def _resolve_catalog_key(product_type: str) -> Optional[str]:
    """
    Match a product_type to its qikink_meta.json key.

    The catalog frontend expands each product per gender for display, e.g.
    "Terry Oversized Tee | UT27" becomes "Unisex Terry Oversized Tee | UT27" —
    that gender-prefixed string is what actually gets stored as product_type,
    so an exact match against the raw meta key isn't enough.
    """
    if product_type in qikink_service.PRODUCT_META:
        return product_type
    alias = qikink_service._ALIASES.get(product_type)
    if alias and alias in qikink_service.PRODUCT_META:
        return alias
    lowered = product_type.lower()
    for key in qikink_service.PRODUCT_META:
        if lowered == key.lower() or lowered.endswith(key.lower()):
            return key
    return None


def get_qikink_base_price(product_type: str) -> float:
    """
    Highest published Qikink base price for this product type.

    qikink_meta.json stores base_prices as a list — Qikink tiers price by size
    (plus-size upcharges) but doesn't publish a size→tier map we can verify, so
    we take the max as a conservative landed cost: it never under-costs a size,
    which is what the minimum-markup floor and revenue split both depend on.
    """
    key = _resolve_catalog_key(product_type)
    prices = qikink_service.PRODUCT_META.get(key, {}).get("base_prices") if key else []
    return max(prices) if prices else 0.0


def compute_landed_cost(product_type: str) -> dict:
    """True landed cost for a product: Qikink base price + printing + handling + GST + shipping."""
    base_price = get_qikink_base_price(product_type)
    gst = round(base_price * GST_RATE, 2)
    landed_cost = round(base_price + PRINTING_CHARGE + HANDLING_CHARGE + gst + SHIPPING_ALLOWANCE, 2)
    return {
        "product_type": product_type,
        "base_price": round(base_price, 2),
        "printing_charge": PRINTING_CHARGE,
        "handling_charge": HANDLING_CHARGE,
        "shipping_allowance": SHIPPING_ALLOWANCE,
        "gst_rate": GST_RATE,
        "gst": gst,
        "landed_cost": landed_cost,
        "min_markup": MIN_MARKUP,
        "min_price": round(landed_cost + MIN_MARKUP, 2),
    }


def validate_retail_price(product_type: str, retail_price: float) -> dict:
    """Raise ValueError if retail_price doesn't clear landed cost + minimum markup. Returns the breakdown on success."""
    breakdown = compute_landed_cost(product_type)
    if retail_price < breakdown["min_price"]:
        raise ValueError(
            f"Price ₹{retail_price:.2f} is below the minimum of ₹{breakdown['min_price']:.2f} "
            f"(landed cost ₹{breakdown['landed_cost']:.2f} + ₹{MIN_MARKUP:.0f} minimum markup)."
        )
    return breakdown


def public_config() -> dict:
    """Non-secret pricing constants the frontend needs to render a live breakdown."""
    return {
        "printing_charge": PRINTING_CHARGE,
        "handling_charge": HANDLING_CHARGE,
        "shipping_allowance": SHIPPING_ALLOWANCE,
        "gst_rate": GST_RATE,
        "min_markup": MIN_MARKUP,
        "creator_commission_rate": CREATOR_COMMISSION_RATE,
        "platform_commission_rate": PLATFORM_COMMISSION_RATE,
        "payment_gateway_fee_rate": PAYMENT_GATEWAY_FEE_RATE,
        "platform_min_cut": PLATFORM_MIN_CUT,
    }
