import { PUBLISHED_APP_SANDBOX, injectStorageShim } from '@/lib/published-app-sandbox'

// The page a client sees at /preview/<token> for a web project. A generated app is code that runs in the visitor's
// browser, so it never runs on wyberai.com itself: this outer page is ours and has no app code in it; the app sits in
// a sandboxed frame with an opaque origin (the same isolation published apps get), so it cannot read the visitor's
// WyberAi session or call WyberAi's APIs as them.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const BASE_CSS = `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{background:#05080d;color:#e8eef7;font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:flex;flex-direction:column}
.bar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 16px;background:#0a1018;border-bottom:1px solid #14202e;font-size:12px;color:#8797ab}
.pill{background:#0EA5E922;color:#38bdf8;border-radius:99px;padding:2px 10px;font-weight:700;letter-spacing:.02em}
.bar strong{color:#c7d1de;font-weight:600}iframe{flex:1;width:100%;border:0;background:#fff}
.msg{margin:auto;padding:32px;max-width:420px;text-align:center}.msg h1{font-size:20px;margin-bottom:8px;color:#fff}.msg p{font-size:14px;line-height:1.6;color:#9aa8bb}`

export function webPreviewPage(opts: { name?: string | null; business?: string | null; builtAt?: string | null; inner: string }): string {
  const when = opts.builtAt ? new Date(opts.builtAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>${escText(opts.name || 'Preview')}</title><style>${BASE_CSS}</style></head><body>
<div class="bar"><span class="pill">Preview</span><span>This is a draft${opts.business ? ` from <strong>${escText(opts.business)}</strong>` : ''}, not the final site.${when ? ` Updated ${escText(when)}.` : ''}</span></div>
<iframe title="${escText(opts.name || 'Preview')}" sandbox="${PUBLISHED_APP_SANDBOX}" srcdoc="${esc(injectStorageShim(opts.inner, {}))}"></iframe>
</body></html>`
}

/** A plain message page for the states where there is nothing to show (not ready, protected, gone). */
export function previewMessagePage(title: string, text: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escText(title)}</title><style>${BASE_CSS}</style></head><body><div class="msg"><h1>${escText(title)}</h1><p>${escText(text)}</p></div></body></html>`
}
