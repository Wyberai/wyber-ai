import { redirect } from 'next/navigation'

// Workflows isn't live yet (Web + Mobile are the only shipped products) —
// gate the whole route tree here (list page + every individual /flows/[id]
// editor) so it's unreachable by direct URL, not just unlinked from nav.
export default function FlowsLayout() {
  redirect('/coming-soon?product=Workflows')
}
