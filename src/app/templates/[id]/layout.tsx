import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting up your project',
  // This URL starts a project from a template and sends the visitor on (a client-side redirect). It is an action, not a
  // page, and Search Console reported about 70 of these as "Page with redirect".
  robots: { index: false, follow: false },
}

export default function TemplateLayout({ children }: { children: React.ReactNode }) {
  return children
}
