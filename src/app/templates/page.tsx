import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'App templates',
  description: 'Start a WyberAi project from a ready-made template.',
  // The list is drawn in the browser, so there is almost no text in the page for a crawler yet.
  robots: { index: false, follow: true },
}

export default function TemplatesPage() {
  redirect('/gallery')
}
