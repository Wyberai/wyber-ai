import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          The preview pane shows your app in a phone frame. You can interact with it like a real app — tap buttons, scroll lists, and navigate between screens. The preview updates automatically after each generation.
        </p>
        <ScreenshotPlaceholder label="Live preview pane controls" />
      </DocSection>

      <DocSection title="What renders vs what doesn't">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 10 }}>Works in the browser preview:</p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2, marginBottom: 16 }}>
          <li>Navigation (stack, tabs, drawer)</li>
          <li>State, context, and async data</li>
          <li>ScrollView, FlatList, SectionList</li>
          <li>Text input, buttons, modals, and alerts</li>
          <li>Images via <code style={{ fontSize: 12 }}>Image</code> component</li>
          <li>Icons from @expo/vector-icons</li>
        </ul>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 10 }}>Requires a real device (via Expo Go):</p>
        <ul style={{ paddingLeft: 20, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2 }}>
          <li>Camera and photo library</li>
          <li>GPS / location</li>
          <li>Push notifications</li>
          <li>Bluetooth and NFC</li>
          <li>Haptic feedback</li>
          <li>Biometric authentication</li>
        </ul>
      </DocSection>

      <DocSection title="Testing on your phone (Expo Go)">
        <Steps>
          <Step n={1} title="Install Expo Go">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Download <strong>Expo Go</strong> from the App Store (iOS) or Google Play (Android).
            </p>
          </Step>
          <Step n={2} title="Export and scan the QR code">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the Wyber mobile editor, click <strong>Open in Expo Go</strong>. A QR code appears. Open Expo Go on your phone and scan the QR code.
            </p>
            <ScreenshotPlaceholder label="QR code for Expo Go" />
          </Step>
          <Step n={3} title="App opens on your device">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Your app loads on your phone in seconds. Changes you make in Wyber hot-reload on your device automatically — no reinstall needed.
            </p>
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
