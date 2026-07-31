// Cheap heuristic for "is this a game preview" — no dedicated project field
// exists yet, so we sniff the bundled source for the usual game-engine tells.
// False positives just mean a 5cr charge instead of 2cr on a project that
// happens to import three.js for a non-game visual; acceptable for v1.
//
// Shared between the server-side charge (src/app/api/preview-access/route.ts)
// and the client-side gate (src/components/editor/MobilePreviewPanel.tsx) so
// the two can never disagree about which cost applies to a given project —
// a mismatch there is exactly what let the QR show "unlocked" while the
// server still charged the higher game rate and 402'd the viewer mid-scan.
const GAME_SIGNALS = ['canvas', 'p5.js', 'p5.min.js', 'three.js', 'phaser', 'matter.js', 'matter-js']

export function detectGame(files: Record<string, { content?: string }> | null | undefined): boolean {
  if (!files) return false
  const blob = Object.values(files)
    .map(f => f?.content ?? '')
    .join('\n')
    .toLowerCase()
  return GAME_SIGNALS.some(sig => blob.includes(sig))
}
