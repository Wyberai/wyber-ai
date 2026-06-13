import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Generating a Mobile App — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Mobile Apps"
      title="Generating a mobile app"
      intro="Describe your mobile app in plain English and Wyber generates a React Native (Expo) app with a live in-browser preview — no Xcode or Android Studio needed to get started."
      requirements={[
        { label: 'A Wyber AI account' },
        { label: '1 credit', note: 'per generation' },
      ]}
    >
      <DocSection title="Step-by-step">
        <TodoBlock note="Fill in the exact steps after testing the mobile app generation flow end-to-end." />
        <Steps>
          <Step n={1} title="Start a new Mobile project">
            <TodoBlock note="Describe where to select 'Mobile App' as the project type from the dashboard." />
            <ScreenshotPlaceholder label="New project — Mobile App selected" />
          </Step>
          <Step n={2} title="Write your prompt">
            <TodoBlock note="What makes a good mobile app prompt? iOS-specific vs cross-platform? Any platform selector?" />
            <ScreenshotPlaceholder label="Mobile app prompt input" />
          </Step>
          <Step n={3} title="Watch it generate">
            <TodoBlock note="Describe the generation streaming view for mobile — same as web or different UI?" />
            <ScreenshotPlaceholder label="Mobile generation in progress" />
          </Step>
          <Step n={4} title="Preview in-browser">
            <TodoBlock note="Describe the react-native-web preview pane — what works, what doesn't render in browser." />
            <ScreenshotPlaceholder label="In-browser mobile preview" />
          </Step>
          <Step n={5} title="Iterate">
            <TodoBlock note="Describe follow-up prompt flow for mobile — same chat panel as web apps?" />
          </Step>
        </Steps>
      </DocSection>

      <Note>The in-browser preview uses react-native-web and renders most UI. Some device APIs (camera, GPS) only work on a real device via Expo Go.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/web-apps/custom-domains" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Custom domains</Link>
        <Link href="/docs/mobile-apps/live-preview" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: The live preview →</Link>
      </div>
    </DocsPage>
  )
}
