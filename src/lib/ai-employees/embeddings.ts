// Voyage AI embeddings — powers the employee's semantic memory (relevance-based
// recall over its whole history). Anthropic's recommended embeddings partner.
//
// Returns null on any failure (no key, API error) so callers degrade gracefully
// to recency-based recall instead of breaking the run. Memory is best-effort.

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
export const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL ?? 'voyage-3-large'
export const EMBEDDING_DIM = 1024

// input_type tunes the vector for its role: 'document' when storing a memory,
// 'query' when searching for relevant memories. Improves retrieval quality.
export async function embed(
  text: string,
  inputType: 'document' | 'query' = 'document',
): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY
  if (!key || !text?.trim()) return null
  try {
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        input: [text.slice(0, 8000)],
        model: EMBEDDING_MODEL,
        input_type: inputType,
        output_dimension: EMBEDDING_DIM,
      }),
    })
    if (!res.ok) return null
    const json = await res.json() as { data?: { embedding?: number[] }[] }
    const vec = json.data?.[0]?.embedding
    return Array.isArray(vec) && vec.length ? vec : null
  } catch {
    return null
  }
}

// pgvector accepts a vector literal as the string "[1,2,3]".
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`
}

// Batch embed (Voyage takes up to 128 inputs/call). Returns one vector per input
// (null for the whole batch on failure, so callers degrade gracefully).
export async function embedMany(
  texts: string[],
  inputType: 'document' | 'query' = 'document',
): Promise<(number[] | null)[]> {
  const key = process.env.VOYAGE_API_KEY
  if (!key || texts.length === 0) return texts.map(() => null)
  try {
    const res = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        input: texts.map(t => t.slice(0, 8000)),
        model: EMBEDDING_MODEL,
        input_type: inputType,
        output_dimension: EMBEDDING_DIM,
      }),
    })
    if (!res.ok) return texts.map(() => null)
    const json = await res.json() as { data?: { embedding?: number[]; index?: number }[] }
    const out: (number[] | null)[] = texts.map(() => null)
    for (const d of json.data ?? []) {
      if (typeof d.index === 'number' && Array.isArray(d.embedding)) out[d.index] = d.embedding
    }
    return out
  } catch {
    return texts.map(() => null)
  }
}

// Split long text into ~1200-char chunks on paragraph/sentence boundaries.
export function chunkText(text: string, target = 1200): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim()
  if (clean.length <= target) return clean ? [clean] : []
  const paras = clean.split(/\n\s*\n/)
  const chunks: string[] = []
  let buf = ''
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > target && buf) { chunks.push(buf.trim()); buf = '' }
    if (p.length > target) {
      // Hard-split an oversized paragraph.
      for (let i = 0; i < p.length; i += target) chunks.push(p.slice(i, i + target).trim())
    } else {
      buf = buf ? `${buf}\n\n${p}` : p
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks.filter(Boolean)
}
