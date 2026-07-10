// Preview selection bridge — Session C owns this file.
//
// The live preview iframe is served from the REMOTE builder's origin
// (preview-builder.wyberai.com), so the editor cannot reach into it. Anything
// that must run inside the preview rides along in the files we POST to the
// builder, exactly like sanitize-files' error relay: an inline, non-module
// <script> in index.html that vite's build leaves untouched.
//
// Two transient transforms (never persisted to the project):
//   1. injectWyberLoc(files)     — tags JSX DOM elements with
//      data-wyber-loc="path:line" so a click in the preview maps back to the
//      exact source location (Visual Edits' LLM-free path).
//   2. injectPreviewBridge(files) — appends the bridge <script> to index.html.
//
// The bridge script is INERT until the editor posts it a message. Protocol
// (all via postMessage, both directions use '*' — the iframe is cross-origin):
//   parent → iframe:
//     { type: 'wyber-edit-mode', on: boolean }        toggle click-to-select
//     { type: 'wyber-apply-theme', css: string }      upsert #wyber-theme-override <style>
//     { type: 'wyber-inline-text' }                   make selected element contentEditable
//   iframe → parent:
//     { type: 'wyber-element-selected', selector, tag, text, classes, loc }
//     { type: 'wyber-text-committed', loc, selector, oldText, newText }

type FileVal = { content?: string; language?: string } | string

const fileContent = (v: FileVal | undefined): string =>
  v == null ? '' : typeof v === 'string' ? v : (v.content ?? '')

const withContent = (v: FileVal, content: string): FileVal =>
  typeof v === 'string' ? content : { ...v, content }

// ── 1. data-wyber-loc injection ────────────────────────────────────────────

// Lowercase DOM elements only — attributes on capitalized components become
// props and never reach the DOM. Conservative whitelist keeps false positives
// (comparisons like `a < b`) from corrupting expressions.
const HTML_TAGS = new Set([
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'img',
  'section', 'header', 'footer', 'nav', 'main', 'aside', 'article',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'form', 'label', 'input', 'textarea', 'select', 'option',
  'strong', 'em', 'small', 'blockquote', 'pre', 'code', 'figure', 'figcaption',
  'video', 'audio', 'canvas', 'svg', 'footer', 'summary', 'details',
])

// Characters that legitimately precede a JSX opening tag. Anything else
// (identifier char, digit, quote) means "probably a comparison/generic" → skip.
const JSX_PREFIX = new Set(['(', '{', '>', ',', '?', ':', '&', '|', ';', '[', '='])

// True when `idx` sits inside an (unclosed) string literal on this line —
// counts unescaped quote chars before it. Crude but errs toward skipping.
function insideString(line: string, idx: number): boolean {
  let sq = 0, dq = 0, bt = 0
  for (let i = 0; i < idx; i++) {
    const c = line[i]
    if (c === '\\') { i++; continue }
    if (c === "'" && !dq && !bt) sq ^= 1
    else if (c === '"' && !sq && !bt) dq ^= 1
    else if (c === '`' && !sq && !dq) bt ^= 1
  }
  return !!(sq || dq || bt)
}

/**
 * Tag JSX DOM-element opening tags with data-wyber-loc="path:line".
 * Line numbers refer to the ORIGINAL file (injection never adds lines), so
 * they map 1:1 onto the user's saved source. Per-file try/catch: any hiccup
 * returns that file's original content untouched.
 */
export function injectWyberLoc<T extends Record<string, FileVal>>(files: T): T {
  const out: Record<string, FileVal> = {}
  for (const [path, val] of Object.entries(files)) {
    if (!/\.(tsx|jsx)$/.test(path)) { out[path] = val; continue }
    try {
      const src = fileContent(val)
      const lines = src.split('\n')
      let inBlockComment = false
      const tagged = lines.map((line, i) => {
        // Track /* */ blocks across lines (approximately — good enough to
        // avoid injecting into commented-out JSX).
        if (inBlockComment) {
          if (line.includes('*/')) inBlockComment = false
          return line
        }
        if (line.includes('/*') && !line.includes('*/')) inBlockComment = true

        const commentAt = line.indexOf('//')
        let result = ''
        const re = /<([a-z][a-zA-Z0-9]*)(?=[\s/>])/g
        let m: RegExpExecArray | null
        let lastEnd = 0
        re.lastIndex = 0
        while ((m = re.exec(line)) !== null) {
          const at = m.index
          const tag = m[1]
          if (!HTML_TAGS.has(tag)) continue
          if (commentAt !== -1 && at > commentAt) continue
          if (insideString(line, at)) continue
          // preceding non-whitespace char must look like a JSX position
          let p = at - 1
          while (p >= 0 && (line[p] === ' ' || line[p] === '\t')) p--
          if (p >= 0 && !JSX_PREFIX.has(line[p])) continue
          // already tagged on this line? (rebuild of an already-processed map)
          if (line.slice(at, at + 200).includes('data-wyber-loc')) continue
          result += line.slice(lastEnd, at + 1 + tag.length) + ` data-wyber-loc="${path}:${i + 1}"`
          lastEnd = at + 1 + tag.length
        }
        if (!result) return line
        return result + line.slice(lastEnd)
      })
      out[path] = withContent(val, tagged.join('\n'))
    } catch {
      out[path] = val
    }
  }
  return out as T
}

// ── 2. Bridge script ───────────────────────────────────────────────────────

// Plain ES5 non-module script: registers a message listener and nothing else
// until told to. Every handler body is try/caught — a bridge bug must never
// break a user's app.
export const WYBER_BRIDGE_SNIPPET = `/* wyber-select-bridge */(function(){
if(window.parent===window)return;
var selecting=false,hoverBox=null,selEl=null,editing=false;
function box(){if(hoverBox)return hoverBox;hoverBox=document.createElement('div');hoverBox.setAttribute('style','position:fixed;z-index:2147483646;pointer-events:none;border:1.5px solid #0EA5E9;background:rgba(14,165,233,0.08);border-radius:3px;display:none;transition:all 60ms linear');document.documentElement.appendChild(hoverBox);return hoverBox}
function place(el){try{var r=el.getBoundingClientRect();var b=box();b.style.display='block';b.style.left=r.left+'px';b.style.top=r.top+'px';b.style.width=r.width+'px';b.style.height=r.height+'px'}catch(e){}}
function hide(){if(hoverBox)hoverBox.style.display='none'}
function cssPath(el){try{var parts=[];var n=el;while(n&&n.nodeType===1&&parts.length<6){var s=n.tagName.toLowerCase();if(n.id){parts.unshift(s+'#'+n.id);break}var cls=(typeof n.className==='string'?n.className:'').trim().split(/\\s+/).filter(Boolean).slice(0,2);if(cls.length)s+='.'+cls.join('.');var p=n.parentElement;if(p){var sib=Array.prototype.filter.call(p.children,function(c){return c.tagName===n.tagName});if(sib.length>1)s+=':nth-of-type('+(Array.prototype.indexOf.call(sib,n)+1)+')'}parts.unshift(s);n=p}return parts.join(' > ')}catch(e){return''}}
function describe(el){var locEl=el.closest?el.closest('[data-wyber-loc]'):null;return{type:'wyber-element-selected',selector:cssPath(el),tag:el.tagName?el.tagName.toLowerCase():'',text:(el.innerText||'').trim().slice(0,300),classes:typeof el.className==='string'?el.className:'',loc:locEl?locEl.getAttribute('data-wyber-loc'):null,locText:locEl?(locEl.innerText||'').trim().slice(0,300):null}}
function onMove(e){if(!selecting||editing)return;var el=e.target;if(!el||el===hoverBox)return;place(el)}
function onClick(e){if(!selecting||editing)return;try{e.preventDefault();e.stopPropagation();var el=e.target;if(!el||el===hoverBox)return;selEl=el;place(el);window.parent.postMessage(describe(el),'*')}catch(err){}}
function setSelecting(on){selecting=!!on;if(!on){hide();stopEdit(false)}if(on){document.addEventListener('mousemove',onMove,true);document.addEventListener('click',onClick,true)}else{document.removeEventListener('mousemove',onMove,true);document.removeEventListener('click',onClick,true)}}
var editOld='';
function commit(){if(!selEl||!editing)return;try{var nt=(selEl.innerText||'').trim();window.parent.postMessage({type:'wyber-text-committed',loc:selEl.closest&&selEl.closest('[data-wyber-loc]')?selEl.closest('[data-wyber-loc]').getAttribute('data-wyber-loc'):null,selector:cssPath(selEl),oldText:editOld,newText:nt},'*')}catch(e){}stopEdit(true)}
function stopEdit(committed){if(!editing)return;editing=false;try{if(selEl){selEl.removeAttribute('contenteditable');selEl.removeEventListener('blur',commit);selEl.removeEventListener('keydown',onEditKey)}}catch(e){}}
function onEditKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();commit()}if(e.key==='Escape'){try{if(selEl)selEl.innerText=editOld}catch(err){}stopEdit(false)}}
function startEdit(){if(!selEl||editing)return;try{editing=true;editOld=(selEl.innerText||'').trim();selEl.setAttribute('contenteditable','true');selEl.addEventListener('blur',commit);selEl.addEventListener('keydown',onEditKey);selEl.focus()}catch(e){editing=false}}
function applyTheme(css){try{var st=document.getElementById('wyber-theme-override');if(!st){st=document.createElement('style');st.id='wyber-theme-override';document.head.appendChild(st)}st.textContent=String(css||'')}catch(e){}}
window.addEventListener('message',function(e){var d=e.data;if(!d||typeof d!=='object')return;try{
if(d.type==='wyber-edit-mode')setSelecting(!!d.on);
else if(d.type==='wyber-apply-theme')applyTheme(d.css);
else if(d.type==='wyber-inline-text')startEdit();
}catch(err){}});
})()`

export const WYBER_BRIDGE_SCRIPT = `<script>${WYBER_BRIDGE_SNIPPET}</script>`

/**
 * Append the bridge script to index.html (idempotent, marker-checked).
 * Runs AFTER sanitizeFiles so index.html is guaranteed to exist. Any failure
 * returns the map unchanged — select mode degrades to dead buttons, the
 * preview itself is never at risk.
 */
export function injectPreviewBridge<T extends Record<string, FileVal>>(files: T): T {
  try {
    const idx = files['index.html']
    const html = fileContent(idx)
    if (!html || html.includes('wyber-select-bridge')) return files
    const next = html.includes('</body>')
      ? html.replace('</body>', `${WYBER_BRIDGE_SCRIPT}\n</body>`)
      : html + '\n' + WYBER_BRIDGE_SCRIPT
    return { ...files, 'index.html': withContent(idx, next) }
  } catch {
    return files
  }
}
