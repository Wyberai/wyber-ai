import { createServiceClient } from '@/lib/supabase/server';

/**
 * Real (never fabricated) count of projects that actually have generated
 * content — same `files is not null` filter the email-drip cron already uses
 * to distinguish a real build from an empty/abandoned project. Used by the
 * homepage's telemetry strip, which previously hardcoded "2,400+" as a
 * literal string that could never update. Best-effort: a query failure just
 * falls back to null so the caller can show nothing rather than a stale lie.
 */
export async function getAppsBuiltCount(): Promise<number | null> {
  try {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .not('files', 'is', null);
    return count ?? null;
  } catch {
    return null;
  }
}

/** "2,400+" style rounded-down display string — real number, rounded to avoid
 * implying false precision, with a "+" so it reads as a floor, not an exact
 * live counter that would look broken if it doesn't tick in real time. */
export function formatAppsBuiltStat(count: number): string {
  if (count >= 1000) {
    const thousands = Math.floor(count / 100) / 10; // one decimal, e.g. 2.4
    return `${thousands}k+`;
  }
  const floor = Math.floor(count / 100) * 100;
  return floor > 0 ? `${floor}+` : `${count}`;
}
