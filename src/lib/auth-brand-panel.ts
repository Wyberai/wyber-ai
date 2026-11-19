// Repairs one specific defect in generated sign-in screens: a split-panel brand side that has the dark gradient and film grain
// but no picture under them. The generator's auth template puts a full-bleed <img> first in the panel; on 16 Nov a published app
// (Ironclad Coaching Ops) shipped the panel with the overlay only, so the visitor saw a flat grey gradient where a photo belonged.
//
//   <div className="relative hidden overflow-hidden md:block grain">
//     <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />   <- nothing under this
//
// High precision by design. It only acts when ALL of these hold, so a screen that already has an image is never touched:
//   - the file is a .tsx/.jsx under an auth folder, or is named Login / Signup / Onboarding / SignIn / SignUp
//   - a div whose className contains the word "grain" is IMMEDIATELY followed by the dark overlay div
//     (absolute inset-0, bg-gradient-to-*, from-black/*) with no <img>, <video> or background-image between them
// Then an <img> carrying a {{wyber-image: ...}} directive is inserted between the two. Preview shows the usual gradient stand-in
// and publish resolves it to a real picture, exactly as for every other generated image. Pure and dependency-free.

const AUTH_FILE = /(^|\/)(auth\/[^/]+|(login|signin|signup|onboarding)[^/]*)\.(tsx|jsx)$/i

const PANEL_THEN_OVERLAY =
  /(<div\s+className=(?:"[^"]*\bgrain\b[^"]*"|\{`[^`]*\bgrain\b[^`]*`\})\s*>\s*)(<div\s+className="[^"]*\babsolute\b[^"]*\binset-0\b[^"]*\bbg-gradient-to-[a-z]+\b[^"]*\bfrom-black\/[^"]*"\s*\/>)/g

function brandName(source: string, at: number): string {
  // The brand name sits in the first <span> after the overlay.
  const m = source.slice(at, at + 900).match(/<span[^>]*>\s*([^<{}]{2,60}?)\s*<\/span>/)
  return m ? m[1].replace(/\s+/g, ' ').trim() : ''
}

export function repairBlankBrandPanel(path: string, content: string): { content: string; repaired: number } {
  if (!AUTH_FILE.test(path) || !/\bgrain\b/.test(content) || !/from-black\//.test(content)) return { content, repaired: 0 }
  let repaired = 0
  const out = content.replace(PANEL_THEN_OVERLAY, (whole, open: string, overlay: string, offset: number) => {
    const brand = brandName(content, offset + whole.length)
    const prompt = brand
      ? `atmospheric editorial photograph that suits ${brand}, moody natural light, shallow depth of field, no text, no logos`
      : 'atmospheric editorial photograph, moody natural light, shallow depth of field, no text, no logos'
    repaired++
    const indent = (open.match(/\n([ \t]*)$/) ?? ['', ''])[1]
    const img = `<img src="{{wyber-image: ${prompt} | 9:16}}" alt="" className="absolute inset-0 h-full w-full object-cover" />`
    return `${open}${img}\n${indent}${overlay}`
  })
  return { content: out, repaired }
}
