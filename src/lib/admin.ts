// Support-mode admin allowlist. Emails here (comma-separated in ADMIN_EMAILS,
// falling back to the founder inbox) can open and edit ANY customer project —
// the "customer shares their project name and we fix it remotely" flow. Keep
// this list tiny: every entry is full write access to all customer projects.
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || 'hello@wyberai.com')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
