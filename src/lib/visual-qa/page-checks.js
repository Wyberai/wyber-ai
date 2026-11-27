// Runs INSIDE the rendered page (injected as plain text, so no bundler may rewrite it). Defines window.__wqa.
// Every check returns findings: { check, where, el, text, detail }.
;(() => {
  const EPS = 1
  const cs = el => getComputedStyle(el)

  function opacityOf(el) {
    let o = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(cs(n).opacity)
    return o
  }
  function hidden(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = cs(n)
      if (s.display === 'none') return true
      // the screen-reader-only pattern: a 1px clipped box
      if (s.position === 'absolute' && n.offsetWidth <= 1 && n.offsetHeight <= 1) return true
      if (s.clipPath === 'inset(50%)' || s.clip === 'rect(0px, 0px, 0px, 0px)') return true
    }
    return cs(el).visibility === 'hidden'
  }
  // the fact ticker scrolls sideways on purpose; its off-screen copies are not layout defects
  const inMarquee = el => Boolean(el.closest('.animate-marquee'))
  const isFixed = el => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (cs(n).position === 'fixed') return n
    return null
  }
  const isStuck = el => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (cs(n).position === 'sticky') return n
    return null
  }

  function where(el) {
    const host = el.closest('section[id], header, footer, nav, aside, [role=dialog], main > section, main > div')
    if (!host) return 'page'
    const tag = host.tagName.toLowerCase()
    if (host.id) return tag + '#' + host.id
    if (tag === 'section' || tag === 'div') {
      const all = [...document.querySelectorAll('main > *')]
      const top = all.find(x => x.contains(el))
      return top ? 'main>' + (top.id || tag + ':' + all.indexOf(top)) : tag
    }
    return tag
  }
  function describe(el) {
    const cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(Boolean).slice(0, 6).join('.')
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '')
  }
  const snippet = el => (el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  const finding = (check, el, detail, text) => ({ check, where: where(el), el: describe(el), text: text ?? snippet(el), detail })

  /** One entry per rendered line of every visible text node, with the box the letters themselves occupy (line-height leading removed). */
  function textLines() {
    const out = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    let node
    let id = 0
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue
      const el = node.parentElement
      if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION', 'TITLE'].includes(el.tagName)) continue
      if (hidden(el) || inMarquee(el) || opacityOf(el) < 0.05) continue
      range.selectNodeContents(node)
      const fs = parseFloat(cs(el).fontSize)
      id++
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue
        const h = Math.min(r.height, fs * 0.66)
        const cy = r.top + r.height / 2
        out.push({ el, node: id, fs, box: { left: r.left + 1, right: r.right - 1, top: cy - h / 2, bottom: cy + h / 2 } })
      }
    }
    return out
  }

  /** The visible part of a box after every clipping ancestor. Null when nothing is left. */
  function clipBox(el, box) {
    let b = { ...box }
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const s = cs(n)
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue
      const r = n.getBoundingClientRect()
      b = { left: Math.max(b.left, r.left), right: Math.min(b.right, r.right), top: Math.max(b.top, r.top), bottom: Math.min(b.bottom, r.bottom) }
      if (b.right - b.left < 1 || b.bottom - b.top < 1) return null
    }
    return b
  }

  const alphaOf = color => {
    const m = /rgba?\(([^)]+)\)/.exec(color)
    if (!m) return color === 'transparent' ? 0 : 1
    const p = m[1].split(/[ ,/]+/).filter(Boolean)
    return p.length > 3 ? Number(p[3]) : 1
  }
  const PICTURE = new Set(['IMG', 'VIDEO', 'CANVAS', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT'])
  /** Does this element put pixels at the point itself (a fill, a border, a picture, or its own letters)? */
  function paintsAt(el, x, y) {
    if (PICTURE.has(el.tagName) || el.closest('svg')) return true
    const s = cs(el)
    if (alphaOf(s.backgroundColor) > 0.35 || s.backgroundImage !== 'none') return true
    const r = el.getBoundingClientRect()
    for (const [side, near] of [['Top', y - r.top], ['Bottom', r.bottom - y], ['Left', x - r.left], ['Right', r.right - x]]) {
      const w = parseFloat(s['border' + side + 'Width'])
      if (w > 0 && near <= w && alphaOf(s['border' + side + 'Color']) > 0.35) return true
    }
    const range = document.createRange()
    for (const c of el.childNodes) {
      if (c.nodeType !== 3 || !c.nodeValue.trim()) continue
      range.selectNodeContents(c)
      for (const q of range.getClientRects()) if (x >= q.left && x <= q.right && y >= q.top + q.height * 0.2 && y <= q.bottom - q.height * 0.2) return true
    }
    return false
  }

  let hitStyle = null
  function allowHitTests(on) {
    if (on && !hitStyle) {
      hitStyle = document.createElement('style')
      hitStyle.textContent = '*, *::before, *::after { pointer-events: auto !important; }'
      document.head.appendChild(hitStyle)
    } else if (!on && hitStyle) { hitStyle.remove(); hitStyle = null }
  }

  /**
   * Text another element paints over, and text on top of other text, at the CURRENT scroll position.
   * A fixed header or bar passing over content while the page scrolls is normal; it only counts at the very top and the very bottom,
   * where the visitor cannot scroll it out of the way.
   */
  function covered() {
    const out = []
    const vw = document.documentElement.clientWidth, vh = window.innerHeight
    const maxY = document.documentElement.scrollHeight - vh
    const atTop = window.scrollY <= 1, atBottom = window.scrollY >= maxY - 2
    const lines = textLines()
    allowHitTests(true)
    for (const line of lines) {
      const b = clipBox(line.el, line.box)
      if (!b) continue
      const y = (b.top + b.bottom) / 2
      if (y < 1 || y > vh - 1 || opacityOf(line.el) < 0.2) continue
      const w = b.right - b.left
      const xs = [b.left + 2, b.left + w * 0.25, b.left + w * 0.5, b.left + w * 0.75, b.right - 2].filter(x => x > 0 && x < vw)
      for (const x of xs) {
        const hit = document.elementFromPoint(x, y)
        if (!hit || hit === line.el || line.el.contains(hit) || hit.contains(line.el)) continue
        if (opacityOf(hit) < 0.2 || hidden(hit)) continue
        // walk from what was hit up to the shared ancestor, looking for something that really paints there
        let painter = null
        for (let n = hit; n && !n.contains(line.el); n = n.parentElement) if (paintsAt(n, x, y)) { painter = n; break }
        if (!painter) continue
        const bar = isFixed(painter)
        if (bar && !isFixed(line.el)) {
          const r = bar.getBoundingClientRect()
          const topBar = r.top < vh / 2
          if (topBar ? !atTop : !atBottom) continue
        }
        // the page scrolling under an open dialog or drawer is covered on purpose
        if (painter.closest('[role=dialog]') && !line.el.closest('[role=dialog]')) continue
        out.push(finding('text-covered', line.el, 'covered by ' + describe(painter) + ' "' + snippet(painter).slice(0, 30) + '"'))
        break
      }
    }
    allowHitTests(false)
    // two different pieces of text sharing the same pixels (catches overlaps where neither one has a fill)
    const boxes = lines.map(l => ({ ...l, b: clipBox(l.el, l.box) })).filter(l => l.b && l.b.bottom > 0 && l.b.top < vh && opacityOf(l.el) >= 0.2 && !isFixed(l.el)).sort((a, b) => a.b.top - b.b.top)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length && boxes[j].b.top < boxes[i].b.bottom - 2; j++) {
        const a = boxes[i], c = boxes[j]
        if (a.node === c.node) continue
        const ox = Math.min(a.b.right, c.b.right) - Math.max(a.b.left, c.b.left)
        const oy = Math.min(a.b.bottom, c.b.bottom) - Math.max(a.b.top, c.b.top)
        if (ox > 2 && oy > 2) out.push(finding('text-overlap', a.el, 'overlaps "' + snippet(c.el).slice(0, 30) + '" by ' + Math.round(ox) + 'x' + Math.round(oy) + 'px'))
      }
    }
    return out
  }

  /** Content wider than the screen: the page scrolls sideways, or something is cut off at the edge. */
  function overflow() {
    const out = []
    const vw = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth > vw + EPS) out.push(finding('horizontal-overflow', document.body, 'page is ' + document.documentElement.scrollWidth + 'px wide in a ' + vw + 'px viewport', ''))
    const bad = []
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
      if (bad.some(b => b.contains(el))) continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.right <= vw + EPS && r.left >= -EPS) continue
      if (hidden(el) || inMarquee(el) || isFixed(el) || opacityOf(el) < 0.05) continue
      let clipped = false
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) if (cs(n).overflowX !== 'visible') { clipped = true; break }
      if (clipped) continue
      bad.push(el)
      out.push(finding('wider-than-viewport', el, 'spans ' + Math.round(r.left) + ' to ' + Math.round(r.right) + ' in a ' + vw + 'px viewport'))
    }
    return out
  }

  /** Letters cut off by a clipping box, letters spilling out of a drawn box, and words split across two lines. */
  function textFit() {
    const out = []
    const range = document.createRange()
    for (const line of textLines()) {
      const el = line.el
      if (opacityOf(el) < 0.5) continue
      const shown = clipBox(el, line.box)
      const lost = shown ? Math.max(line.box.right - line.box.left - (shown.right - shown.left), line.box.bottom - line.box.top - (shown.bottom - shown.top)) : 0
      if (lost > 2) {
        let ellipsis = false, scrolls = false
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const s = cs(n)
          if (s.textOverflow === 'ellipsis' || s.webkitLineClamp !== 'none') ellipsis = true
          if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowY === 'auto' || s.overflowY === 'scroll') { scrolls = true; break }
        }
        if (!scrolls) out.push(finding(ellipsis ? 'text-truncated' : 'text-clipped', el, Math.round(lost) + 'px of a line is cut off'))
      }
      // nearest box with a visible edge or fill: the words must stay inside it
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const s = cs(n)
        const boxed = (parseFloat(s.borderLeftWidth) > 0 && parseFloat(s.borderRightWidth) > 0) || (alphaOf(s.backgroundColor) > 0.5 && n.tagName !== 'SECTION' && n.tagName !== 'MAIN')
        if (s.position === 'absolute' || s.position === 'fixed') break
        if (!boxed || s.display === 'inline') continue
        const r = n.getBoundingClientRect()
        const spill = Math.max(r.left - line.box.left, line.box.right - r.right, r.top - line.box.top, line.box.bottom - r.bottom)
        if (spill > 3 && s.overflowX === 'visible') out.push(finding('text-spills-box', el, 'letters run ' + Math.round(spill) + 'px outside ' + describe(n)))
        break
      }
    }
    for (const el of document.body.querySelectorAll('h1,h2,h3,h4,button,a,dt,dd,p,span,li')) {
      if (hidden(el) || inMarquee(el)) continue
      const big = parseFloat(cs(el).fontSize) >= 24
      if (!big && !['H1', 'H2', 'H3', 'H4', 'BUTTON', 'DT'].includes(el.tagName)) continue
      for (const node of el.childNodes) {
        if (node.nodeType !== 3) continue
        for (const m of node.nodeValue.matchAll(/[^\s-]{3,}/g)) {
          // an email address or web address has to break somewhere on a narrow screen
          if (m[0].includes('@') || m[0].includes('://')) continue
          range.setStart(node, m.index)
          range.setEnd(node, m.index + m[0].length)
          const tops = new Set([...range.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top / 4)))
          if (tops.size > 1) out.push(finding('word-broken', el, 'the word "' + m[0] + '" is split across lines at ' + Math.round(parseFloat(cs(el).fontSize)) + 'px'))
        }
      }
    }
    return out
  }

  /** A header whose labels are squeezed onto several lines is broken, even when nothing overlaps. The business name may take two. */
  function crowdedHeader() {
    const out = []
    const range = document.createRange()
    for (const el of document.querySelectorAll('header a, header button')) {
      if (hidden(el) || !el.textContent.trim()) continue
      const tops = []
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue
        range.selectNodeContents(node)
        for (const r of range.getClientRects()) if (r.width > 1 && !tops.some(t => Math.abs(t - r.top) < r.height * 0.6)) tops.push(r.top)
      }
      const brand = el.getAttribute('href') === '#main' || el.getAttribute('href') === '#/'
      if (tops.length > (brand ? 2 : 1)) out.push(finding('header-crowded', el, 'wraps onto ' + tops.length + ' lines'))
    }
    return out
  }

  function smallText() {
    const out = []
    for (const line of textLines()) {
      if (line.fs < 11.95) out.push(finding('small-text', line.el, line.fs.toFixed(1) + 'px'))
    }
    return out
  }

  /** A grid of equal things must not end in a short row (6 + 2 reads as a mistake). */
  function orphanRows() {
    const out = []
    for (const grid of document.body.querySelectorAll('*')) {
      const s = cs(grid)
      if (!s.display.includes('grid') || hidden(grid) || inMarquee(grid)) continue
      const kids = [...grid.children].filter(k => { const p = cs(k).position; return p !== 'absolute' && p !== 'fixed' && cs(k).display !== 'none' && k.getBoundingClientRect().width > 0 })
      if (kids.length < 3) continue
      if (kids.some(k => k.tagName !== kids[0].tagName)) continue
      const rows = []
      for (const k of kids) {
        const r = k.getBoundingClientRect()
        const row = rows.find(x => Math.abs(x.top - r.top) < 6)
        if (row) { row.n++; row.width += r.width } else rows.push({ top: r.top, n: 1, width: r.width })
      }
      if (rows.length < 2) continue
      rows.sort((a, b) => a.top - b.top)
      const first = rows[0], last = rows[rows.length - 1]
      if (first.n >= 2 && last.n < first.n && last.width < first.width * 0.85) out.push(finding('orphan-row', grid, kids.length + ' items laid out as ' + rows.map(r => r.n).join('+')))
    }
    return out
  }

  /** Every picture must have a box that does not depend on the file arriving: otherwise the page jumps when it does. */
  async function images() {
    const out = []
    const imgs = [...document.images].filter(i => !hidden(i) && !inMarquee(i))
    for (const img of imgs) {
      const r = img.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) { out.push(finding('image-no-size', img, 'renders at ' + Math.round(r.width) + 'x' + Math.round(r.height))); continue }
      const src = img.getAttribute('src'), loading = img.getAttribute('loading')
      img.setAttribute('loading', 'eager')
      img.setAttribute('src', 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="37" height="311"/>'))
      try { await img.decode() } catch { /* measured either way */ }
      const after = img.getBoundingClientRect()
      if (Math.abs(after.height - r.height) > 4 || Math.abs(after.width - r.width) > 4) out.push(finding('image-no-size', img, 'box follows the file: ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' becomes ' + Math.round(after.width) + 'x' + Math.round(after.height)))
      img.setAttribute('src', src)
      if (loading) img.setAttribute('loading', loading); else img.removeAttribute('loading')
      try { await img.decode() } catch { /* restore best effort */ }
    }
    return out
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  /** Any CSS colour (rgb, oklab, color()) as sRGB + alpha, read back from a canvas. */
  function rgba(color) {
    const m = /^rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\)$/.exec(color)
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const mix = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3]))
  const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

  /** Text colour and the real colour behind it (paint order from elementsFromPoint). Text over a photograph is skipped: a pixel check cannot judge it. */
  function colourPairs() {
    const out = []
    const vh = window.innerHeight
    allowHitTests(true)
    for (const line of textLines()) {
      const el = line.el
      const b = clipBox(el, line.box)
      if (!b) continue
      const y = (b.top + b.bottom) / 2, x = (b.left + b.right) / 2
      if (y < 1 || y > vh - 1 || x < 1 || x > document.documentElement.clientWidth - 1) continue
      if (opacityOf(el) < 0.98 || el.closest('[aria-hidden=true], :disabled')) continue
      const stack = document.elementsFromPoint(x, y)
      const from = stack.findIndex(n => n === el || el.contains(n) || n.contains(el))
      if (from < 0 || (from > 0 && stack.slice(0, from).some(n => paintsAt(n, x, y) && opacityOf(n) > 0.2))) continue
      const layers = []
      let opaque = false, picture = false
      // the element and everything painted under it, nearest first
      for (const n of stack.slice(from)) {
        if (PICTURE.has(n.tagName) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(n.tagName)) { picture = true; break }
        const s = cs(n)
        if (s.backgroundImage !== 'none') { picture = true; break }
        const c = rgba(s.backgroundColor)
        if (c[3] > 0) { layers.push([c[0], c[1], c[2], c[3] * (n.contains(el) ? 1 : Number(s.opacity))]); if (c[3] >= 0.99) { opaque = true; break } }
      }
      if (picture) continue
      let bg = [255, 255, 255]
      if (!opaque) bg = mix(rgba(cs(document.body).backgroundColor), bg)
      for (let i = layers.length - 1; i >= 0; i--) bg = mix(layers[i], bg)
      const s = cs(el)
      const fg = mix(rgba(s.color), bg)
      out.push({ ...finding('low-contrast', el, ''), fg: hex(fg), bg: hex(bg), size: line.fs, weight: Number(s.fontWeight) || 400 })
    }
    allowHitTests(false)
    return out
  }

  /** On a phone, anything tappable needs at least 40px in both directions. Links inside a sentence are exempt, as in WCAG. */
  function tapTargets() {
    const out = []
    for (const el of document.body.querySelectorAll('a[href], button, input, select, textarea, [role=button], summary')) {
      if (hidden(el) || inMarquee(el) || el.disabled || opacityOf(el) < 0.05 || el.tabIndex === -1) continue
      let r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (el.type === 'checkbox' || el.type === 'radio') { const label = el.labels && el.labels[0]; if (label) r = label.getBoundingClientRect() }
      if (el.tagName === 'A' && cs(el).display === 'inline') {
        const p = el.parentElement
        const around = [...p.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim().length > 1)
        if (around) continue
      }
      if (r.width >= 39.5 && r.height >= 39.5) continue
      out.push(finding('tap-target', el, Math.round(r.width) + 'x' + Math.round(r.height) + 'px'))
    }
    return out
  }

  /**
   * The 25 Nov bug class. A wrapper that animates (scroll reveal, framer-motion, any transform) becomes the positioning parent of an
   * absolute child that was placed against something further out, and sticks a sticky child to the wrong box.
   */
  function transformedWrappers() {
    const out = []
    const wrappers = [...document.body.querySelectorAll('*')].filter(el => el.hasAttribute('data-sv') || /(^|;)\s*(transform|opacity)\s*:/.test(el.getAttribute('style') || ''))
    for (const w of wrappers) {
      if (hidden(w) || inMarquee(w)) continue
      for (const d of w.querySelectorAll('*')) {
        if (d.closest('svg') || hidden(d)) continue
        const pos = cs(d).position
        if (pos === 'sticky') out.push(finding('sticky-in-transformed', d, 'sticky inside animated ' + describe(w)))
        if (pos !== 'absolute') continue
        if (cs(w).position !== 'static') continue
        let anchored = false
        for (let n = d.parentElement; n && n !== w; n = n.parentElement) if (cs(n).position !== 'static') { anchored = true; break }
        if (!anchored) out.push(finding('absolute-in-transformed', d, 'its positioning parent changes while ' + describe(w) + ' animates'))
      }
    }
    return out
  }

  /** Called with the element centred on screen: if it is still faded, its reveal never finishes. */
  async function stuckReveals() {
    const out = []
    const blocks = [...document.body.querySelectorAll('[data-sv], main [style*="opacity"]')].filter(el => !hidden(el) && !inMarquee(el) && el.textContent.trim())
    for (const el of blocks) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' })
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (el.hasAttribute('data-sv') && opacityOf(el) < 0.98) out.push(finding('reveal-stuck', el, 'opacity ' + opacityOf(el).toFixed(2) + ' when centred on screen'))
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    await new Promise(r => setTimeout(r, 900))
    for (const el of blocks) {
      const r = el.getBoundingClientRect()
      if (r.bottom <= window.innerHeight && r.top >= 0 && opacityOf(el) < 0.98) out.push(finding('reveal-stuck', el, 'opacity ' + opacityOf(el).toFixed(2) + ' at the bottom of the page, where no more scrolling is possible'))
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    return out
  }

  window.__wqa = { covered, overflow, textFit, crowdedHeader, smallText, orphanRows, images, colourPairs, tapTargets, transformedWrappers, stuckReveals }
})()
