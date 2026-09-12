import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { currentWplMonth } from '@/lib/challenge'
import { sendWplMonthlyReminder } from '@/lib/email'

export const maxDuration = 60

// Fires on the last few days of every month (schedule covers days 28-31 so it
// works regardless of month length); only actually sends on the final day of
// the month, so it can't double-fire. Reminds the founder to assign WPL
// Champion / Most Creative before the period rolls — Fan Favorite is fully
// automatic by vote count and needs no reminder.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const isLastDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate() === now.getUTCDate()
  if (!isLastDayOfMonth) return NextResponse.json({ skipped: true, reason: 'not month-end yet' })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const period = currentWplMonth()
  const { data: entries, error } = await admin
    .from('challenge_entries')
    .select('title, vote_count, award')
    .eq('period', period)
    .eq('status', 'approved')
    .order('vote_count', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await sendWplMonthlyReminder(period, entries ?? [])
  return NextResponse.json({ success: true, period, candidates: entries?.length ?? 0 })
}
