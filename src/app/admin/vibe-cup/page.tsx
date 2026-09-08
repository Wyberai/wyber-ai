import type { Metadata } from 'next'
import { VibeCupAdmin } from '@/components/vibe-cup/VibeCupAdmin'

export const metadata: Metadata = { title: 'Wybe Cup Admin' }

export default function VibeCupAdminPage() {
  return <VibeCupAdmin />
}
