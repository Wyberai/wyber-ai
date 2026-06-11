'use client'
import { useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editor'

interface StoreListing {
  title: string
  subtitle: string
  description: string
  keywords: string[]
  category: string
  privacyPolicyUrl: string
  supportUrl: string
  whatIsNew: string
  easConfig: object
}

function IcoSpinner() {
  return <div style={{ width: 16, height: 16, border: '2px solid rgba(14,165,233,0.2)', borderTopColor: '#0EA5E9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <button onClick={copy} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#71717a', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <CopyBtn text={value} />
      </div>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 10px', fontSize: 12, color: '#e4e4e7', lineHeight: 1.5, fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  )
}

function StoreListing({ projectId, projectName }: { projectId?: string; projectName?: string }) {
  const { files } = useEditorStore()
  const [listing, setListing] = useState<StoreListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Grab a snippet from App.tsx for context
      const appFile = Object.entries(files ?? {}).find(([p]) => p.includes('App.tsx'))
      const codeSnippet = appFile ? (appFile[1] as any).content?.slice(0, 1200) : ''

      const res = await fetch('/api/store-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: projectName || 'My App', codeSnippet }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setListing(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [files, projectName])

  if (!listing && !loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.15)" strokeWidth="1"/><path d="M13 20h14M20 13v14" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/></svg>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>Generate store listing</div>
        <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>AI writes your App Store title, description, keywords, and EAS config</div>
        {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
        <button onClick={generate}
          style={{ background: '#0EA5E9', color: 'white', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Generate with AI
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <IcoSpinner />
        <span style={{ fontSize: 12, color: '#71717a' }}>Writing your store listing...</span>
      </div>
    )
  }

  if (!listing) return null

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>App Store Listing</span>
        <button onClick={generate}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#71717a', cursor: 'pointer', padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
          Regenerate
        </button>
      </div>

      <Field label="Title (30 chars max)" value={listing.title} />
      <Field label="Subtitle (30 chars max)" value={listing.subtitle} />
      <Field label="Category" value={listing.category} />
      <Field label="Description" value={listing.description} />
      <Field label="Keywords (100 chars total)" value={listing.keywords.join(', ')} />
      <Field label="What's New" value={listing.whatIsNew} />
      <Field label="Privacy Policy URL" value={listing.privacyPolicyUrl} />
      <Field label="Support URL" value={listing.supportUrl} />
      <Field label="eas.json (copy to project root)" value={JSON.stringify(listing.easConfig, null, 2)} mono />
    </div>
  )
}

function PublishGuide() {
  const [open, setOpen] = useState<number | null>(0)
  const steps = [
    {
      title: '1. Install Expo CLI + EAS',
      body: `npm install -g expo-cli eas-cli
npx expo login
eas login`,
    },
    {
      title: '2. Initialize EAS in your project',
      body: `# Export your code first (Download button above)
# Then in the project folder:
eas build:configure
# This creates eas.json — paste the config from Store Listing tab`,
    },
    {
      title: '3. Apple Developer setup',
      body: `• Enroll at developer.apple.com ($99/year)
• Create an App ID in Certificates, Identifiers & Profiles
• In App Store Connect: create a new app, fill in metadata from Store Listing tab
• EAS handles provisioning profiles automatically with: eas build --platform ios`,
    },
    {
      title: '4. Google Play setup',
      body: `• Enroll at play.google.com/console ($25 one-time)
• Create a new app, complete the store listing
• EAS handles the keystore automatically with: eas build --platform android`,
    },
    {
      title: '5. Build & submit (TODO: binary build)',
      // TODO: wire up EAS Build + Submit API calls — currently documentation only
      body: `# These commands run locally after downloading your code:
eas build --platform ios --profile production
eas build --platform android --profile production

# Then submit:
eas submit --platform ios
eas submit --platform android

⚠️  Binary build and submission are not automated here yet.
    Export your code, install EAS CLI, and run these commands locally.`,
    },
    {
      title: '6. Resources',
      body: `EAS Build docs:    https://docs.expo.dev/build/introduction/
EAS Submit docs:   https://docs.expo.dev/submit/introduction/
App Store Connect: https://appstoreconnect.apple.com
Google Play:       https://play.google.com/console`,
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7', marginBottom: 14 }}>How to Publish</div>
      {steps.map((step, i) => (
        <div key={i} style={{ marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', background: open === i ? 'rgba(14,165,233,0.06)' : '#111118', border: 'none', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: open === i ? '#0EA5E9' : '#a1a1aa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step.title}
            <span style={{ fontSize: 14, opacity: 0.5 }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div style={{ background: '#0a0a0f', padding: '10px 12px', fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {step.body}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface Props {
  projectId?: string
  projectName?: string
}

export function MobileRightPanel({ projectId, projectName }: Props) {
  const [tab, setTab] = useState<'store' | 'publish'>('store')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#10121a' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {(['store', 'publish'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#0EA5E9' : 'transparent'}`, color: tab === t ? '#0EA5E9' : '#71717a', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {t === 'store' ? 'Store Listing' : 'Publish Guide'}
          </button>
        ))}
      </div>

      {tab === 'store'
        ? <StoreListing projectId={projectId} projectName={projectName} />
        : <PublishGuide />
      }
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
