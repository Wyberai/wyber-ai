// A domain or Workspace order is paid through a pay-what-you-want checkout whose amount we set. Before the registrar is charged, the
// amount that was REALLY paid must cover the order's total. The payment event states the amount in minor units and a currency.

export type PaymentCheck =
  | { verdict: 'ok' }
  | { verdict: 'short'; reason: string }
  | { verdict: 'unverified'; reason: string }

type EventData = Record<string, unknown> | null | undefined

function paidMinor(data: EventData): number | null {
  for (const k of ['total_amount', 'settlement_amount', 'amount']) {
    const v = Number((data as Record<string, unknown> | undefined)?.[k])
    if (Number.isFinite(v) && v > 0) return Math.round(v)
  }
  return null
}

/**
 * ok          the paid amount (USD, minor units) is at least the order total.
 * short       a different currency, or less than the total: do not register anything, alert a person.
 * unverified  the event carries no amount we can read: the caller decides (it proceeds and alerts, so a field rename never blocks real orders).
 */
export function paymentCoversOrder(totalCents: number, data: EventData): PaymentCheck {
  const paid = paidMinor(data)
  if (paid === null) return { verdict: 'unverified', reason: 'the payment event has no readable amount' }
  const currency = String((data as Record<string, unknown> | undefined)?.currency ?? 'USD').toUpperCase()
  if (currency !== 'USD') return { verdict: 'short', reason: `paid in ${currency}, the order is priced in USD` }
  if (paid < totalCents) return { verdict: 'short', reason: `paid ${paid} but the order total is ${totalCents} (minor units)` }
  return { verdict: 'ok' }
}
