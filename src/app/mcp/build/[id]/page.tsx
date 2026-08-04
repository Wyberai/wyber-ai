import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 5 // refresh every 5 seconds

export default async function BuildStatusPage({ params }: { params: { id: string } }) {
  const db = createServiceClient()
  const { data: message } = await db
    .from('mcp_messages')
    .select('id, status, response, error, published_url, created_at, processed_at, message')
    .eq('id', params.id)
    .single()

  if (!message) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Build not found</h1>
          <p style={{ color: 'var(--text2)', marginBottom: 20 }}>This build has expired or the ID is invalid.</p>
          <Link href="/mcp" style={{ color: 'var(--sky)', textDecoration: 'none', fontWeight: 600 }}>Back to MCP</Link>
        </div>
      </div>
    )
  }

  const createdAt = new Date(message.created_at).getTime()
  const now = new Date().getTime()
  const elapsedMin = Math.floor((now - createdAt) / 60000)
  const elapsedSec = Math.floor(((now - createdAt) % 60000) / 1000)

  let statusEmoji = '⏳'
  let statusText = 'Queued'
  let statusColor = 'var(--text2)'

  if (message.status === 'processing') {
    statusEmoji = '🔨'
    statusText = 'Building'
    statusColor = 'var(--sky)'
  } else if (message.status === 'done') {
    statusEmoji = '✅'
    statusText = 'Complete'
    statusColor = 'var(--green, #10b981)'
  } else if (message.status === 'error') {
    statusEmoji = '❌'
    statusText = 'Failed'
    statusColor = 'var(--red, #ef4444)'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--bg), var(--bg2))', fontFamily: 'var(--font-sans)', padding: 20 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 40 }}>
        {/* Status header */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{statusEmoji}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: statusColor, marginBottom: 8 }}>{statusText}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 4 }}>Build running for {elapsedMin}m {elapsedSec}s</p>
          {message.status !== 'done' && message.status !== 'error' && (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Typical build time: 8-10 minutes</p>
          )}
        </div>

        {/* Details */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Request</div>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' }}>{message.message}</p>
          </div>

          {message.response && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Response</div>
              <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' }}>{message.response}</p>
            </div>
          )}

          {message.error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red, #ef4444)', marginBottom: 8 }}>Error</div>
              <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' }}>{message.error}</p>
            </div>
          )}

          {message.published_url && (
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: 8, padding: 16, marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sky)', marginBottom: 8 }}>Live App</div>
              <Link href={message.published_url} target="_blank" style={{ color: 'var(--sky)', fontSize: 14, wordBreak: 'break-all', textDecoration: 'none', fontWeight: 600 }}>
                {message.published_url}
              </Link>
            </div>
          )}
        </div>

        {/* Auto-refresh hint */}
        {message.status !== 'done' && message.status !== 'error' && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            This page auto-refreshes every 5 seconds. You can close this and continue chatting!
          </div>
        )}
      </div>
    </div>
  )
}
