export interface DocLink {
  label: string
  href: string
}

export interface DocSection {
  title: string
  slug: string
  icon: string
  links: DocLink[]
}

export const DOC_NAV: DocSection[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    icon: 'rocket',
    links: [
      { label: 'What is WyberAi?', href: '/docs/getting-started/what-is-wyber' },
      { label: 'Your first build', href: '/docs/getting-started/your-first-build' },
      { label: 'How credits work', href: '/docs/getting-started/how-credits-work' },
    ],
  },
  {
    title: 'Web Apps',
    slug: 'web-apps',
    icon: 'monitor',
    links: [
      { label: 'Generating a web app', href: '/docs/web-apps/generating' },
      { label: 'Connecting Supabase', href: '/docs/web-apps/supabase-backend' },
      { label: 'Publishing', href: '/docs/web-apps/publishing' },
      { label: 'Custom domains', href: '/docs/web-apps/custom-domains' },
    ],
  },
  {
    title: 'Mobile Apps',
    slug: 'mobile-apps',
    icon: 'phone',
    links: [
      { label: 'Generating a mobile app', href: '/docs/mobile-apps/generating' },
      { label: 'The live preview', href: '/docs/mobile-apps/live-preview' },
      { label: 'Exporting to Expo', href: '/docs/mobile-apps/exporting-to-expo' },
      { label: 'App Store submission', href: '/docs/mobile-apps/app-store-submission' },
    ],
  },
  {
    title: 'Account & Billing',
    slug: 'account-billing',
    icon: 'settings',
    links: [
      { label: 'Plans & pricing', href: '/docs/account-billing/plans' },
      { label: 'Credits explained', href: '/docs/account-billing/credits' },
      { label: 'AI models', href: '/docs/account-billing/models' },
    ],
  },
]
