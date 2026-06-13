import { DocsPage, DocSection, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'How Credits Work — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Getting Started"
      title="How credits work"
      intro="Credits are the unit of usage on Wyber AI. Each generation spends credits; everything else — editing, previewing, navigating — is free."
    >
      <DocSection title="What costs credits">
        <TodoBlock note="List which actions consume credits: web app generation, mobile generation, agent canvas run, workflow run. Include rough credit costs per action once confirmed." />
      </DocSection>

      <DocSection title="Free credits & plans">
        <TodoBlock note="Describe the free tier credit allowance (currently 50 free credits on sign-up). Link to plans page." />
      </DocSection>

      <DocSection title="When you are NOT charged">
        <Note>Credits are only deducted on a successful generation. If the build errors out, your credits are returned.</Note>
        <TodoBlock note="Confirm and expand: list edge cases — partial builds, cancelled generations, retries." />
      </DocSection>

      <DocSection title="Checking your balance">
        <TodoBlock note="Describe where in the dashboard users can see their current credit balance and usage history." />
      </DocSection>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/getting-started/your-first-build" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Your first build</Link>
        <Link href="/docs/web-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Generating a web app →</Link>
      </div>
    </DocsPage>
  )
}
