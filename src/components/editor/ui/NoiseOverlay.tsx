'use client';
import { BRAND } from '@/lib/brand-tokens';

/**
 * Film-grain overlay (space-journey texture). Absolutely positioned and
 * pointer-events:none — parent needs position:relative. Keep opacity subtle;
 * this is a texture, not an effect.
 */
export function NoiseOverlay({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: BRAND.noise,
        backgroundRepeat: 'repeat',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}
