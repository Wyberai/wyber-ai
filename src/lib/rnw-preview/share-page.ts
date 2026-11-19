import { bundleRnApp } from '@/app/api/rn-web-bundle/route'
import { buildPreviewHtml } from '@/lib/rnw-preview/shell'

// The phone-framed page for a generated mobile app, shared by every link that shows one: /m/<projectId> (the
// long-standing share link) and /preview/<token> (a per-client preview an agency can switch off). One render, so the
// two can never look different.

function esc(s: string): string {
  // Escape a full HTML document for safe embedding in an iframe srcdoc="…"
  // attribute. Only & and " can break the attribute; escaping them is sufficient.
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function escText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Outer phone-frame document. `inner` is the app's own HTML doc (from
// buildPreviewHtml) embedded via iframe srcdoc; `message` is used for the
// non-ready states (not found / nothing built / preview error).
export function framePage(opts: { name?: string; inner?: string; message?: string }): string {
  const title = opts.name ? `${escText(opts.name)} — WyberAi` : 'Preview — WyberAi'
  const label = opts.name ? escText(opts.name) : 'Mobile preview'
  const screen = opts.inner
    ? `<iframe title="app" srcdoc="${esc(opts.inner)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"></iframe>`
    : `<div class="msg"><div class="msg-t">${escText(opts.name || 'Preview')}</div><div class="msg-s">${escText(opts.message || 'Nothing to preview yet.')}</div></div>`
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,maximum-scale=1">
<title>${title}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:#08080A;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;gap:16px;padding:24px}
.label{font-size:13px;font-weight:600;color:#9A9AA5;letter-spacing:.2px;display:flex;align-items:center;gap:8px}
.label .dot{width:7px;height:7px;border-radius:50%;background:#0EA5E9;box-shadow:0 0 10px #0EA5E9}
/* Phone: fixed device size on desktop, with a bezel + notch so it reads as a
   phone rather than a web viewport. */
.phone{position:relative;width:390px;height:844px;max-height:calc(100dvh - 96px);background:#000;border-radius:44px;padding:12px;box-shadow:0 0 0 2px #1C1C1F,0 30px 80px -20px rgba(0,0,0,.8);flex:0 0 auto}
.phone::before{content:"";position:absolute;top:12px;left:50%;transform:translateX(-50%);width:120px;height:26px;background:#000;border-radius:0 0 16px 16px;z-index:2}
.screen{width:100%;height:100%;border-radius:34px;overflow:hidden;background:#0A0A0B}
iframe{width:100%;height:100%;border:0;display:block;background:#0A0A0B}
.msg{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px;gap:8px}
.msg-t{font-size:16px;font-weight:700}
.msg-s{font-size:13px;color:#9A9AA5;line-height:1.5;max-width:260px}
.foot{font-size:12px;color:#54545C}
.foot a{color:#8A8A93;text-decoration:none}
/* Real phones / narrow screens: drop the bezel, go full-bleed. */
@media (max-width:520px){
  body{padding:0;gap:0;justify-content:flex-start}
  .label,.foot{display:none}
  .phone{width:100vw;height:100dvh;max-height:none;border-radius:0;padding:0;box-shadow:none}
  .phone::before{display:none}
  .screen{border-radius:0}
}
</style>
</head>
<body>
<div class="label"><span class="dot"></span>${label}</div>
<div class="phone"><div class="screen">${screen}</div></div>
<div class="foot"><a href="https://wyberai.com" target="_blank" rel="noopener">Made with WyberAi</a></div>
</body>
</html>`
}


/** Renders a mobile project's files into the framed page, or a framed message when there is nothing to show. */
export async function mobileSharePage(data: { name?: string | null; files?: unknown } | null): Promise<{ status: number; html: string }> {
  if (!data) return { status: 404, html: framePage({ message: 'This preview link is no longer available.' }) }
  const name = data.name ?? undefined
  const files = (data.files ?? {}) as Record<string, unknown>
  if (Object.keys(files).length === 0) return { status: 200, html: framePage({ name, message: 'Nothing has been built here yet.' }) }
  try {
    const r = await bundleRnApp(files)
    if (!r.ok) {
      const msg = r.kind === 'compile'
        ? 'This build has an error and can’t render yet. Edit it in WyberAi and try again.'
        : 'Preview is temporarily unavailable. Please try again in a moment.'
      return { status: r.kind === 'compile' ? 200 : 503, html: framePage({ name, message: msg }) }
    }
    return { status: 200, html: framePage({ name, inner: buildPreviewHtml(r.js) }) }
  } catch {
    return { status: 503, html: framePage({ message: 'Preview is temporarily unavailable. Please try again in a moment.' }) }
  }
}
