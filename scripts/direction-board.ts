/**
 * Renders every design direction (src/lib/design-directions.ts) on one page with its real tokens, real fonts
 * (loaded the same way builds load them) and the same Tailwind config the previews use, so a human can
 * review whether they look distinct and are legible.
 *
 *   npx tsx scripts/direction-board.ts [outDir]     (default: docs/direction-board)
 *
 * The hero MEDIUM is only labelled (photo/video/illustration…), not rendered: this board judges tokens,
 * type and composition scaffolding, not imagery.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DIRECTIONS } from '../src/lib/design-directions'
import { directionFontsUrl, DIRECTION_FONT_FAMILIES } from '../src/lib/direction-fonts'
import { GOOGLE_FONTS_LINKS, PREVIEW_TAILWIND_CONFIG, TOKEN_VARS_CSS, BASE_LAYER_CSS } from '../src/lib/design-system'

const outDir = resolve(process.argv[2] ?? 'docs/direction-board')
const FALLBACK = "ui-sans-serif, system-ui, sans-serif"

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

function card(d: (typeof DIRECTIONS)[number]): string {
  const t = d.palette.tokens
  const vars = Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';')
  const f = d.fonts
  const sizeClass = d.rules.displayRatio >= 8 ? 'text-[80px]' : d.rules.displayRatio >= 5 ? 'text-[60px]' : 'text-[46px]'
  const style = `${vars};--radius:${d.palette.radius};--font-sans:'${f.body}',${FALLBACK};--font-display:'${f.display}','${f.body}',${FALLBACK};--font-mono:'${f.mono}',ui-monospace,monospace`
  const swatches = ['background', 'foreground', 'primary', 'muted', 'accent', 'border']
    .map(k => `<span title="${k}" style="background:hsl(${t[k]});width:22px;height:22px;display:inline-block;border:1px solid hsl(var(--border));border-radius:4px"></span>`).join('')
  return `<section id="${d.id}" class="rounded-xl overflow-hidden" style="border:1px solid #8884">
  <div class="px-3 py-1.5 text-[11px] font-mono flex justify-between" style="background:#111;color:#ddd"><b>${esc(d.id)}</b><span>${esc(d.group)} · ${d.palette.mode} · ${esc(f.display)} ${f.displayWeight} / ${esc(f.body)}</span></div>
  <div style="${style}" class="bg-background text-foreground" >
    <div class="flex items-center justify-between px-6 py-4 border-b border-border">
      <span style="font-family:var(--font-display);font-weight:${f.displayWeight};letter-spacing:${f.displayTracking}" class="text-lg">${esc(d.name)}</span>
      <span class="hidden sm:flex gap-5 text-sm text-muted-foreground"><span>Work</span><span>About</span><span>Contact</span></span>
      <span class="bg-primary text-primary-foreground text-sm px-4 py-2" style="border-radius:var(--radius)">Get in touch</span>
    </div>
    <div class="px-6 pt-8 pb-6">
      <div class="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mb-3">${esc(d.rules.heroMedia)} hero · est. 2026</div>
      <h2 class="${sizeClass} leading-[0.95]" style="font-family:var(--font-display);font-weight:${f.displayWeight};letter-spacing:${f.displayTracking}">${esc(d.palette.vibe.split(/[—,]/)[0].slice(0, 44))}</h2>
      <p class="mt-4 text-[15px] max-w-md text-muted-foreground" style="font-family:var(--font-sans)">${esc(d.composition.slice(0, 150))}…</p>
      <div class="mt-5 flex gap-3 items-center">
        <span class="bg-primary text-primary-foreground text-sm px-5 py-2.5 font-medium" style="border-radius:var(--radius)">Primary action</span>
        <span class="text-sm px-5 py-2.5 border border-border" style="border-radius:var(--radius)">Secondary</span>
        <span class="font-mono text-xs text-muted-foreground">${esc(f.mono)}</span>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="bg-card border border-border p-4 text-sm" style="border-radius:var(--radius)"><b style="font-family:var(--font-display)">Card title</b><div class="text-muted-foreground mt-1">Body text on the card surface, muted.</div></div>
        <div class="bg-muted p-4 text-sm" style="border-radius:var(--radius)"><b style="font-family:var(--font-display)">Muted panel</b><div class="text-muted-foreground mt-1">Muted-foreground on muted.</div></div>
      </div>
      <div class="mt-4 flex gap-1.5 items-center">${swatches}</div>
    </div>
  </div>
  <div class="px-3 py-1.5 text-[10px]" style="background:#111;color:#aaa">${esc(d.anchors.map(a => a.site + ' [' + a.status + ']').join(' · '))}</div>
</section>`
}

const fontsUrl = directionFontsUrl(DIRECTION_FONT_FAMILIES)
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wyber design directions</title>
${GOOGLE_FONTS_LINKS}
${fontsUrl ? `<link href="${fontsUrl}" rel="stylesheet">` : ''}
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = ${PREVIEW_TAILWIND_CONFIG};</script>
<style>${TOKEN_VARS_CSS}\n${BASE_LAYER_CSS}\nbody{background:#222;color:#eee;font-family:system-ui,sans-serif;margin:0}</style>
</head><body>
<div style="position:sticky;top:0;z-index:9;background:#000;color:#fff;padding:8px 16px;font:12px system-ui"><b>${DIRECTIONS.length} directions</b> — tokens, fonts and type scale only (hero media is labelled, not rendered). <span id="fonts"></span></div>
<main style="display:grid;grid-template-columns:repeat(auto-fill,minmax(560px,1fr));gap:16px;padding:16px">
${DIRECTIONS.map(card).join('\n')}
</main>
<script>document.fonts.ready.then(function(){var want=${JSON.stringify(DIRECTION_FONT_FAMILIES)};var ok=want.filter(function(f){return document.fonts.check('16px "'+f+'"')});document.getElementById('fonts').textContent='fonts ready: '+ok.length+'/'+want.length;window.__board={ok:ok,missing:want.filter(function(f){return ok.indexOf(f)<0})}})</script>
</body></html>`

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'index.html'), html)
console.log(`wrote ${join(outDir, 'index.html')} — ${DIRECTIONS.length} directions`)
