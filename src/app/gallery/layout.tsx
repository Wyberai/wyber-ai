import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'App Gallery — Ready-to-Use Web Apps',
  description: 'Browse ready-to-use web apps. SaaS dashboards, CRMs, e-commerce, healthcare, and more. Load instantly at 0 credits, or build something completely custom.',
  alternates: { canonical: 'https://wyberai.com/gallery' },
  // Hidden from search/answer engines: a template gallery contradicts the
  // "fresh code, no templates" positioning. Still reachable in-app for the
  // build-from-template flow, just not indexed or linked from marketing.
  robots: { index: false, follow: true },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
