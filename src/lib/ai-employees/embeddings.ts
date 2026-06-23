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
