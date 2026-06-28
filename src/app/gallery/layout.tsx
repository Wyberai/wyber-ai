import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'App Gallery — Ready-to-Use Web Apps',
  description: 'Browse ready-to-use web apps. SaaS dashboards, CRMs, e-commerce, healthcare, and more. Load instantly at 0 credits, or build something completely custom.',
  alternates: { canonical: 'https://wyberai.com/gallery' },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
