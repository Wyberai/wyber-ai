// One switch for design directions (default OFF).
//
//   NEXT_PUBLIC_DESIGN_DIRECTIONS=true   → picker UI + server brief (set this one; it reaches both sides)
//   DESIGN_DIRECTIONS=true               → server only (kept so the server can be flipped without a client rebuild)
//
// The client UI and the server must agree: if the picker offers directions but the server has the flag off,
// the chosen id is ignored and a palette is picked instead. Using NEXT_PUBLIC_DESIGN_DIRECTIONS avoids that.

export function directionsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DESIGN_DIRECTIONS === 'true') return true
  // process.env.DESIGN_DIRECTIONS is never inlined into the browser bundle; it only exists server-side.
  return typeof window === 'undefined' && process.env.DESIGN_DIRECTIONS === 'true'
}
