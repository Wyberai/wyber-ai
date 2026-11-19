/** The model is told to return one JSON object. Fenced or chatty replies are tolerated. */
export function parseJsonObject(text: string): unknown {
  const t = (text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('no JSON object in reply')
  return JSON.parse(t.slice(start, end + 1))
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout>
  return Promise.race([p, new Promise<never>((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), ms) })]).finally(() => clearTimeout(t))
}
