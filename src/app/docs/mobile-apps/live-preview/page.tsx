import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, TodoBlock, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'The Live Preview — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Mobile Apps"
      title="The live preview"
      intro="Wyber renders your mobile app directly in the browser using react-native-web, so you can interact with it without a phone or simulator."
    >
      <DocSection title="Using the preview">
        <TodoBlock note="Describe the preview pane — device frame toggle, orientation toggle, screen size selector, refresh button." />
        <ScreenshotPlaceholder label="Live preview pane controls" />
      </DocSection>

      <DocSection title="What renders vs what doesn't">
        <TodoBlock note="List which React Native APIs work in browser preview (navigation, state, basic UI) and which require a real device (camera, GPS, push notifications, Bluetooth, haptics)." />
      </DocSection>

      <DocSection title="Testing on your phone (Expo Go)">
        <Steps>
          <Step n={1} title="Install Expo Go">
            <TodoBlock note="Link to Expo Go on App Store / Play Store. One sentence." />
          </Step>
          <Step n={2} title="Export and scan the QR code">
            <TodoBlock note="Describe how to trigger the Expo QR code from Wyber and scan it in Expo Go." />
            <ScreenshotPlaceholder label="QR code for Expo Go" />
          </Step>
          <Step n={3} title="App opens on your device">
            <TodoBlock note="Describe what the user sees, hot-reload behavior, and any caveats." />
          </Step>
        </Steps>
      </DocSection>

      <Note>Expo Go imposes some restrictions on native modules. If your app uses custom native code, you'll need a development build — see Exporting to Expo.</Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/mobile-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Generating a mobile app</Link>
        <Link href="/docs/mobile-apps/exporting-to-expo" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Exporting to Expo →</Link>
      </div>
    </DocsPage>
  )
}
