import { redirect } from 'next/navigation'

// AI Employees isn't live yet (Web + Mobile are the only shipped products) —
// gate the whole route tree here so every nested page (roles, hire, onboard,
// admin, knowledge, marketing-manager) is unreachable by direct URL, not just
// unlinked from nav. CommandPalette already routes here for its "coming soon"
// entries; this makes the guarantee real instead of relying on nobody typing
// the URL.
export default function AiEmployeesLayout() {
  redirect('/coming-soon?product=AI+Employees')
}
