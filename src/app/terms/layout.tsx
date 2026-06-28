import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'WyberAi terms of service. All generated code belongs to you. Use it for any purpose — commercial, open source, client work.',
  alternates: { canonical: 'https://wyberai.com/terms' },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
