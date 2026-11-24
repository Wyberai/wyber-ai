import { daysBetween, dueReminder } from './dates'

export interface ExpiryRow { id: string; domain: string; expires_at: string | null; reminders_sent: number[] | null; email: string | null }

export interface ReminderMail { to: string; subject: string; text: string }

export function reminderMail(kind: 'domain' | 'workspace', domain: string, daysLeft: number, appUrl: string): { subject: string; text: string } {
  const what = kind === 'domain' ? `The domain ${domain}` : `Google Workspace for ${domain}`
  const when = daysLeft <= 1 ? 'tomorrow' : `in ${daysLeft} days`
  const consequence = kind === 'domain'
    ? 'If it is not renewed, your website and any email on this domain stop working.'
    : 'If it is not renewed, the email accounts on this domain stop working.'
  return {
    subject: `${domain} expires ${when}`,
    text: `${what} expires ${when}.\n\n${consequence}\n\nSee it here: ${appUrl}/dashboard/domains\n\nTo renew, open that page and press Renew. It adds the new term after the current date, so you lose no time. Nothing renews by itself.`,
  }
}

/** Picks the reminders due today. Pure: the cron route sends them and records the threshold so each is sent once. */
export function remindersDue(rows: ExpiryRow[], now: Date): { row: ExpiryRow; threshold: number; daysLeft: number }[] {
  const out: { row: ExpiryRow; threshold: number; daysLeft: number }[] = []
  for (const row of rows) {
    if (!row.expires_at || !row.email) continue
    const daysLeft = daysBetween(now, new Date(row.expires_at))
    const threshold = dueReminder(daysLeft, row.reminders_sent ?? [])
    if (threshold != null) out.push({ row, threshold, daysLeft })
  }
  return out
}
