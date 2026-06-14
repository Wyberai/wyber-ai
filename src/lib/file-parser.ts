export interface ParsedFile {
  path: string;
  content: string;
}
export interface ParseResult {
  files: ParsedFile[];
  chatText: string;
}
const FILE_BLOCK_RE = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;

// Strip <thinking>...</thinking> reasoning blocks (and an unclosed trailing one)
// so they never render as chat text.
function stripThinking(raw: string): string {
  let out = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  // If a <thinking> was opened but never closed (model ran long), drop everything from it on
  const openIdx = out.search(/<thinking>/i);
  if (openIdx !== -1) out = out.slice(0, openIdx);
  return out;
}

export function parseGenerationOutput(raw: string): ParseResult {
  const files: ParsedFile[] = [];
  // Remove thinking blocks BEFORE extracting files
  let working = stripThinking(raw);
  // Remove file blocks entirely from chat text — don't replace with anything
  let chatText = working.replace(FILE_BLOCK_RE, (_, path, content) => {
    files.push({ path: path.trim(), content: content.trim() });
    return '';
  });
  // Strip <edit> diff blocks from chat text (they're handled separately by parseEditBlocks)
  chatText = chatText.replace(/<edit\s+path="[^"]*">[\s\S]*?<\/edit>/g, '');
  // Also cut any unclosed trailing <edit> block (stream ended mid-block)
  const openEditIdx = chatText.search(/<edit\s+path="/i);
  if (openEditIdx !== -1) chatText = chatText.slice(0, openEditIdx);
  // Strip any remaining ```edited: ...``` markers the AI might output
  chatText = chatText.replace(/```edited:[^`]*```/g, '');
  // Strip backtick code fences that wrap file lists
  chatText = chatText.replace(/```[\s\S]*?```/g, '');
  // Strip [progress: ...] markers — these are surfaced as the live checklist, never as chat text
  chatText = chatText.replace(/\[progress:[^\]]+\]/gi, '');
  // Clean up extra whitespace and blank lines
  chatText = chatText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n')
    .trim();
  return { files, chatText };
}

export class StreamingFileParser {
  private buffer = '';
  private inThinking = false;
  push(chunk: string): ParsedFile[] {
    this.buffer += chunk;
    const found: ParsedFile[] = [];
    const re = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(this.buffer)) !== null) {
      found.push({ path: match[1].trim(), content: match[2].trim() });
      lastIndex = re.lastIndex;
    }
    if (lastIndex > 0) this.buffer = this.buffer.slice(lastIndex);
    return found;
  }
  flush(): ParsedFile[] { return this.push(''); }
  getBuffer(): string { return this.buffer; }
  reset() { this.buffer = ''; this.inThinking = false; }
}

// Helper for streaming display: strip thinking + file blocks from a partial buffer
// so the chat view never shows raw <thinking> or <file> content mid-stream.
// Progress lines tagged [progress: ...] are preserved and returned via extractProgressLines.
export function cleanStreamingDisplay(raw: string): string {
  let out = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  const openThink = out.search(/<thinking>/i);
  if (openThink !== -1) out = out.slice(0, openThink);
  // hide complete <file> and <edit> blocks from the streaming chat text
  out = out.replace(/<file\s+path="[^"]*">[\s\S]*?<\/file>/g, '');
  out = out.replace(/<edit\s+path="[^"]*">[\s\S]*?<\/edit>/g, '');
  // hide partial (still-streaming) blocks: cut from the first unclosed opener
  const openFile = out.search(/<file\s+path="/i);
  if (openFile !== -1) out = out.slice(0, openFile);
  const openEdit = out.search(/<edit\s+path="/i);
  if (openEdit !== -1) out = out.slice(0, openEdit);
  return out.trim();
}

/**
 * Extract [progress: ...] lines from a streaming buffer.
 * Returns the human-readable step labels in order, deduped.
 * These are emitted by the generate route's system prompt during builds.
 */
export function extractProgressLines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /\[progress:\s*([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const label = m[1].trim();
    if (!seen.has(label)) { seen.add(label); out.push(label); }
  }
  return out;
}

// ─── Diff-based editing: parse <edit> search/replace blocks ───
export interface EditBlockParsed {
  path: string;
  search: string;
  replace: string;
}

// Extracts <edit path="..."> blocks containing one or more
// <<<<<<< SEARCH / ======= / >>>>>>> REPLACE sections.
export function parseEditBlocks(raw: string): EditBlockParsed[] {
  const out: EditBlockParsed[] = [];
  const working = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  const editRe = /<edit\s+path="([^"]+)">([\s\S]*?)<\/edit>/g;
  let m: RegExpExecArray | null;
  while ((m = editRe.exec(working)) !== null) {
    const path = m[1].trim();
    const body = m[2];
    // Each block: <<<<<<< SEARCH \n ... \n ======= \n ... \n >>>>>>> REPLACE
    const pairRe = /<<<<<<<\s*SEARCH\s*\n([\s\S]*?)\n?=======\s*\n([\s\S]*?)\n?>>>>>>>\s*REPLACE/g;
    let p: RegExpExecArray | null;
    while ((p = pairRe.exec(body)) !== null) {
      out.push({ path, search: p[1], replace: p[2] });
    }
  }
  return out;
}

// True if the model emitted any <edit> blocks (diff mode) vs full <file> blocks
export function hasEditBlocks(raw: string): boolean {
  return /<edit\s+path="/.test(raw);
}
