// BrandLogo.tsx — Real brand logos via Logo.dev CDN
// No API key needed for basic usage
// Falls back to custom SVG if logo fails to load

import { useState } from 'react'

interface BrandLogoProps {
  domain: string        // e.g. "slack.com"
  name: string          // e.g. "Slack" — used for alt text + fallback
  size?: number
  style?: React.CSSProperties
}

// Custom fallback SVGs for each tool — shown if logo.dev fails
const FALLBACK_ICONS: Record<string, React.ReactNode> = {
  'slack.com': (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/>
      <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/>
      <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/>
      <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/>
      <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
    </svg>
  ),
  'gmail.google.com': (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
    </svg>
  ),
  'hubspot.com': (
    <svg viewBox="0 0 24 24" fill="#FF7A59">
      <path d="M22.162 5.656a8.384 8.384 0 0 0-3.79-.897h-.036a8.384 8.384 0 0 0-3.789.897A8.384 8.384 0 0 0 11.2 8.847a8.384 8.384 0 0 0-1.05 4.1v.05a8.384 8.384 0 0 0 1.05 4.1 8.384 8.384 0 0 0 3.347 3.19 8.384 8.384 0 0 0 3.789.898h.036a8.384 8.384 0 0 0 3.79-.897 8.384 8.384 0 0 0 3.346-3.191A8.384 8.384 0 0 0 24 12.997v-.05a8.384 8.384 0 0 0-1.05-4.1 8.384 8.384 0 0 0-3.346-3.191h-.001zM18.336 16.9a4.9 4.9 0 0 1-4.9-4.9 4.9 4.9 0 0 1 4.9-4.9 4.9 4.9 0 0 1 4.9 4.9 4.9 4.9 0 0 1-4.9 4.9zM9.085 8.386A6.55 6.55 0 0 1 8.1 4.969C8.1 2.22 5.876 0 3.123 0S-1.852 2.22-1.852 4.97c0 2.75 2.224 4.97 4.975 4.97.716 0 1.395-.152 2.009-.424l2.29 2.29a6.55 6.55 0 0 1 .424-2.01l-.761-.761v-.65z"/>
    </svg>
  ),
  'airtable.com': (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M11.955.592L.592 4.64a.4.4 0 0 0-.002.75l11.36 4.115a.8.8 0 0 0 .547 0l11.36-4.116a.4.4 0 0 0-.002-.75L12.45.592a.8.8 0 0 0-.496 0z" fill="#FC0"/>
      <path d="M12.8 13.048v8.568a.4.4 0 0 0 .54.375l9.6-3.696a.8.8 0 0 0 .52-.748V9.18a.4.4 0 0 0-.54-.376l-9.6 3.696a.8.8 0 0 0-.52.748z" fill="#31C2FE"/>
      <path d="M10.08 13.572l-2.78 1.338-.84.404-5.58 2.684A.4.4 0 0 1 .32 17.62V9.176a.8.8 0 0 1 .112-.408.4.4 0 0 1 .074-.1.8.8 0 0 1 .636-.24l9.01 4.09c.23.105.24.432-.073.606V13.572z" fill="#FC3"/>
    </svg>
  ),
  'notion.so': (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
    </svg>
  ),
  'github.com': (
    <svg viewBox="0 0 24 24" fill="white">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  'openai.com': (
    <svg viewBox="0 0 24 24" fill="white">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.4-.679zm2.010-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  ),
  'stripe.com': (
    <svg viewBox="0 0 24 24" fill="#635BFF">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
    </svg>
  ),
  'supabase.com': (
    <svg viewBox="0 0 24 24" fill="#3ECF8E">
      <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.015.985 1.26 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.58L11.9 1.036z"/>
    </svg>
  ),
  'sendgrid.com': (
    <svg viewBox="0 0 24 24" fill="#1A82E2">
      <path d="M0 8h8V0H0v8zm8 8H0v8h8v-8zM16 0H8v8h8V0zm8 0h-8v8h8V0zM8 16H0v8h8v-8zm8-8H8v8h8V8zm8 0h-8v8h8V8zm0 8h-8v8h8v-8z"/>
    </svg>
  ),
  'linear.app': (
    <svg viewBox="0 0 24 24" fill="#5E6AD2">
      <path d="M2.049 14.87c-.133-.525.525-1.184 1.05-.918 3.07 1.524 6.922 2.12 10.724 2.12 3.802 0 7.654-.596 10.724-2.12.525-.266 1.183.393 1.05.918C23.802 20.33 18.524 24 12 24S.198 20.33 2.049 14.87zM4.88 8.87L12 1.75l7.12 7.12a.75.75 0 0 1-1.06 1.06L12 3.87 5.94 9.93a.75.75 0 1 1-1.06-1.06zm-1.3 4.06a.75.75 0 0 1 0-1.06l8.42-8.42a.75.75 0 0 1 1.06 0l8.42 8.42a.75.75 0 1 1-1.06 1.06L12 4.99 4.64 12.93a.75.75 0 0 1-1.06 0z"/>
    </svg>
  ),
}

const TOOL_DOMAINS: Record<string, string> = {
  slack: 'slack.com',
  gmail: 'gmail.com',
  hubspot: 'hubspot.com',
  airtable: 'airtable.com',
  notion: 'notion.so',
  github: 'github.com',
  openai: 'openai.com',
  webhook: '',
  supabase: 'supabase.com',
  sendgrid: 'sendgrid.com',
  stripe: 'stripe.com',
  linear: 'linear.app',
  linkedin: 'linkedin.com',
  twitter: 'twitter.com',
  calendly: 'calendly.com',
  zoom: 'zoom.us',
  'google sheets': 'sheets.google.com',
  'google docs': 'docs.google.com',
  'google calendar': 'calendar.google.com',
  jira: 'atlassian.com',
  asana: 'asana.com',
  trello: 'trello.com',
  discord: 'discord.com',
  intercom: 'intercom.com',
  zendesk: 'zendesk.com',
  mailchimp: 'mailchimp.com',
  twilio: 'twilio.com',
  shopify: 'shopify.com',
  figma: 'figma.com',
  dropbox: 'dropbox.com',
  salesforce: 'salesforce.com',
  monday: 'monday.com',
  clickup: 'clickup.com',
  freshdesk: 'freshdesk.com',
  pipedrive: 'pipedrive.com',
  quickbooks: 'quickbooks.intuit.com',
  xero: 'xero.com',
  'claude ai': 'anthropic.com',
  anthropic: 'anthropic.com',
  logic: '',
  http: '',
  end: '',
  schedule: '',
  email: 'gmail.com',
}

export function getBrandDomain(toolId: string): string {
  return TOOL_DOMAINS[toolId] || ''
}

export function BrandLogo({ domain, name, size = 32, style }: BrandLogoProps) {
  const [failed, setFailed] = useState(false)
  const fallback = FALLBACK_ICONS[domain]

  if (!domain || failed) {
    if (fallback) {
      return (
        <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
          <div style={{ width: size, height: size }}>
            {fallback}
          </div>
        </div>
      )
    }
    // Generic fallback
    return (
      <div style={{ width: size, height: size, borderRadius: size * 0.25, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, color: '#a1a1aa', fontWeight: 700, ...style }}>
        {name[0]}
      </div>
    )
  }

  return (
    <img
      src={`https://img.logo.dev/${domain}?token=pk_I0pI4NHLSmyw-WgJgdqmNg&size=${size * 2}&format=png`}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ borderRadius: size * 0.2, objectFit: 'contain', ...style }}
    />
  )
}

// Convenience component for tool IDs
export function ToolLogo({ toolId, name, size = 32, style }: { toolId: string; name: string; size?: number; style?: React.CSSProperties }) {
  const domain = getBrandDomain(toolId)
  return <BrandLogo domain={domain} name={name} size={size} style={style} />
}
