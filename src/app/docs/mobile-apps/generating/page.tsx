import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Generating a Mobile App — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Mobile Apps"
      title="Generating a mobile app"
      intro="Describe your mobile app in plain English and Wyber generates a React Native (Expo) app with a live in-browser preview — no Xcode or Android Studio needed to get started."
      requirements={[
        { label: 'A WyberAi account' },
        { label: '1 credit', note: 'per generation' },
      ]}
    >
      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Start a new Mobile project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the dashboard, click <strong>New project</strong> and select <strong>Mobile App</strong>. You'll land in the mobile editor with an empty prompt input.
            </p>
            <ScreenshotPlaceholder label="New project — Mobile App selected" />
          </Step>
          <Step n={2} title="Write your prompt">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Describe the screens, navigation, and data your app needs. Be specific about the screen count and layout. Example:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, margin: '8px 0' }}>
              Fitness tracker with a Home screen showing today's workout, a History screen with a weekly chart, and a Profile screen. Bottom tab navigation. Dark theme.
            </div>
            <ScreenshotPlaceholder label="Mobile app prompt input" />
          </Step>
          <Step n={3} title="Watch it generate">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Generation takes 20–60 seconds. Wyber generates all React Native files: screens, navigation, StyleSheet styles, realistic seed data, and a correct <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>package.json</code> for Expo SDK 52.
            </p>
            <ScreenshotPlaceholder label="Mobile generation in progress" />
          </Step>
          <Step n={4} title="Preview in-browser">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The preview pane renders your app using react-native-web. Navigation, state, and most UI work in the browser. Device APIs (camera, GPS, push notifications) require a real device — see <Link href="/docs/mobile-apps/live-preview" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>The live preview</Link>.
            </p>
            <ScreenshotPlaceholder label="In-browser mobile preview" />
          </Step>
          <Step n={5} title="Iterate">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Send follow-up prompts in the chat panel to change screens, add new tabs, or tweak the design. Each iteration costs 1 credit.
            </p>
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
