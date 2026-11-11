// A spreadsheet-safe CSV. A cell that starts with = + - or @ would run as a formula when opened in Excel or Sheets,
// and these cells hold text a client typed, so they are neutralised with a leading apostrophe.

function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: unknown[][]): string {
  return rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
