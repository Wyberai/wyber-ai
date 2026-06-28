import type { Metadata } from 'next'
import { DocsShell } from './DocsShell'

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Everything you need to build web apps, mobile apps, AI agents, and workflows with WyberAi — in plain English, no code required.',
  alternates: { canonical: 'https://wyberai.com/docs' },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
