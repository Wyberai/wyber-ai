import { createServiceClient } from '@/lib/supabase/server';

export interface ScanStats { totalScans: number; cleanPct: number }

/**
 * Real (never fabricated) aggregate across every scan the RLS Trust Scanner
 * has ever run — count-only, RLS-bypassing service client, but nothing
 * per-row, per-project, or per-user ever leaves this function. Used by the
 * homepage and the security page so the "proof" they show visitors is an
 * actual number, not marketing copy. Best-effort: a query failure just hides
 * the stat rather than breaking the page.
 */
export async function getScanStats(): Promise<ScanStats | null> {
  try {
    const supabase = createServiceClient();
    const { count: totalScans } = await supabase
      .from('security_scans')
      .select('id', { count: 'exact', head: true });
    const { count: cleanScans } = await supabase
      .from('security_scans')
      .select('id', { count: 'exact', head: true })
      .eq('critical_count', 0);
    if (!totalScans) return null;
    return { totalScans, cleanPct: Math.round(((cleanScans ?? 0) / totalScans) * 100) };
  } catch {
    return null;
  }
}
