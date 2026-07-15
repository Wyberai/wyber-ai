import type { Metadata } from 'next'
import ToolsClient from './ToolsClient'

export const metadata: Metadata = {
  title: 'Free App Security + SEO Scanner — WyberAi',
  description:
    'Is your app leaking user data, and can Google find it? Run a free security scan (attacker’s-eye database probe) and SEO audit in seconds. No signup.',
  openGraph: {
    title: 'Is your app safe and findable? Free scan.',
    description: 'A real attacker’s-eye security scan + full SEO audit for your app. No signup, instant results.',
    type: 'website',
  },
}

export default function ToolsPage() {
  return <ToolsClient />
}
