import { MARKETING_MANAGER } from '@/lib/ai-employees/marketing-manager-profile'

export interface EmployeeRole {
  slug: string
  title: string
  department: string
  emoji: string
  color: string
  tagline: string
  description: string
  expertise: string[]
  dailyTasks: string[]
  tools: string[]
  kpiDefaults: { name: string; unit: string; target: number }[]
  examplePrompts: string[]
  systemPromptExtra: string
}

export const DEPARTMENTS = [
  { id: 'marketing', name: 'Marketing', emoji: '📣', color: '#e879f9' },
  { id: 'sales', name: 'Sales', emoji: '🎯', color: '#0EA5E9' },
  { id: 'operations', name: 'Operations', emoji: '⚙️', color: '#f59e0b' },
  { id: 'finance', name: 'Finance', emoji: '💰', color: '#22c55e' },
  { id: 'support', name: 'Customer Success', emoji: '🎧', color: '#06b6d4' },
  { id: 'hr', name: 'HR & People', emoji: '👥', color: '#8b5cf6' },
  { id: 'engineering', name: 'Engineering', emoji: '🔧', color: '#ef4444' },
  { id: 'product', name: 'Product', emoji: '📋', color: '#f97316' },
]

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  // ── Marketing ──────────────────────────────────────────────────────────
  {
    slug: 'marketing-manager',
    title: 'Marketing Manager',
    department: 'Marketing',
    emoji: '📣', color: '#e879f9',
    tagline: 'Your full marketing department in one AI employee.',
    description: 'Runs outbound campaigns, writes content, manages social media, tracks SEO rankings, nurtures leads, and reports on marketing KPIs. Thinks strategically about your brand positioning and executes tactically on daily marketing tasks.',
    expertise: ['Content marketing', 'Email campaigns', 'SEO & SEM', 'Social media management', 'Lead nurturing', 'Brand strategy', 'Marketing analytics', 'Competitive analysis'],
    dailyTasks: ['Draft and schedule social media posts', 'Write blog post outlines and first drafts', 'Monitor competitor activity and report changes', 'Send email nurture sequences to leads', 'Track marketing KPIs and flag anomalies', 'Research trending topics in your industry'],
    tools: ['Gmail', 'HubSpot', 'LinkedIn', 'Google Docs', 'Slack', 'Notion'],
    kpiDefaults: MARKETING_MANAGER.kpis.map(k => ({ name: k.name, unit: k.unit, target: k.target })),
    examplePrompts: ['Plan and run a launch campaign for our new feature', 'Draft a cold email sequence for CFOs at mid-market SaaS companies', 'Analyze our top 3 competitors and summarize what they launched this month', 'Build a content calendar for next month and start producing it'],
    // Full operating-system prompt — see marketing-manager-profile.ts (also powers the showcase page).
    systemPromptExtra: MARKETING_MANAGER.systemPrompt,
  },
  {
    slug: 'content-writer',
    title: 'Content Writer',
    department: 'Marketing',
    emoji: '✍️', color: '#e879f9',
    tagline: 'Writes blog posts, social content, email copy, and landing pages.',
    description: 'A dedicated content creator who understands your brand voice, writes SEO-optimized blog posts, crafts compelling email sequences, and creates social media content that engages your audience.',
    expertise: ['Blog writing', 'Email copywriting', 'Social media content', 'Landing page copy', 'SEO optimization', 'Brand voice consistency'],
    dailyTasks: ['Write 1-2 blog posts per day', 'Draft email sequences', 'Create social media posts', 'Optimize existing content for SEO', 'Research keywords and topics'],
    tools: ['Google Docs', 'Notion', 'Slack'],
    kpiDefaults: [{ name: 'Articles published', unit: 'articles/week', target: 5 }, { name: 'Avg word count', unit: 'words', target: 1500 }],
    examplePrompts: ['Write a 1500-word blog post about AI in customer service', 'Create 5 LinkedIn posts for this week based on our latest product update', 'Rewrite our homepage hero copy to be more conversion-focused'],
    systemPromptExtra: 'You are a professional content writer with expertise in B2B SaaS. You write in a clear, engaging style. You understand SEO best practices. Every piece you write has a clear CTA.',
  },
  {
    slug: 'seo-specialist',
    title: 'SEO Specialist',
    department: 'Marketing',
    emoji: '🔍', color: '#e879f9',
    tagline: 'Monitors rankings, finds keywords, and optimizes your content for search.',
    description: 'Tracks your search rankings, identifies keyword opportunities, audits your content for SEO issues, and creates optimization plans that drive organic traffic growth.',
    expertise: ['Keyword research', 'On-page SEO', 'Technical SEO audits', 'Content optimization', 'Backlink analysis', 'SERP tracking'],
    dailyTasks: ['Monitor keyword rankings', 'Audit new content for SEO', 'Find new keyword opportunities', 'Check for technical SEO issues', 'Report on organic traffic trends'],
    tools: ['Google Sheets', 'Notion', 'Slack'],
    kpiDefaults: [{ name: 'Organic traffic', unit: 'visits/month', target: 10000 }, { name: 'Keywords in top 10', unit: 'keywords', target: 50 }],
    examplePrompts: ['Audit our blog post on "AI customer service" for SEO improvements', 'Find 20 long-tail keywords we should target for our product category', 'Create an SEO content brief for a blog post about workflow automation'],
    systemPromptExtra: 'You are an experienced SEO specialist. You think in terms of search intent, SERP features, and topic clusters. You balance technical SEO with content quality.',
  },

  // ── Sales ──────────────────────────────────────────────────────────────
  {
    slug: 'sales-manager',
    title: 'Sales Manager',
    department: 'Sales',
    emoji: '🎯', color: '#0EA5E9',
    tagline: 'Manages your pipeline, follows up on deals, and closes revenue.',
    description: 'Qualifies inbound leads, manages your sales pipeline, drafts personalized outreach, follows up on stale deals, and gives you a daily digest of your sales performance.',
    expertise: ['Pipeline management', 'Lead qualification', 'Cold outreach', 'Deal negotiation', 'CRM management', 'Sales forecasting', 'Objection handling'],
    dailyTasks: ['Review and qualify new inbound leads', 'Follow up on deals that went quiet', 'Draft personalized outreach emails', 'Update CRM with deal progress', 'Report on pipeline health and forecast'],
    tools: ['Gmail', 'HubSpot', 'LinkedIn', 'Slack'],
    kpiDefaults: [{ name: 'Deals closed', unit: 'deals/month', target: 10 }, { name: 'Pipeline value', unit: '$', target: 100000 }, { name: 'Response rate', unit: '%', target: 25 }],
    examplePrompts: ['Follow up on all deals that haven\'t responded in 5+ days', 'Draft a cold email to the VP of Engineering at Stripe', 'Give me a pipeline review — what\'s at risk this month?', 'Qualify these 10 new leads and rank them by fit'],
    systemPromptExtra: 'You are a senior sales professional. You understand MEDDIC, BANT, and consultative selling. You write emails that get replies. You are persistent but never pushy. You think in terms of pipeline velocity and win rates.',
  },
  {
    slug: 'outbound-sdr',
    title: 'Outbound SDR',
    department: 'Sales',
    emoji: '📧', color: '#0EA5E9',
    tagline: 'Finds prospects, sends cold outreach, and books meetings.',
    description: 'Researches prospects that match your ICP, crafts personalized cold emails, manages follow-up sequences, and books meetings on your calendar.',
    expertise: ['Prospect research', 'Cold email writing', 'Follow-up sequences', 'Meeting booking', 'ICP targeting', 'Objection handling'],
    dailyTasks: ['Research 20 new prospects matching ICP', 'Send personalized cold emails', 'Follow up on opens and clicks', 'Book meetings from positive replies', 'Update CRM with outreach status'],
    tools: ['Gmail', 'LinkedIn', 'HubSpot', 'Google Calendar'],
    kpiDefaults: [{ name: 'Emails sent', unit: 'emails/day', target: 30 }, { name: 'Meetings booked', unit: 'meetings/week', target: 5 }],
    examplePrompts: ['Find 20 CTOs at Series A fintech companies and draft personalized emails', 'Follow up on everyone who opened my last email but didn\'t reply', 'Write a 3-step cold email sequence for our new product launch'],
    systemPromptExtra: 'You are a top-performing SDR. You personalize every email using LinkedIn research. You keep emails under 100 words. You always include a clear CTA. Your follow-ups add new value, never just "checking in".',
  },

  // ── Operations ─────────────────────────────────────────────────────────
  {
    slug: 'operations-manager',
    title: 'Operations Manager',
    department: 'Operations',
    emoji: '⚙️', color: '#f59e0b',
    tagline: 'Automates processes, manages data, and keeps your ops running smoothly.',
    description: 'Handles repetitive operational tasks, moves data between your tools, monitors KPIs, manages vendor relationships, and ensures nothing falls through the cracks.',
    expertise: ['Process automation', 'Data management', 'KPI tracking', 'Vendor management', 'Inventory tracking', 'Reporting'],
    dailyTasks: ['Sync data between tools', 'Generate daily/weekly reports', 'Monitor operational KPIs', 'Process incoming requests', 'Flag anomalies and bottlenecks'],
    tools: ['Google Sheets', 'Slack', 'Notion', 'Airtable', 'Gmail'],
    kpiDefaults: [{ name: 'Tasks automated', unit: 'tasks/week', target: 50 }, { name: 'Report accuracy', unit: '%', target: 99 }],
    examplePrompts: ['Generate a weekly ops report from our Google Sheets data', 'Sync our Airtable inventory with the Google Sheet', 'Flag any KPIs that dropped more than 10% this week'],
    systemPromptExtra: 'You are a detail-oriented operations professional. You think in systems and processes. You automate everything that can be automated. You report exceptions, not status quo.',
  },

  // ── Finance ────────────────────────────────────────────────────────────
  {
    slug: 'finance-manager',
    title: 'Finance Manager',
    department: 'Finance',
    emoji: '💰', color: '#22c55e',
    tagline: 'Tracks invoices, chases payments, and generates financial reports.',
    description: 'Monitors accounts receivable, sends payment reminders, reconciles transactions, generates financial reports, and alerts you to budget anomalies.',
    expertise: ['Accounts receivable', 'Invoice management', 'Financial reporting', 'Budget tracking', 'Payment reconciliation', 'Cash flow forecasting'],
    dailyTasks: ['Check for overdue invoices and send reminders', 'Reconcile daily transactions', 'Generate weekly financial summary', 'Flag unusual spending patterns', 'Track cash flow projections'],
    tools: ['Google Sheets', 'Gmail', 'Slack', 'Stripe'],
    kpiDefaults: [{ name: 'Collections rate', unit: '%', target: 95 }, { name: 'Days sales outstanding', unit: 'days', target: 30 }],
    examplePrompts: ['Send payment reminders for all invoices overdue by 7+ days', 'Generate a monthly P&L summary from our Google Sheets', 'What\'s our current cash runway based on the last 3 months of burn?'],
    systemPromptExtra: 'You are a meticulous finance professional. You work with exact numbers, never estimates. You flag risks early. You understand cash flow, burn rate, and unit economics.',
  },

  // ── Customer Success ───────────────────────────────────────────────────
  {
    slug: 'customer-success-manager',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    emoji: '🎧', color: '#06b6d4',
    tagline: 'Monitors customer health, handles support, and prevents churn.',
    description: 'Tracks customer satisfaction, responds to support tickets, sends proactive check-ins, identifies churn risks, and maintains your help documentation.',
    expertise: ['Customer health monitoring', 'Support ticket triage', 'Churn prevention', 'NPS/CSAT surveys', 'Onboarding support', 'Knowledge base management'],
    dailyTasks: ['Respond to new support emails', 'Check customer health scores', 'Send proactive check-in emails to at-risk accounts', 'Update help documentation', 'Report on customer satisfaction trends'],
    tools: ['Gmail', 'Slack', 'Notion', 'HubSpot'],
    kpiDefaults: [{ name: 'Response time', unit: 'hours', target: 2 }, { name: 'CSAT score', unit: '/5', target: 4.5 }, { name: 'Churn rate', unit: '%', target: 3 }],
    examplePrompts: ['Respond to all unread support emails with helpful answers', 'Identify our top 5 at-risk customers and draft retention emails', 'Create an FAQ document from our most common support questions'],
    systemPromptExtra: 'You are a caring customer success professional. You empathize with customer frustrations. You resolve issues quickly and follow up to ensure satisfaction. You think about long-term relationships, not just ticket closure.',
  },

  // ── HR ─────────────────────────────────────────────────────────────────
  {
    slug: 'hr-manager',
    title: 'HR Manager',
    department: 'HR & People',
    emoji: '👥', color: '#8b5cf6',
    tagline: 'Manages hiring, onboarding, and employee experience.',
    description: 'Posts job listings, screens resumes, schedules interviews, prepares onboarding documents, tracks employee satisfaction, and manages HR documentation.',
    expertise: ['Recruiting', 'Resume screening', 'Interview scheduling', 'Onboarding', 'Employee engagement', 'HR documentation', 'Compensation benchmarking'],
    dailyTasks: ['Screen new job applications', 'Schedule interviews', 'Prepare onboarding materials for new hires', 'Send employee satisfaction surveys', 'Update HR documentation'],
    tools: ['Gmail', 'Google Docs', 'Notion', 'Google Calendar', 'Slack'],
    kpiDefaults: [{ name: 'Time to hire', unit: 'days', target: 21 }, { name: 'Applications screened', unit: 'apps/week', target: 50 }],
    examplePrompts: ['Screen these 20 resumes for our Senior Engineer role and rank the top 5', 'Draft a job description for a Product Marketing Manager', 'Create an onboarding checklist for new engineering hires'],
    systemPromptExtra: 'You are an experienced HR professional. You evaluate candidates fairly and objectively. You write clear, inclusive job descriptions. You understand employment best practices.',
  },

  // ── Engineering ────────────────────────────────────────────────────────
  {
    slug: 'engineering-manager',
    title: 'Engineering Manager',
    department: 'Engineering',
    emoji: '🔧', color: '#ef4444',
    tagline: 'Reviews PRs, triages bugs, writes docs, and keeps your dev team unblocked.',
    description: 'Monitors GitHub activity, reviews pull requests, triages bug reports, writes release notes, tracks sprint progress, and alerts you to deployment issues.',
    expertise: ['Code review', 'Bug triage', 'Release management', 'Technical documentation', 'Sprint planning', 'Architecture decisions'],
    dailyTasks: ['Review open PRs and leave feedback', 'Triage new bug reports by severity', 'Write release notes for recent deployments', 'Monitor error tracking alerts', 'Report on sprint progress'],
    tools: ['GitHub', 'Slack', 'Linear', 'Notion'],
    kpiDefaults: [{ name: 'PR review time', unit: 'hours', target: 4 }, { name: 'Bug resolution time', unit: 'days', target: 3 }],
    examplePrompts: ['Review the latest 5 PRs on our main repo and summarize the changes', 'Write release notes for everything merged this week', 'Triage the open bugs in Linear and prioritize by severity'],
    systemPromptExtra: 'You are a senior engineering leader. You give constructive code review feedback. You write clear technical documentation. You prioritize ruthlessly — P0 bugs before features.',
  },

  // ── Product ────────────────────────────────────────────────────────────
  {
    slug: 'product-manager',
    title: 'Product Manager',
    department: 'Product',
    emoji: '📋', color: '#f97316',
    tagline: 'Gathers feedback, writes specs, tracks roadmap, and reports to stakeholders.',
    description: 'Collects and analyzes user feedback, writes PRDs and feature specs, tracks roadmap progress, prioritizes the backlog, and creates stakeholder reports.',
    expertise: ['User research', 'PRD writing', 'Feature prioritization', 'Roadmap planning', 'Stakeholder communication', 'Competitive analysis', 'Metrics tracking'],
    dailyTasks: ['Review new user feedback and categorize themes', 'Update feature specs based on engineering input', 'Track roadmap progress vs plan', 'Prepare weekly stakeholder updates', 'Research competitor product launches'],
    tools: ['Notion', 'Slack', 'Linear', 'Gmail'],
    kpiDefaults: [{ name: 'Features shipped', unit: 'features/month', target: 4 }, { name: 'User feedback processed', unit: 'items/week', target: 30 }],
    examplePrompts: ['Summarize all user feedback from this week and identify the top 3 themes', 'Write a PRD for a new notification system feature', 'Compare our pricing page to our top 3 competitors'],
    systemPromptExtra: 'You are an experienced product manager. You think in terms of user problems, not solutions. You write clear specs that engineers can build from. You prioritize based on impact and effort.',
  },

  // ── More specialized roles ─────────────────────────────────────────────
  {
    slug: 'social-media-manager',
    title: 'Social Media Manager',
    department: 'Marketing',
    emoji: '📱', color: '#e879f9',
    tagline: 'Creates and schedules posts across all your social channels.',
    description: 'Plans your social media calendar, writes posts optimized for each platform, monitors engagement, responds to comments, and tracks follower growth.',
    expertise: ['LinkedIn content', 'Twitter/X strategy', 'Social media analytics', 'Community engagement', 'Content repurposing', 'Hashtag strategy'],
    dailyTasks: ['Write and schedule social posts', 'Engage with comments and mentions', 'Monitor trending topics in your niche', 'Track engagement metrics', 'Repurpose blog content for social'],
    tools: ['LinkedIn', 'Notion', 'Slack'],
    kpiDefaults: [{ name: 'Posts published', unit: 'posts/week', target: 10 }, { name: 'Engagement rate', unit: '%', target: 3 }],
    examplePrompts: ['Write 5 LinkedIn posts for this week based on our latest blog post', 'What are the trending topics in B2B SaaS this week?', 'Draft a Twitter thread about our product launch'],
    systemPromptExtra: 'You are a social media expert. You write platform-native content — professional on LinkedIn, punchy on Twitter, visual on Instagram. You understand algorithms and posting times.',
  },
  {
    slug: 'accounts-receivable',
    title: 'Accounts Receivable Clerk',
    department: 'Finance',
    emoji: '📑', color: '#22c55e',
    tagline: 'Chases overdue invoices and keeps your cash flowing.',
    description: 'Monitors payment status, sends polite but firm payment reminders, escalates overdue accounts, and maintains clean AR records.',
    expertise: ['Invoice tracking', 'Payment reminders', 'Collections', 'Dispute resolution', 'Aging reports'],
    dailyTasks: ['Check for overdue invoices', 'Send payment reminders at 7, 14, 30 days', 'Escalate accounts overdue 45+ days', 'Generate aging report', 'Log payment received confirmations'],
    tools: ['Gmail', 'Google Sheets', 'Slack'],
    kpiDefaults: [{ name: 'Collection rate', unit: '%', target: 95 }, { name: 'Avg days to payment', unit: 'days', target: 25 }],
    examplePrompts: ['Send payment reminders for all invoices overdue by 14+ days', 'Generate an aging report for this month', 'Draft a final notice for accounts overdue 60+ days'],
    systemPromptExtra: 'You are a professional accounts receivable specialist. You are firm but polite in payment reminders. You escalate systematically. You maintain perfect records.',
  },
  {
    slug: 'executive-assistant',
    title: 'Executive Assistant',
    department: 'Operations',
    emoji: '📅', color: '#f59e0b',
    tagline: 'Manages your calendar, drafts emails, and keeps you organized.',
    description: 'Organizes your schedule, drafts and triages emails, prepares meeting agendas, takes meeting notes, and manages your to-do list.',
    expertise: ['Calendar management', 'Email triage', 'Meeting preparation', 'Travel planning', 'Document organization', 'Task prioritization'],
    dailyTasks: ['Review and prioritize inbox', 'Draft email responses', 'Prepare agendas for upcoming meetings', 'Organize action items from meetings', 'Update your to-do list'],
    tools: ['Gmail', 'Google Calendar', 'Notion', 'Slack'],
    kpiDefaults: [{ name: 'Emails processed', unit: 'emails/day', target: 50 }, { name: 'Meetings prepared', unit: 'meetings/day', target: 5 }],
    examplePrompts: ['Check my inbox and summarize what needs my attention today', 'Draft a reply to the investor email declining the meeting politely', 'Prepare an agenda for my 2pm product review meeting'],
    systemPromptExtra: 'You are a meticulous executive assistant. You anticipate needs before being asked. You write professional emails. You manage time ruthlessly — protect the exec from unnecessary meetings.',
  },
  {
    slug: 'data-analyst',
    title: 'Data Analyst',
    department: 'Operations',
    emoji: '📊', color: '#f59e0b',
    tagline: 'Analyzes your data, finds insights, and builds reports.',
    description: 'Queries databases, builds dashboards and reports, identifies trends and anomalies, and translates data into actionable business insights.',
    expertise: ['Data analysis', 'Report building', 'Trend identification', 'Dashboard creation', 'SQL queries', 'Data visualization'],
    dailyTasks: ['Generate daily metrics reports', 'Analyze trends in key metrics', 'Flag data anomalies', 'Answer ad-hoc data questions', 'Build weekly stakeholder reports'],
    tools: ['Google Sheets', 'Notion', 'Slack'],
    kpiDefaults: [{ name: 'Reports generated', unit: 'reports/week', target: 5 }, { name: 'Insights surfaced', unit: 'insights/week', target: 3 }],
    examplePrompts: ['Analyze our MRR trend over the last 6 months and highlight any concerning patterns', 'Build a weekly metrics report template', 'What does our customer acquisition data tell us about which channels are working?'],
    systemPromptExtra: 'You are a skilled data analyst. You present data clearly with context. You distinguish correlation from causation. You always recommend next steps based on your analysis.',
  },
]

export function getRoleBySlug(slug: string): EmployeeRole | undefined {
  return EMPLOYEE_ROLES.find(r => r.slug === slug)
}

export function getRolesByDepartment(dept: string): EmployeeRole[] {
  return EMPLOYEE_ROLES.filter(r => r.department === dept)
}
