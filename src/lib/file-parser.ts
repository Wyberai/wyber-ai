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
  // Strip any remaining ```edited: ...``` markers the AI might output
  chatText = chatText.replace(/```edited:[^`]*```/g, '');
  // Strip backtick code fences that wrap file lists
  chatText = chatText.replace(/```[\s\S]*?```/g, '');
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
export function cleanStreamingDisplay(raw: string): string {
  let out = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  const openIdx = out.search(/<thinking>/i);
  if (openIdx !== -1) out = out.slice(0, openIdx);
  // hide file blocks (complete and partial) from the streaming chat text
  out = out.replace(/<file\s+path="[^"]*">[\s\S]*?<\/file>/g, '');
  const openFile = out.search(/<file\s+path="/i);
  if (openFile !== -1) out = out.slice(0, openFile);
  return out.trim();
}
