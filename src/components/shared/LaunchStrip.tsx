import { StripClient } from '@/components/signal/StripClient'

/**
 * A slim announcement strip for the WyberCode 1.0 launch (3x the credits on every paid plan, same price). Shown to every
 * region on the homepage and the pricing page, so people arriving from the launch posts see what was promised. It can be
 * dismissed. Remove it when the launch has passed.
 * Colours come from the Signal theme tokens (--sg-hot, --sg-soft), so the text stays readable in both dark and light mode.
 * Do not use the older --brand-text variable here: it has no light value, which made these banners invisible in light mode.
 */
export function LaunchStrip() {
  return <StripClient id="wybercode-1" href="/pricing">WyberCode 1.0 is live: 3× the credits on every paid plan, same price</StripClient>
}

// Tech Expo Gujarat ends on 29 Nov 2026. The strip takes itself down after that date (end of the day, India time), so it
// cannot be left up by mistake.
export const EXPO_ENDS = '2026-11-30T00:00:00+05:30'

/** Tech Expo Gujarat banner, India visitors only. It can be dismissed and ends by itself. */
export function ExpoStrip() {
  return <StripClient id="expo-gujarat-2026" href="/gujaratexpo" until={EXPO_ENDS}>Meet WyberAi at Tech Expo Gujarat, booth S23, 27–29 Nov, Ahmedabad</StripClient>
}
