import type { Metadata } from 'next'
import { ByosClient } from './ByosClient'
import { SignalFrame } from '@/components/signal/SignalFrame'

export const metadata: Metadata = {
  title: 'Stop Renting Software You Use 5% Of',
  description:
    'Paste the tool you pay for. Pick the features you actually use. WyberAi builds your own version, and you own it.',
  alternates: { canonical: 'https://wyberai.com/byos' },
}

export default function ByosPage() {
  return <SignalFrame><ByosClient /></SignalFrame>
}
