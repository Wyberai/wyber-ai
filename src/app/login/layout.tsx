import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to WyberAi.',
  // A sign-in form is not something to rank: keep it out of the index.
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
