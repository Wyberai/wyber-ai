// After a spec build the chat says plainly what the brief asked for that this kind of app does not do, so nobody finds out later.
// The plan is saved in src/build-spec.json (spec.brief.notBuilt, written by the model that read the whole brief).

type FileMap = Record<string, unknown>

function contentOf(v: unknown): string {
  return typeof v === 'string' ? v : (v as { content?: string } | undefined)?.content ?? ''
}

export function notBuiltList(files: FileMap): string[] {
  const raw = contentOf(files['src/build-spec.json'])
  if (!raw) return []
  try {
    const j = JSON.parse(raw) as { spec?: { notBuilt?: unknown; brief?: { notBuilt?: unknown } }; notBuilt?: unknown; brief?: { notBuilt?: unknown } }
    const list = j.spec?.brief?.notBuilt ?? j.spec?.notBuilt ?? j.brief?.notBuilt ?? j.notBuilt
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 5) : []
  } catch { return [] }
}

/** One plain sentence, or '' when nothing was left out. */
export function notBuiltSentence(files: FileMap): string {
  const l = notBuiltList(files)
  if (!l.length) return ''
  const joined = l.length === 1 ? l[0] : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`
  return `Not built yet: ${joined}. Ask and I'll add what can be added.`
}
