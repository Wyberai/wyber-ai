import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Exporting to Expo — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Mobile Apps"
      title="Exporting to Expo"
      intro="Download your Wyber mobile app as a standard Expo project you can build, submit to the App Store / Play Store, or continue developing locally."
      requirements={[
        { label: 'Node.js 18+', note: 'nodejs.org' },
        { label: 'Expo CLI', note: 'npm install -g expo-cli' },
        { label: 'A generated Wyber mobile app' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the export flow end-to-end." />
        <Steps>
          <Step n={1} title="Click Export">
            <TodoBlock note="Describe where the Export button is in the mobile editor and what format it produces (zip? git repo?)." />
            <ScreenshotPlaceholder label="Export button" />
          </Step>
          <Step n={2} title="Download and unzip">
            <TodoBlock note="Describe what's in the export — file structure, package.json, app.json, source files." />
          </Step>
          <Step n={3} title="Install dependencies">
            <TodoBlock note="Command: npm install (or yarn). Any special steps needed?" />
          </Step>
          <Step n={4} title="Run locally">
            <TodoBlock note="Command: npx expo start. What the developer sees in the terminal and browser." />
          </Step>
          <Step n={5} title="Build for production (optional)">
            <TodoBlock note="Point to Expo EAS Build docs for submitting to stores. Out of scope for Wyber to document in detail — just link out." />
          </Step>
        </Steps>
      </DocSection>

      <Note>Exported code is standard Expo — no Wyber lock-in. You own the output and can develop it like any React Native project.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/mobile-apps/live-preview" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← The live preview</Link>
        <Link href="/docs/ai-agents/building-in-plain-english" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Building AI agents →</Link>
      </div>
    </DocsPage>
  )
}
