import type { Metadata } from 'next'
import Link from 'next/link'
import { WyberLogo } from '@/components/shared/WyberLogo'

export const metadata: Metadata = {
  title: 'How to build a mobile app with AI in 2026 — WyberAi Blog',
  description: 'React Native + Expo from a plain-English prompt. Preview on your phone in under 60 seconds. No Xcode, no Android Studio, no code.',
  robots: { index: false, follow: false },
}

const s = { bg: '#09090b', card: '#111113', border: 'rgba(255,255,255,0.07)', text: '#fafafa', muted: '#71717a', dim: '#52525b', sky: '#0EA5E9', violet: '#8b5cf6' }

export default function Post() {
  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text, fontFamily: "'Space Grotesk', sans-serif" }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${s.border}`, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}><WyberLogo markSize={24} wordmarkSize={14} /></Link>
        <Link href="/signup" style={{ padding: '7px 16px', borderRadius: 8, background: s.sky, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Start free →</Link>
      </nav>

      <article style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <Link href="/blog" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 32 }}>← Back to blog</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: s.violet + '15', border: `1px solid ${s.violet}30`, fontSize: 11, fontWeight: 700, color: s.violet }}>Mobile</span>
          <span style={{ fontSize: 12, color: s.dim }}>June 14, 2026 · 6 min read</span>
        </div>

        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 28 }}>
          How to build a mobile app with AI in 2026 — iOS and Android, no coding
        </h1>

        <div style={{ fontSize: 16, color: s.muted, lineHeight: 1.75 }}>
          <p>Building a mobile app used to mean choosing between React Native and Swift, setting up Xcode, wrestling with simulators, and waiting for a first build that might not even run. In 2026, that's changed completely.</p>

          <p>WyberAi generates a full <strong style={{ color: s.text }}>React Native + Expo</strong> project from a plain-English description. You describe the screens, the data, and the interactions — and it generates every file: navigation, components, styling, realistic seed data. Scan the QR code and it loads on your phone. No IDE, no build step, no certificate management.</p>

          <p>Here's exactly how it works.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 1: Describe your app</h2>
          <p>Open WyberAi, click <strong style={{ color: s.text }}>Mobile App</strong>, and type a description. Be specific about screens and data — the more you give it, the less you'll need to iterate.</p>

          <div style={{ background: s.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${s.border}`, fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '16px 0' }}>
            Build a fitness tracker with a Home screen showing today's workout summary, a History screen with a weekly chart, and a Profile screen with total workouts and current streak. Bottom tab navigation.
          </div>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 2: Preview on your phone</h2>
          <p>Generation takes under 60 seconds. When it finishes, you'll see a QR code in the preview pane. Open the <strong style={{ color: s.text }}>Expo Go</strong> app on your iPhone or Android and scan it — your app loads instantly. No USB cable, no Xcode, no build queue.</p>

          <p>What you get is a real React Native app running on real hardware, not a web wrapper or a mockup. Touch interactions, navigation gestures, platform fonts — all native.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 3: Iterate in chat</h2>
          <p>Everything in the app is editable by describing the change. "Add a Settings screen with a notification toggle and dark mode switch." "Make the history chart a bar chart instead of a line." "Change the accent color to green." Each change regenerates the affected files and updates the preview automatically.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>Step 4: Export and publish</h2>
          <p>When you're ready to submit to the App Store or Google Play, export the full Expo project as a ZIP. Open it in VS Code if you want to customize further, or use <strong style={{ color: s.text }}>EAS Build</strong> (Expo's cloud build service) to generate an IPA or APK without needing a Mac or a Windows build machine.</p>

          <p>The export is clean, production-ready React Native code. You own it completely.</p>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>What WyberAi generates</h2>
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Bottom tab navigator (React Navigation)', 'All screens with StyleSheet — no web CSS', 'Ionicons from @expo/vector-icons', 'Realistic seed data so every screen looks complete', 'Dark background design system tuned for mobile', 'package.json with the correct Expo SDK and navigation deps'].map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: s.text, margin: '36px 0 14px' }}>What it costs</h2>
          <p>The free plan gives you ~50 credits a month. Starter is $29/month for 150 credits — web/mobile builds cost 10 credits, edits cost 3. Top-ups available anytime. No credit card required to start.</p>

          <div style={{ marginTop: 36, padding: '24px 28px', background: `${s.violet}10`, border: `1px solid ${s.violet}25`, borderRadius: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.text, marginBottom: 8 }}>Try it now — free</div>
            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Describe your mobile app and get a working React Native + Expo project in under 60 seconds.</p>
            <Link href="/dashboard?new=mobile" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: s.violet, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Build my mobile app →
            </Link>
          </div>
        </div>
      </article>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');`}</style>
    </div>
  )
}
