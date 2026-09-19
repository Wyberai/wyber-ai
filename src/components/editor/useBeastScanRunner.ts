'use client';
import { useRef, useState } from 'react';
import type { ChecklistResult } from './BeastScanChecklist';

// Shared state machine behind every Beast scan surface (Wyberman chat, the
// Security tab, the SEO tab): idle -> preview (show the full checklist,
// nothing charged yet) -> scanning (user hit "Go ahead", credits charged,
// waiting on the deterministic server-side scan, which is near-instant) ->
// revealing (results are back; tick them off one at a time on a short
// interval so it reads as "working through the list" instead of an instant
// dump) -> done. One hook, reused by every consumer instead of three
// hand-rolled copies of the same timer logic.

export interface BeastScanReport {
  score: number;
  checks: ChecklistResult[];
  cost?: number;
  creditsRemaining?: number;
  scannedAt?: string;
  // Mechanically-generated fixes for whichever checks are safe to fix without
  // code judgment (path -> full new file content) — see security-beast-scan.ts
  // and seo-beast-fix.ts for what's included and why the rest is deliberately
  // left to "Apply all fixes"'s AI-prompt path instead.
  fixedFiles?: Record<string, string>;
  fixedCheckIds?: string[];
}

export type BeastScanPhase = 'idle' | 'preview' | 'scanning' | 'revealing' | 'done';

const REVEAL_INTERVAL_MS = 130;

export function useBeastScanRunner() {
  const [phase, setPhase] = useState<BeastScanPhase>('idle');
  const [results, setResults] = useState<ChecklistResult[] | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [report, setReport] = useState<BeastScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const showPreview = () => { setError(null); setPhase('preview'); };
  const cancelPreview = () => { setPhase('idle'); };

  // Returns the error message on failure (or null on success) so the caller
  // — always a click handler, e.g. Wyberman's goAheadSecurity — can react to
  // a failed scan right where it happens, instead of watching `error` from a
  // useEffect (a setState-in-effect anti-pattern for what's really a direct
  // response to a user action).
  const run = async (fetcher: () => Promise<Response>): Promise<string | null> => {
    setPhase('scanning');
    setError(null);
    setResults(null);
    setRevealCount(0);
    try {
      const res = await fetcher();
      const json = await res.json();
      if (!res.ok) {
        const message = json.error || 'Scan failed';
        setError(message);
        setPhase('idle');
        return message;
      }
      const checks: ChecklistResult[] = json.checks ?? [];
      setReport(json);
      setResults(checks);
      setPhase(checks.length === 0 ? 'done' : 'revealing');
      let count = 0;
      stopTimer();
      timerRef.current = setInterval(() => {
        count++;
        setRevealCount(count);
        if (count >= checks.length) {
          stopTimer();
          setPhase('done');
        }
      }, REVEAL_INTERVAL_MS);
      return null;
    } catch (e) {
      const message = String(e);
      setError(message);
      setPhase('idle');
      return message;
    }
  };

  const reset = () => {
    stopTimer();
    setPhase('idle'); setResults(null); setRevealCount(0); setReport(null); setError(null);
  };

  // Called right after "Apply all fixes" writes report.fixedFiles into the
  // project — flips those specific checks to 'pass' in the displayed
  // checklist without a second scan round-trip. Safe because fixedCheckIds
  // is only ever populated (by the scan engines) alongside a real file that
  // was included in fixedFiles, so "marked fixed" here always corresponds to
  // a file that was actually just written.
  const markChecksFixed = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const flip = (c: ChecklistResult): ChecklistResult =>
      idSet.has(c.id) ? { ...c, status: 'pass', detail: 'Fixed automatically — applied to your project.' } : c;
    setResults(prev => (prev ? prev.map(flip) : prev));
    setReport(prev => (prev ? { ...prev, checks: prev.checks.map(flip) } : prev));
  };

  return { phase, results, revealCount, report, error, showPreview, cancelPreview, run, reset, markChecksFixed };
}
