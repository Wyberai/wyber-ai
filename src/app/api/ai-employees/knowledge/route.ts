import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { embedMany, chunkText } from '@/lib/ai-employees/embeddings'

// Company knowledge: the customer's intel, shared across all their employees.
// POST: ingest a document (chunk → embed → store). GET: list. DELETE: remove a doc.

export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, source } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const chunks = chunkText(content)
  if (chunks.length === 0) return NextResponse.json({ error: 'No content to store' }, { status: 400 })

  const embeddings = await embedMany(chunks, 'document')
  const db = createServiceClient()

  const rows = chunks.map((c, i) => ({
    user_id: user.id,
    doc_title: title.trim(),
    source: source ?? 'upload',
    content: c,
    chunk_index: i,
    embedding: embeddings[i],
  }))

  const { error } = await db.from('company_knowledge').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const embedded = embeddings.filter(Boolean).length
  return NextResponse.json({
    ok: true,
    chunks: chunks.length,
    embedded,
    note: embedded < chunks.length ? 'Stored; some chunks unembedded (set VOYAGE_API_KEY for full semantic recall).' : undefined,
  }, { status: 201 })
}

export async function GET() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db.from('company_knowledge')
    .select('doc_title, source, created_at, embedding')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Group chunks into documents for display.
  const docs: Record<string, { title: string; source?: string; chunks: number; embedded: number; created_at: string }> = {}
  for (const r of data ?? []) {
    const d = docs[r.doc_title] ?? (docs[r.doc_title] = { title: r.doc_title, source: r.source, chunks: 0, embedded: 0, created_at: r.created_at })
    d.chunks++
    if (r.embedding) d.embedded++
  }
  return NextResponse.json({ documents: Object.values(docs) })
}

export async function DELETE(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const title = new URL(req.url).searchParams.get('title')
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const db = createServiceClient()
  await db.from('company_knowledge').delete().eq('user_id', user.id).eq('doc_title', title)
  return NextResponse.json({ ok: true })
}
