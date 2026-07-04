// Charged USD amount per checkout plan key. Single source of truth shared by
// the checkout route (attaches value to the return URL for client conversions)
// and the Dodo webhook (reports Purchase revenue to Meta CAPI / analytics).
// Annual = monthly-equivalent × 12. 0 = value unknown/not publicly sold — the
// conversion still fires, just without a revenue figure.
export const PLAN_VALUE: Record<string, number> = {
  spark_monthly: 6, spark_annual: 58,
  starter_monthly: 29, builder_monthly: 79, pro_monthly: 199, growth_monthly: 0, scale_monthly: 0,
  starter_annual: 276, builder_annual: 756, pro_annual: 1908, growth_annual: 0, scale_annual: 0,
  topup_200: 19, topup_600: 49, topup_2000: 99,
}

// India (INR) charged amounts — smart-localized price points, NOT a straight FX
// conversion of the USD values above. Reported to analytics with currency=INR
// when a checkout is completed in rupees. Keep keys in sync with PLAN_VALUE.
export const PLAN_VALUE_INR: Record<string, number> = {
  spark_monthly: 499, spark_annual: 4790,
  starter_monthly: 1499, builder_monthly: 3999, pro_monthly: 9999,
  starter_annual: 14390, builder_annual: 38390, pro_annual: 95990,
  topup_200: 399, topup_600: 999, topup_2000: 1999,
}
