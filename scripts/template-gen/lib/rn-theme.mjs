// Converts a design-palettes.ts Palette's HSL-channel tokens into the flat
// hex theme.ts object shape mandated by the real mobile system prompt
// (src/app/api/generate/route.ts buildMobileSystemPrompt): bg/surface/
// elevated/border/text/accent/onAccent/success/warning/danger + radius.
// Reuses the same palette data as the web/website archetypes so a mobile
// template and its web sibling can share a design identity.

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase()
}

function channelsToHex(channels) {
  const [h, s, l] = channels.split(' ').map((v) => parseFloat(v))
  return hslToHex(h, s, l)
}

function alphaHex(hex, alpha) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()
  return `${hex}${a}`
}

export function buildThemeTs(pal) {
  const bg = channelsToHex(pal.tokens.background)
  const surface = channelsToHex(pal.tokens.card)
  const elevated = channelsToHex(pal.tokens.secondary)
  const text = channelsToHex(pal.tokens.foreground)
  const textSecondary = channelsToHex(pal.tokens['muted-foreground'])
  const accent = channelsToHex(pal.tokens.primary)
  const onAccent = channelsToHex(pal.tokens['primary-foreground'])
  const border = pal.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const borderActive = pal.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'
  const textMuted = pal.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'

  return `export const theme = {
  bg: '${bg}',
  surface: '${surface}',
  elevated: '${elevated}',
  border: '${border}',
  borderActive: '${borderActive}',
  text: '${text}',
  textSecondary: '${textSecondary}',
  textMuted: '${textMuted}',
  accent: '${accent}',
  accentLight: '${alphaHex(accent, 0.12)}',
  onAccent: '${onAccent}',
  success: '#22C55E', successBg: 'rgba(34,197,94,0.10)',
  warning: '#F59E0B', warningBg: 'rgba(245,158,11,0.10)',
  danger: '#EF4444', dangerBg: 'rgba(239,68,68,0.10)',
  radius: 16,
} as const
`
}
