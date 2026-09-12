import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { VOTER_COOKIE } from '@/lib/challenge'
import { WyberLogo } from '@/components/shared/WyberLogo'
import { VoteWidget } from '@/components/challenge/VoteWidget'
import { SocialShare } from '@/components/shared/SocialShare'

// Deliberately NOT reachable from any index/gallery — this page only exists at
// the direct link a builder gets after submitting (see EntrySubmit.tsx) and
// shares themselves. There's no public list of these anywhere in the app.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const db = createServiceClient()
  const { data: entry } = await db.from('challenge_entries').select('title, description').eq('id', id).eq('status', 'approved').single()
  if (!entry) return { title: 'Wyber Premier League' }
  return {
    title: `Vote for ${entry.title} — Wyber Premier League`,
    description: entry.description,
  }
}

export default async function VoteEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()

  const { data: entry } = await db
    .from('challenge_entries')
    .select('id, title, description, handle, live_url, video_url, vote_count')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  let voted = false
  if (entry) {
    let userId: string | null = null
    try {
      const auth = await createClient()
      const { data: { user } } = await auth.auth.getUser()
      userId = user?.id ?? null
    } catch { /* anonymous */ }
    const cookieStore = await cookies()
    const token = cookieStore.get(VOTER_COOKIE)?.value ?? null
    const voterKey = userId ? `u:${userId}` : token ? `c:${token}` : null
    if (voterKey) {
      const { data: existing } = await db.from('challenge_votes').select('id').eq('entry_id', id).eq('voter_key', voterKey).limit(1)
      voted = !!existing?.length
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fafafa', fontFamily: 'var(--font-display)' }}>
      <nav style={{ padding: '0 clamp(16px,4vw,48px)', height: 60, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <WyberLogo markSize={26} wordmarkSize={15} />
        </Link>
      </nav>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: 'clamp(48px,10vw,100px) clamp(20px,4vw,48px)', textAlign: 'center' }}>
        {!entry ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🤷</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Entry not found</h1>
            <p style={{ fontSize: 14, color: '#71717a' }}>This link may have expired or the entry hasn&apos;t been approved yet.</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Wyber Premier League</div>
            <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>{entry.title}</h1>
            <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 8px' }}>{entry.description}</p>
            {entry.handle && <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 28px' }}>{entry.handle}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <VoteWidget entryId={entry.id} initialCount={entry.vote_count} initialVoted={voted} />
              {entry.live_url && (
                <a href={entry.live_url} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', color: '#e4e4e7', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                  View live ↗
                </a>
              )}
              {entry.video_url && (
                <a href={entry.video_url} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                  Watch demo ↗
                </a>
              )}
            </div>

            <div style={{ padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 12px' }}>Like it? Vote and share to help it win Fan Favorite.</p>
              <SocialShare
                url={`https://wyberai.com/premier-league/vote/${entry.id}`}
                text={`Vote for "${entry.title}" in Wyber Premier League`}
                align="center"
              />
            </div>

            <p style={{ fontSize: 12, color: '#3f3f46', marginTop: 32 }}>
              <Link href="/premier-league" style={{ color: 'inherit', textDecoration: 'none' }}>Build your own entry →</Link>
            </p>
          </>
        )}
      </section>
    </div>
  )
}
