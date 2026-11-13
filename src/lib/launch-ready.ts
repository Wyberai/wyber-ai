// Launch-ready web apps: the contract the model must follow, the price shown and charged, and a static check of what was built.
//
// Everything here is OFF unless NEXT_PUBLIC_WEBAPP_LAUNCH_READY=true (read on both the client and the server, same pattern as the
// design-directions flag), so shipping this file changes nothing until the flag is set.
//
// Honest limits, stated in the report the owner sees: the check reads the generated source. It does not run the app in a browser,
// so it can say a feature is present, not that it works. A real browser run is a separate piece of work (see docs/webapp-95-spec.md).

import { creditCost, type BuildSizeTier } from './credits'

export const LAUNCH_READY_MIN_TIER: BuildSizeTier = 'large'

const TIER_ORDER: BuildSizeTier[] = ['small', 'medium', 'large', 'xl']

export function launchReadyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WEBAPP_LAUNCH_READY === 'true'
}

/** Web apps are everything that is not mobile, website or SaaS (those have their own prompts). */
export function isLaunchReadyApp(projectType?: string | null): boolean {
  return launchReadyEnabled() && projectType !== 'mobile' && projectType !== 'website' && projectType !== 'saas'
}

export function floorBuildTier(tier: BuildSizeTier): BuildSizeTier {
  return TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(LAUNCH_READY_MIN_TIER) ? LAUNCH_READY_MIN_TIER : tier
}

/**
 * What a launch-ready build costs, from the same tables the server charges from. `price` is charged up front. `ceiling` is the most a
 * single build can ever cost: the existing overage safety valve tops a build up by at most one tier step (see computeOverageCharge), and
 * the owner sees a receipt when it happens.
 */
export function launchReadyCost(): { price: number; ceiling: number } {
  return {
    price: creditCost('web-build', 'fast', LAUNCH_READY_MIN_TIER),
    ceiling: creditCost('web-build', 'fast', 'xl'),
  }
}

export function launchReadyCostText(): string {
  const { price, ceiling } = launchReadyCost()
  return `${price} credits (up to ${ceiling} only if the build turns out unusually large; you will see a receipt)`
}

// ── The contract ─────────────────────────────────────────────────────────────

export const WEBAPP_LAUNCH_READY_CONTRACT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAUNCH-READY CONTRACT — WEB APPS (OVERRIDES EARLIER RULES WHERE THEY CONFLICT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The owner will put this app in front of real customers or staff the day it is published. Build a finished tool, not a demo. Every item below is checked after the build; missing items are sent back to you to add. When output space is short, drop decoration (grain, shimmer, parallax) before you drop any item here.

LR1 ARCHETYPE: pick ONE for the job (records tool, pipeline, scheduler or booking, stock, money and invoices, reports) and say which in a [progress:] line. Use kanban or drag-and-drop ONLY for a pipeline, and then give every drag a button alternative. Keyboard shortcuts are welcome where they help; they are not mandatory.

LR2 FIRST RUN: the app starts EMPTY for the owner's real business (setup screen asks the shop or business name and whatever the job needs). Never show invented bills, sales, customers or totals as if they were real. Offer one clearly labelled "Load sample data (demo)" button that adds sample rows marked as demo, and a way to remove them. Show a short "Start in 3 steps" panel while there is no data.

LR3 DATA: put all reads and writes in one module, src/lib/db.ts, with small functions (list, get, create, update, remove) over localStorage, wrapped in try/catch, with a schema version. Published apps run in a sandbox where localStorage is a per-browser store, so say plainly in the app: "Saved in this browser only." Never claim sync, cloud, backup, accounts or encryption that you did not build. Provide "Export all data" and "Restore from backup" (JSON). If the owner connected a real database, use it instead and say so.

LR4 FLOWS: full create, read, update, delete for every entity; search, filter and sort on every list; bulk select with a bulk action where lists can grow; Undo toast for deletes. IMPORT: a CSV import that shows a preview and a list of row errors before saving; parse it yourself (quotes, commas inside quotes, BOM, ₹ and Indian digit grouping), do not add an Excel library. EXPORT: CSV of what the user filtered, downloaded through a Blob. PRINT: a print-ready view (@media print and window.print()) for any bill, invoice or report. CHANGE HISTORY: record who changed what and when for prices, stock and money, and show it in a History view.

LR5 MONEY AND PEOPLE: when the job involves customers who owe money or appointments, add a reminder that opens a pre-filled WhatsApp message through a wa.me link. Never say a reminder was sent automatically. Support GST fields only when the prompt is Indian business context. Roles (owner, staff) only when the prompt names a team; a PIN stored in the browser is a screen lock, not security, and the app must say so in one plain sentence.

LR6 LAYOUT: one responsive layout: sidebar navigation from 1024px up, bottom tab bar on phones, no horizontal scroll at 375, 768 and 1280 pixels, tables become cards on phones.

LR7 USABILITY AND ACCESS: every input has a visible label; errors say what is wrong and how to fix it, in plain words; every icon button has an aria-label; visible focus ring on everything focusable (focus-visible); touch targets at least 44px on phones; dialogs trap focus and close on Escape; no action that works only by dragging or hovering; respect prefers-reduced-motion; text contrast must pass on every surface.

LR8 PRIVACY PAGE: a Privacy and Data page that says what is stored and where, offers Export all my data, and offers Delete all my data behind a typed confirmation. Do not claim compliance with any law.

LR9 TRUTH: no invented statistics, testimonials, customer counts or logos. No "synced", "real-time", "secure", "encrypted", "bank-grade" or "AI-powered" unless it is built and true. Words on screen describe what the app really does.

LR10 METADATA: set a real document title and description for this app.

LR11 EDITS: when changing an existing app, change only what was asked and keep every item in this contract working.

LR12 DEFINITION OF DONE (confirm silently before the "Built:" line): empty first run with labelled demo data; db.ts persistence with honest storage wording; CSV import with preview and errors; CSV export; print view; change history; Privacy and Data page with export and delete; responsive navigation; labels, aria-labels and focus rings; Undo for deletes; document title set; no fake sync or invented claims.
`

// ── The check ────────────────────────────────────────────────────────────────

type FileVal = { content?: string } | string | undefined

export interface LaunchReadyItem { id: string; label: string; ok: boolean; fix: string }
export interface LaunchReadyResult { total: number; passed: number; items: LaunchReadyItem[] }

function contentOf(v: FileVal): string { return typeof v === 'string' ? v : (v?.content ?? '') }

interface Check {
  id: string
  label: string
  fix: string
  /** Return false when the check does not apply to this app, so it is neither passed nor failed. */
  applies?: (code: string) => boolean
  test: (code: string) => boolean
}

const count = (re: RegExp, s: string) => (s.match(re) ?? []).length

const CHECKS: Check[] = [
  { id: 'persist', label: 'Data saved through a db module',
    fix: 'Create src/lib/db.ts with list/get/create/update/remove functions over localStorage (try/catch, schema version) and use it for every entity instead of plain useState seed data.',
    test: c => /localStorage/.test(c) && /JSON\.parse/.test(c) && /\/\/ FILE [^\n]*\bdb\b/i.test(c) },
  { id: 'honest-storage', label: 'Says plainly that data is saved in this browser only',
    fix: 'Add a visible line "Saved in this browser only" (header or footer) and on the Privacy and Data page.',
    test: c => /(saved|stored|kept) (in|on) (this|your) (browser|device)|browser only/i.test(c) },
  { id: 'demo-labelled', label: 'Starts empty, with labelled sample data on request',
    fix: 'Start with no records. Add a clearly labelled "Load sample data (demo)" button that adds rows marked as demo, plus a way to remove them. Remove any invented bills, sales or totals from the default state.',
    test: c => /load (the )?(sample|demo) data|sample data \(demo\)|demo data/i.test(c) },
  { id: 'no-fake-sync', label: 'No fake sync or cloud claims',
    fix: 'Remove every "Synced", "real-time", "cloud sync" or similar label. The app saves in the browser only; say that instead.',
    test: c => !/synced (just now|\d+\s?(s|sec|min))|real-?time sync|cloud sync|auto-?sync/i.test(c) || /supabase|fetch\(\s*['"`]https?:/i.test(c) },
  { id: 'import-csv', label: 'CSV import with a preview',
    fix: 'Add a CSV import (file picker, own parser handling quotes and BOM) that shows a preview and a list of row errors before saving anything. Do not add an Excel library.',
    test: c => /\.csv|text\/csv/i.test(c) && /FileReader|\.text\(\)/.test(c) && /preview/i.test(c) },
  { id: 'export-csv', label: 'CSV export',
    fix: 'Add "Export CSV" on each list, exporting what the user filtered, using a Blob and a download link.',
    test: c => /text\/csv/i.test(c) && /Blob|createObjectURL/.test(c) && /download/i.test(c) },
  { id: 'print', label: 'Print-ready view',
    fix: 'Add a print-ready view for bills, invoices or reports using @media print styles and window.print().',
    test: c => /window\.print\(\)|@media print/.test(c) },
  { id: 'history', label: 'Change history',
    fix: 'Record who changed what and when for prices, stock and money, and add a History view listing it.',
    test: c => /change ?history|audit|activity log|history/i.test(c) && /(timestamp|new Date|toISOString|Date\.now)/.test(c) },
  { id: 'privacy', label: 'Privacy and Data page with export and delete',
    fix: 'Add a Privacy and Data page: what is stored and where, "Export all my data", and "Delete all my data" behind a typed confirmation. No compliance claims.',
    test: c => /privacy/i.test(c) && /(export|download|backup)[^\n]{0,24}data|data[^\n]{0,24}(export|backup)/i.test(c) && /(delete|erase|clear)[^\n]{0,24}(all|my)[^\n]{0,24}data|delete all/i.test(c) },
  { id: 'labels', label: 'Labelled inputs and buttons',
    fix: 'Give every input a visible <label> and every icon-only button an aria-label.',
    test: c => count(/aria-label|aria-labelledby|<label/g, c) >= 6 },
  { id: 'focus', label: 'Visible keyboard focus',
    fix: 'Add a visible focus ring (focus-visible:ring-2 or equivalent) to buttons, links and inputs.',
    test: c => /focus-visible|focus:ring|focus:outline|:focus-visible/.test(c) },
  { id: 'responsive', label: 'Responsive navigation',
    fix: 'Use a sidebar from lg (1024px) up and a bottom tab bar on phones; no horizontal scroll at 375, 768 and 1280.',
    test: c => /\blg:/.test(c) && /(hidden[^"'`]{0,40}\blg:|\blg:hidden|\bmd:hidden|\bmd:flex|\blg:flex)/.test(c) },
  { id: 'undo', label: 'Undo for deletes',
    fix: 'After deleting a record, show an Undo toast that restores it.',
    test: c => /undo/i.test(c) },
  { id: 'title', label: 'Real document title',
    fix: 'Set document.title (and the description meta) to this app\'s name and purpose.',
    test: c => /document\.title|<title>/.test(c) },
  { id: 'no-invented-claims', label: 'No invented or unbuilt claims',
    fix: 'Remove invented statistics and unbuilt claims such as "bank-grade", "encrypted", "SOC 2", "GDPR compliant" or "trusted by N".',
    test: c => !/(bank-grade|military-grade|end-to-end encrypt|secure cloud|256-bit|soc ?2|gdpr[- ]compliant|trusted by \d)/i.test(c) },
  { id: 'whatsapp-reminder', label: 'WhatsApp reminder as a pre-filled link',
    fix: 'For customers who owe money or upcoming appointments, add a reminder button that opens a wa.me link with a pre-filled message. Never claim it was sent automatically.',
    applies: c => /udhaar|overdue|outstanding|reminder|appointment|due date/i.test(c),
    test: c => /wa\.me\//.test(c) },
  { id: 'pin-honest', label: 'Says a browser PIN is only a screen lock',
    fix: 'Next to the PIN setup add one plain sentence: it stops casual access on this device and is not security.',
    applies: c => /\bpin\b/i.test(c),
    test: c => /(screen lock|casual|not (a )?security|not secure|only a lock|this device)/i.test(c) },
]

export function checkLaunchReady(files: Record<string, FileVal>): LaunchReadyResult {
  const code = Object.entries(files || {})
    .filter(([p]) => /\.(tsx?|jsx?|css|html)$/.test(p))
    .map(([p, v]) => `// FILE ${p}\n${contentOf(v)}`)
    .join('\n')
  const items: LaunchReadyItem[] = []
  for (const c of CHECKS) {
    if (c.applies && !c.applies(code)) continue
    items.push({ id: c.id, label: c.label, ok: c.test(code), fix: c.fix })
  }
  return { total: items.length, passed: items.filter(i => i.ok).length, items }
}

/** What the owner sees. Says "present", never "works": this is a source check, not a browser run. */
export function launchReadySummary(r: LaunchReadyResult): string {
  const missing = r.items.filter(i => !i.ok)
  if (missing.length === 0) return `Launch-ready check: all ${r.total} items are present in the code. This reads the source; it does not run the app in a browser.`
  return `Launch-ready check: ${r.passed} of ${r.total} items present. Adding: ${missing.map(m => m.label.toLowerCase()).join('; ')}.`
}

/** Failing items as fix prompts for the free self-heal lane (at most four per pass, like the structural checks). */
export function launchReadyIssues(files: Record<string, FileVal>): { kind: 'launch-ready'; detail: string; fixPrompt: string }[] {
  return checkLaunchReady(files).items
    .filter(i => !i.ok)
    .slice(0, 4)
    .map(i => ({
      kind: 'launch-ready' as const,
      detail: i.label,
      fixPrompt: `LAUNCH-READY item missing: ${i.label}. ${i.fix} Change only what is needed and keep everything else working.`,
    }))
}
