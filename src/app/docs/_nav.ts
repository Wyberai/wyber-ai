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
    title: 'AI Agents',
    slug: 'ai-agents',
    icon: 'agents',
    links: [
      { label: 'Building in plain English', href: '/docs/ai-agents/building-in-plain-english' },
      { label: 'Connecting tools (OAuth)', href: '/docs/ai-agents/connecting-tools' },
      { label: 'Running an agent', href: '/docs/ai-agents/running-an-agent' },
      { label: 'Bring your own keys', href: '/docs/ai-agents/bring-your-own-keys' },
    ],
  },
  {
    title: 'Workflows',
    slug: 'workflows',
    icon: 'flows',
    links: [
      { label: 'Building a workflow', href: '/docs/workflows/building' },
      { label: 'Running & monitoring', href: '/docs/workflows/running' },
      { label: 'Workflow templates', href: '/docs/workflows/templates' },
    ],
  },
  {
    title: 'AI Employees',
    slug: 'ai-employees',
    icon: 'users',
    links: [
      { label: 'Hiring your first employee', href: '/docs/ai-employees/getting-started' },
      { label: 'Connecting tools', href: '/docs/ai-employees/connecting-tools' },
      { label: 'Schedules & KPIs', href: '/docs/ai-employees/schedules-kpis' },
      { label: 'Browser & voice control', href: '/docs/ai-employees/browser-voice' },
    ],
  },
  {
    title: 'GTM Engine',
    slug: 'gtm-engine',
    icon: 'target',
    links: [
      { label: 'Setting up your ICP', href: '/docs/gtm-engine/icp-setup' },
      { label: 'Finding & importing leads', href: '/docs/gtm-engine/leads' },
      { label: 'Building sequences', href: '/docs/gtm-engine/sequences' },
      { label: 'Campaigns & analytics', href: '/docs/gtm-engine/campaigns' },
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
