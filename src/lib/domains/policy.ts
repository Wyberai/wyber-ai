import { tldConfig } from './config'

// The refund, renewal and transfer lines shown at confirmation. They restate what the provider's knowledge base says
// (read 2026-11-23, "Deleting a Domain Name"): a domain can be deleted inside the Money Back Grace Period for a refund,
// the length depends on the TLD (4 days for .com and .in), a deletion charge may apply, and deleting stops the website
// and any email on the domain. Where the period is not published for a TLD we say so instead of guessing.

export const POLICY_VERSION = '2026-11-23'

export const PRICE_RULE_LINE = 'Our price is the registry price plus a flat $1. The same $1 applies when you renew.'

export function refundLine(tld: string): string {
  const days = tldConfig(tld)?.moneyBackDays
  if (days != null) {
    return `Refund: you can cancel within ${days} days of registration and get your money back. A small deletion charge can apply, and the website and any email on the domain stop working when it is deleted. After ${days} days a registration is not refundable.`
  }
  return 'Refund: the registry sets a short money-back window after registration, and its length for this extension is not published by our domain provider. Ask support before you buy if you need to know it. After the window a registration is not refundable.'
}

export const TRANSFER_LINE =
  'Transfer: the domain is registered in your name and you can move it to another registrar with its authorization code. New registrations of .com are locked against transfer for 60 days under ICANN rules, and each registry sets its own rule for other extensions.'

export const RENEWAL_LINE =
  'Renewal: domains do not renew by themselves. We email you 30, 14, 7 and 1 days before the domain expires, and you renew it from My domains.'

export function policyLines(tld: string): string[] {
  return [PRICE_RULE_LINE, refundLine(tld), TRANSFER_LINE, RENEWAL_LINE]
}

export function workspacePolicyLines(marginCentsPerSeatMonth: number): string[] {
  const margin = marginCentsPerSeatMonth % 100 === 0 ? `$${marginCentsPerSeatMonth / 100}` : `${marginCentsPerSeatMonth} cents`
  return [
    `Our price is the reseller price for Google Workspace plus a flat ${margin} per seat per month.`,
    'Workspace does not renew by itself. We email you 30, 14, 7 and 1 days before it ends.',
    'We do not promise a refund window for Workspace. If you need a refund, write to support and we will check the order with the provider.',
  ]
}
