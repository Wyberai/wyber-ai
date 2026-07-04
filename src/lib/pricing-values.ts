// Charged USD amount per checkout plan key. Single source of truth shared by
// the checkout route (attaches value to the return URL for client conversions)
// and the Dodo webhook (reports Purchase revenue to Meta CAPI / analytics).
// Annual = monthly-equivalent × 12. 0 = value unknown/not publicly sold — the
// conversion still fires, just without a revenue figure.
export const PLAN_VALUE: Record<string, number> = {
  starter_monthly: 29, builder_monthly: 79, pro_monthly: 199, growth_monthly: 0, scale_monthly: 0,
  starter_annual: 276, builder_annual: 756, pro_annual: 1908, growth_annual: 0, scale_annual: 0,
  topup_200: 19, topup_600: 49, topup_2000: 99,
}
