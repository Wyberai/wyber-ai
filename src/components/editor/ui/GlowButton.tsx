'use client';
import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** 'primary' = filled accent w/ glow; 'ghost' = hairline outline */
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
  style?: CSSProperties;
}

/**
 * Accent button with the space-journey glow. Inline-styled (reset gotcha).
 */
export function GlowButton({ children, variant = 'primary', size = 'md', style, disabled, ...rest }: Props) {
  const [hover, setHover] = useState(false);
  const primary = variant === 'primary';
  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={e => { setHover(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={e => { setHover(false); rest.onMouseLeave?.(e); }}
      style={{
        border: primary ? 'none' : '1px solid var(--brand-border-strong)',
        borderRadius: 8,
        padding: size === 'sm' ? '5px 12px' : '8px 16px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: primary
          ? (disabled ? 'var(--bg-elevated)' : hover ? 'var(--brand-accent-hot)' : 'var(--brand-accent)')
          : (hover && !disabled ? 'rgba(255,255,255,0.05)' : 'transparent'),
        color: primary ? (disabled ? 'var(--ide-text3)' : '#fff') : 'var(--ide-text2)',
        boxShadow: primary && !disabled ? `0 0 ${hover ? 18 : 10}px var(--brand-glow${hover ? '' : '-soft'})` : 'none',
        transition: `all var(--brand-dur-fast) var(--brand-ease)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled && !primary ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
