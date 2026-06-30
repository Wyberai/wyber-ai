import { DocsPage, DocSection, Steps, Step, Note } from '@/components/docs/DocsPage'
import Link from 'next/link'

export const metadata = { title: 'Exporting & Self-Hosting — Docs' }

export default function Page() {
  return (
    <DocsPage
      section="Web Apps"
      title="Exporting & self-hosting"
      intro="Your app's code belongs to you. As traffic grows, you can export the full project and run it on your own infrastructure — no migration tool required, no lock-in."
      requirements={[
        { label: 'A Wyber project with at least one build' },
        { label: 'Node.js installed locally', note: 'to verify the export builds' },
      ]}
    >
      <DocSection title="When to export">
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          Most projects run fine on Wyber indefinitely. Consider exporting when you need infrastructure
          Wyber doesn't provide directly — custom backend logic outside Supabase, a different hosting
          region, dedicated compute, or you simply want a second copy of the code under your own control.
        </p>
      </DocSection>

      <DocSection title="Step-by-step">
        <Steps>
          <Step n={1} title="Export the project">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              From the editor, go to <strong>Settings → Export</strong> and choose <strong>Download ZIP</strong>.
              Every export is run through the same sanitization pass used before every Wyber publish, so the
              ZIP is guaranteed to include a working entry point, complete <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>package.json</code>, and no missing imports.
            </p>
          </Step>
          <Step n={2} title="Move Supabase credentials to env vars">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              If your project uses Supabase, the exported <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>WYBER_EXPORT.md</code> tells
              you exactly which values to move into <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>VITE_SUPABASE_URL</code> /{' '}
              <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>VITE_SUPABASE_ANON_KEY</code>. The anon key is safe to ship to the
              client — your Row Level Security policies are the real access boundary, not the key itself.
            </p>
          </Step>
          <Step n={3} title="Build locally to verify">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Unzip, then run:
            </p>
            <pre style={{ background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', overflowX: 'auto' }}>
{`npm install
npm run build   # should complete with no errors
npm run dev`}
            </pre>
          </Step>
          <Step n={4} title="Deploy and cut over DNS">
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
              Deploy the built output to your host of choice (Vercel, Netlify, your own server). If you had
              a custom domain pointed at Wyber, update the DNS record at your registrar to point at the new
              host. There's no downtime requirement on Wyber's side — your old published URL keeps working
              until you remove it.
            </p>
          </Step>
        </Steps>
      </DocSection>

      <Note>
        Prefer to push straight to a repo instead of a ZIP? <strong>Settings → GitHub</strong> pushes the
        same sanitized files directly to a repo under your account.
      </Note>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/docs/web-apps/custom-domains" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>← Custom domains</Link>
        <Link href="/docs/mobile-apps/generating" style={{ fontSize: 13, color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}>Next: Generating a mobile app →</Link>
      </div>
    </DocsPage>
  )
}
