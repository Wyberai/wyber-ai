// Wyber AI — Custom Icon System
// Sky-blue flavored, exclusively designed for Wyber AI
// Usage: import { IconApps, IconAgents, IconFlows } from '@/components/shared/WyberIcons'

const BRAND = '#0EA5E9'
const BRAND_DIM = 'rgba(14,165,233,0.15)'

interface IconProps {
  size?: number
  color?: string
  style?: React.CSSProperties
}

// ─── Three Pillar Icons ────────────────────────────────────────────────────

export function IconApps({ size = 24, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect x="2" y="2" width="9" height="9" rx="2.5" fill={color} opacity="0.9"/>
      <rect x="13" y="2" width="9" height="9" rx="2.5" fill={color} opacity="0.5"/>
      <rect x="2" y="13" width="9" height="9" rx="2.5" fill={color} opacity="0.5"/>
      <rect x="13" y="13" width="9" height="9" rx="2.5" fill={color} opacity="0.7"/>
      <path d="M15 17.5h4M17 15.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconAgents({ size = 24, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="8" r="4" fill={color} opacity="0.9"/>
      <circle cx="12" cy="8" r="2" fill="white" opacity="0.9"/>
      <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="19" cy="6" r="2.5" fill={color} opacity="0.5"/>
      <path d="M18 6h2M19 5v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5" cy="6" r="2.5" fill={color} opacity="0.5"/>
      <path d="M4 6h2M5 5v2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

export function IconFlows({ size = 24, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <rect x="1" y="9" width="6" height="6" rx="2" fill={color} opacity="0.9"/>
      <rect x="9" y="3" width="6" height="6" rx="2" fill={color} opacity="0.6"/>
      <rect x="9" y="15" width="6" height="6" rx="2" fill={color} opacity="0.6"/>
      <rect x="17" y="9" width="6" height="6" rx="2" fill={color} opacity="0.9"/>
      <path d="M7 12h2M15 6v3M15 15v3M15 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="12" r="1" fill="white"/>
      <circle cx="15" cy="12" r="1" fill="white"/>
    </svg>
  )
}

// ─── Nav / Sidebar Icons ───────────────────────────────────────────────────

export function IconHome({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

export function IconProjects({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  )
}

export function IconTemplates({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}

export function IconSettings({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  )
}

export function IconCommunity({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/>
    </svg>
  )
}

// ─── Flow Node Type Icons ──────────────────────────────────────────────────

export function IconTrigger({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill={color} opacity="0.9"/>
    </svg>
  )
}

export function IconAIStep({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" opacity="0.4"/>
      <circle cx="12" cy="12" r="5" fill={color} opacity="0.8"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function IconAction({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconCondition({ size = 16, color = '#f59e0b', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M12 2L22 12L12 22L2 12Z" fill={color} opacity="0.8"/>
      <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function IconEnd({ size = 16, color = '#22c55e', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="12" r="9" fill={color} opacity="0.85"/>
      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── UI Utility Icons ──────────────────────────────────────────────────────

export function IconPlus({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" style={style}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export function IconArrowRight({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  )
}

export function IconArrowUp({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5,12 12,5 19,12"/>
    </svg>
  )
}

export function IconCheck({ size = 16, color = '#22c55e', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  )
}

export function IconTrash({ size = 16, color = '#ef4444', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  )
}

export function IconCopy({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}

export function IconExternalLink({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
      <polyline points="15,3 21,3 21,9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

export function IconLock({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

export function IconPlay({ size = 16, color = 'white', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  )
}

export function IconSpinner({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', ...style }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" opacity="0.2"/>
      <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function IconChevronDown({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  )
}

export function IconZap({ size = 16, color = BRAND, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
    </svg>
  )
}

// ─── Pillar Icon Badges (with glow background) ────────────────────────────

export function AppsBadge({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: BRAND_DIM, border: `1px solid rgba(14,165,233,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconApps size={size * 0.55} />
    </div>
  )
}

export function AgentsBadge({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: BRAND_DIM, border: `1px solid rgba(14,165,233,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconAgents size={size * 0.55} />
    </div>
  )
}

export function FlowsBadge({ size = 48 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: BRAND_DIM, border: `1px solid rgba(14,165,233,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconFlows size={size * 0.55} />
    </div>
  )
}
