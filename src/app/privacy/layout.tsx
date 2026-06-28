import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How WyberAi collects, uses, and protects your data. We never sell your data or use your projects to train AI models.',
  alternates: { canonical: 'https://wyberai.com/privacy' },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
