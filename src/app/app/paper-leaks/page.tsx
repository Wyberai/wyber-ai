import type { Metadata } from 'next'
import { PaperLeaksClient } from './PaperLeaksClient'

export const metadata: Metadata = {
  title: 'Paper Leaks Dashboard — an independent record of exam paper leaks in India',
  description: 'An independent, non-partisan public dashboard documenting exam paper-leak incidents in India — what happened, sources, and outcomes. Not affiliated with any political party. Not for sale.',
  openGraph: {
    title: 'Paper Leaks Dashboard',
    description: 'An independent, non-partisan record of exam paper-leak incidents in India — sourced, dated, and status-tracked.',
    url: 'https://wyberai.com/app/paper-leaks',
  },
}

export default function PaperLeaksPage() {
  return <PaperLeaksClient />
}
