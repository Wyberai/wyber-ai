export function addYears(d: Date, years: number): Date {
  const out = new Date(d)
  out.setUTCFullYear(out.getUTCFullYear() + years)
  return out
}

export const daysBetween = (from: Date, to: Date): number => Math.ceil((to.getTime() - from.getTime()) / 86_400_000)

/** The reminder thresholds, in days before expiry. */
export const REMINDER_DAYS = [30, 14, 7, 1] as const

/**
 * Which reminder (if any) is due now: the smallest threshold that the remaining days have fallen to or below
 * and that has not been sent yet. Sending only one per run keeps a long-silent cron from emailing four times at once.
 */
export function dueReminder(daysLeft: number, alreadySent: number[]): number | null {
  // Once it has expired: one "it has expired" notice (threshold 0), for up to 30 days after, so a missed renewal is not silent.
  if (daysLeft < 0) return alreadySent.includes(0) || daysLeft < -30 ? null : 0
  const due = REMINDER_DAYS.filter(t => daysLeft <= t && !alreadySent.includes(t))
  return due.length ? Math.min(...due) : null
}

export function addMonths(d: Date, months: number): Date {
  const out = new Date(d)
  out.setUTCMonth(out.getUTCMonth() + months)
  return out
}
