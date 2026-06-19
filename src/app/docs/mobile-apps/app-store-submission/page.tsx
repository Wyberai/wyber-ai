import { DocsPage, DocSection, Steps, Step, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'App Store & Play Store Submission — Docs' }

const CODE = (s: string) => (
  <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{s}</code>
)

const cmd = (s: string) => (
  <pre style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#a3e635', overflowX: 'auto', marginTop: 8 }}>{s}</pre>
)

export default function Page() {
  return (
    <DocsPage
      section="Mobile Apps"
      title="Submit to App Store & Play Store"
      intro="Export your Wyber mobile app and publish it to the Apple App Store and Google Play Store using Expo's EAS Build service — no Xcode or Android Studio required."
      requirements={[
        { label: 'Exported Wyber mobile project (ZIP)' },
        { label: 'Expo account (free)', note: 'expo.dev' },
        { label: 'Apple Developer account ($99/yr)', note: 'developer.apple.com' },
        { label: 'Google Play Developer account ($25 one-time)', note: 'play.google.com/console' },
      ]}
    >
      <DocSection title="1. Set up EAS Build">
        <Steps>
          <Step n={1} title="Install EAS CLI">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              EAS Build handles compilation in the cloud — no local Xcode or Android Studio needed.
            </p>
            {cmd('npm install -g eas-cli\neas login')}
          </Step>
          <Step n={2} title="Initialise EAS in your project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Inside your unzipped Wyber project folder:
            </p>
            {cmd('cd your-wyber-app\neas build:configure')}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              This creates {CODE('eas.json')} with build profiles for preview, development, and production.
            </p>
          </Step>
          <Step n={3} title="Set your app identifiers">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Open {CODE('app.json')} and set a unique bundle ID and version:
            </p>
            <pre style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: '#f4f4f5', overflowX: 'auto', marginTop: 8 }}>{`{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}`}</pre>
          </Step>
        </Steps>
      </DocSection>

      <DocSection title="2. Build for iOS (App Store)">
        <Steps>
          <Step n={1} title="Run an iOS production build">
            {cmd('eas build --platform ios --profile production')}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              EAS will prompt you to log in to your Apple Developer account and create or reuse an App ID, provisioning profile, and distribution certificate automatically.
            </p>
          </Step>
          <Step n={2} title="Submit to App Store Connect">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Once the build succeeds, submit it directly:
            </p>
            {cmd('eas submit --platform ios')}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              Or download the <strong>.ipa</strong> from the EAS dashboard and upload it manually via Transporter (Mac only).
            </p>
          </Step>
          <Step n={3} title="Complete the App Store listing">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In <Link href="https://appstoreconnect.apple.com" target="_blank" style={{ color: '#0EA5E9' }}>App Store Connect</Link> you'll need:
            </p>
            <ul style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2, paddingLeft: 20, marginTop: 8 }}>
              <li>App icon (1024×1024 PNG, no alpha)</li>
              <li>Screenshots for iPhone 6.7&quot; and iPad 12.9&quot; (minimum)</li>
              <li>Short description (170 chars) + full description</li>
              <li>Keywords (100 chars total)</li>
              <li>Privacy policy URL</li>
              <li>Age rating questionnaire</li>
              <li>Pricing (free or paid)</li>
            </ul>
          </Step>
        </Steps>
        <Note>
          Apple review typically takes 1–3 business days for a new app. Expedited review (24h) is available if your app is time-sensitive — request it in App Store Connect.
        </Note>
      </DocSection>

      <DocSection title="3. Build for Android (Play Store)">
        <Steps>
          <Step n={1} title="Run an Android production build">
            {cmd('eas build --platform android --profile production')}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              EAS creates a signed <strong>.aab</strong> (Android App Bundle) — the format Google Play requires.
            </p>
          </Step>
          <Step n={2} title="Create your Play Store listing">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              In <Link href="https://play.google.com/console" target="_blank" style={{ color: '#0EA5E9' }}>Google Play Console</Link>:
            </p>
            <ul style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 2, paddingLeft: 20, marginTop: 8 }}>
              <li>Create a new app → fill in title, description, category</li>
              <li>Upload a 512×512 icon + 1024×500 feature graphic</li>
              <li>Add at least 2 phone screenshots (16:9 or 9:16)</li>
              <li>Complete content rating questionnaire</li>
              <li>Set up data safety section</li>
              <li>Upload the signed .aab in Releases → Production</li>
            </ul>
          </Step>
          <Step n={3} title="Submit for review">
            {cmd('eas submit --platform android')}
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
              Or upload the .aab manually. Google typically reviews in 3–7 days for a first submission.
            </p>
          </Step>
        </Steps>
        <Note>
          Google Play requires a closed testing phase (at least 12 testers for 14 days) before your app can be published to open production. Plan for this extra step on your first submission.
        </Note>
      </DocSection>

      <DocSection title="4. Over-the-air updates (no re-review)">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Wyber apps include expo-updates by default. You can push JS/asset changes without a new store submission:
        </p>
        {cmd('eas update --branch production --message "Fix typo on home screen"')}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginTop: 8 }}>
          Users get the update on next app launch. Use this for content, copy, bug fixes, and UI tweaks. Only native code changes (new native modules, icon, splash screen) require a new store build.
        </p>
      </DocSection>

      <DocSection title="Checklist before submitting">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#f4f4f5' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#f4f4f5' }}>iOS</th>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#f4f4f5' }}>Android</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Unique bundle ID / package name', '✓', '✓'],
              ['App icon (no alpha channel)', '1024×1024', '512×512'],
              ['Screenshots', '6.7" required', '16:9 phone required'],
              ['Privacy policy URL', '✓', '✓'],
              ['Version set in app.json', '✓', '✓'],
              ['Push notification entitlement (if used)', '✓', 'auto'],
              ['In-app purchase setup (if used)', 'App Store Connect', 'Play Console'],
            ].map(([item, ios, android]) => (
              <tr key={item} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 0', paddingRight: 16 }}>{item}</td>
                <td style={{ padding: '8px 0', paddingRight: 16 }}>{ios}</td>
                <td style={{ padding: '8px 0' }}>{android}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>
    </DocsPage>
  )
}
