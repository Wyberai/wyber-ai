import type { Metadata } from 'next'
import { VibeCupMarketplace } from '@/components/vibe-cup/VibeCupMarketplace'

export const metadata: Metadata = {
  title: 'Wybe Cup Marketplace — Vote for your favourite app',
  description: 'Browse and vote for Wybe Cup entries. Most Liked, Most Creative, Best Design, Most Useful — your vote counts.',
}

export default function MarketplacePage() {
  return <VibeCupMarketplace />
}
