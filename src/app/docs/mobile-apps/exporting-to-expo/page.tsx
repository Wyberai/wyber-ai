import { DocsPage, DocSection, Steps, Step, ScreenshotPlaceholder, Note } from '@/components/docs/DocsPage'
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
        <Steps>
          <Step n={1} title="Click Export">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In the mobile editor top bar, click <strong>Export</strong>. Wyber packages the project as a ZIP file and starts the download.
            </p>
            <ScreenshotPlaceholder label="Export button" />
          </Step>
          <Step n={2} title="Download and unzip">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              The ZIP contains a standard Expo project: <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>app/</code> screens, <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>components/</code>, <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>package.json</code>, and <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>app.json</code>. Unzip it anywhere on your machine.
            </p>
          </Step>
          <Step n={3} title="Install dependencies">
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', margin: '8px 0' }}>
              npm install
            </div>
          </Step>
          <Step n={4} title="Run locally">
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', margin: '8px 0' }}>
              npx expo start
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              Expo opens a QR code in the terminal. Scan it with Expo Go on your phone, or press <strong>w</strong> to open in a browser.
            </p>
          </Step>
          <Step n={5} title="Build for production (optional)">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Use <strong>EAS Build</strong> (Expo's cloud build service) to generate an IPA or APK and submit to the App Store / Google Play. See the <a href="https://docs.expo.dev/build/introduction/" target="_blank" rel="noreferrer" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Expo EAS docs</a> for the full submission guide.
            </p>
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
