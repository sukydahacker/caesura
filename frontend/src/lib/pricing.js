// Mirrors the split formula in backend/services/revenue_service.py — every number
// it uses comes from GET /api/pricing/config (backend/services/pricing_config.py),
// never hardcoded here, so the two stay in sync without duplicating the numbers.

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function calculateSplit(retailPrice, landedCost, config) {
  if (!config || !isFinite(retailPrice) || !isFinite(landedCost)) return null;

  const gatewayFee = round2(retailPrice * config.payment_gateway_fee_rate);
  const netMargin = round2(retailPrice - landedCost - gatewayFee);

  if (netMargin <= 0) {
    return { gatewayFee, netMargin, creatorAmount: 0, platformAmount: 0 };
  }

  let platformAmount = round2(netMargin * config.platform_commission_rate);
  if (platformAmount < config.platform_min_cut) {
    platformAmount = round2(Math.min(config.platform_min_cut, netMargin));
  }
  const creatorAmount = round2(netMargin - platformAmount);

  return { gatewayFee, netMargin, creatorAmount, platformAmount };
}
