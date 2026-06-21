export interface UseCase {
  slug: string
  h1: string
  metaTitle: string
  metaDesc: string
  pillar: 'web' | 'mobile' | 'agents' | 'workflows'
  pillarLabel: string
  pillarColor: string
  tagline: string
  body: string[]         // paragraphs before features
  features: { title: string; desc: string }[]
  promptExample: string  // a ready-to-use starter prompt
  ctaLabel: string
  ctaHref: string
  faqs: { q: string; a: string }[]
}

export const USE_CASES: UseCase[] = [
  {
    slug: 'build-mobile-app-with-ai',
    h1: 'Build a Mobile App with AI — No Code Required',
    metaTitle: 'Build a Mobile App with AI (No Code) — WyberAi',
    metaDesc: 'Generate a full React Native + Expo mobile app from plain English in minutes. Runs on iOS and Android. No coding knowledge needed.',
    pillar: 'mobile',
    pillarLabel: 'Mobile Apps',
    pillarColor: '#8b5cf6',
    tagline: 'Describe your app. Get production-ready React Native code. Preview on your phone in 60 seconds.',
    body: [
      'Building a mobile app used to mean hiring an iOS developer, an Android developer, and waiting months for a first build. WyberAi changes that entirely.',
      'Describe your app in plain English — screens, features, data — and WyberAi generates a complete React Native + Expo project: navigation, components, realistic data, and styling. Scan the QR code to preview on your actual phone, with no Xcode or Android Studio required.',
    ],
    features: [
      { title: 'React Native + Expo output', desc: 'Every app uses the industry-standard mobile stack. Your code works with Expo Go, EAS Build, and the App Store.' },
      { title: 'Live device preview', desc: 'Scan a QR code to load your app on any iPhone or Android phone instantly. See changes in real time.' },
      { title: 'Full navigation included', desc: 'Bottom tabs, stack navigation, and screen-to-screen linking — all wired correctly, no boilerplate.' },
      { title: 'iOS + Android from one codebase', desc: 'React Native runs on both platforms. Write your app once, deploy to both stores.' },
      { title: 'Export-ready source code', desc: 'Export the full Expo project as a zip. Continue in VS Code, submit to the App Store, or hand it to a developer.' },
      { title: 'Dark theme design system', desc: 'Every app ships with professional dark-mode styling, proper spacing, and accessible colors.' },
    ],
    promptExample: 'Build a fitness tracker app with a Home screen showing today\'s workout summary, a History screen with a weekly progress chart, and a Profile screen with total workouts and current streak. Use a bottom tab navigator.',
    ctaLabel: 'Build my mobile app free',
    ctaHref: '/dashboard?new=mobile',
    faqs: [
      { q: 'Do I need to know how to code?', a: 'No. You describe your app in plain English and WyberAi generates all the code. You can preview on your phone without touching a single file.' },
      { q: 'What tech stack does WyberAi use for mobile?', a: 'WyberAi generates React Native projects using Expo SDK 52. This is the industry-standard stack used by companies like Shopify, Discord, and Meta.' },
      { q: 'Can I publish to the App Store?', a: 'Yes. Export your project and use Expo Application Services (EAS Build) to build an IPA or APK and submit to the App Store or Google Play.' },
      { q: 'How long does it take to generate a mobile app?', a: 'Most apps generate in minutes. Complex multi-screen apps may take 90–120 seconds. You see the code streaming in real time.' },
      { q: 'Can I add more screens after the initial generation?', a: 'Yes. Just describe the new screen in chat: "Add a Settings screen with a profile editor and notification toggles." WyberAi adds it with full navigation wiring.' },
    ],
  },
  {
    slug: 'ai-agent-builder-no-code',
    h1: 'AI Agent Builder — No Code Required',
    metaTitle: 'AI Agent Builder No-Code — Build Autonomous Agents | WyberAi',
    metaDesc: 'Build AI agents that monitor, decide, and act automatically — connected to Gmail, Slack, HubSpot, and 250+ tools. No code required.',
    pillar: 'agents',
    pillarLabel: 'AI Agents',
    pillarColor: '#10b981',
    tagline: 'Describe what you want the agent to watch and do. WyberAi builds the canvas, picks the tools, and runs it automatically.',
    body: [
      'AI agents are autonomous programs that monitor data sources, apply AI reasoning, and take action — without you needing to trigger them manually. Until now, building one required writing code, managing API keys, and deploying infrastructure.',
      'WyberAi\'s agent builder lets you describe an agent in plain English and generates the full visual canvas: trigger node, tool nodes, AI reasoning nodes, and action nodes. Connect your apps once, then run the agent manually or set it on a schedule — daily, hourly, or any custom cron expression.',
    ],
    features: [
      { title: '250+ tool integrations', desc: 'Gmail, Slack, HubSpot, Airtable, GitHub, Linear, Stripe, Notion, and hundreds more — all via Composio, no API key management per tool.' },
      { title: 'Visual canvas editor', desc: 'See your agent\'s logic as a node graph. Add conditions, branches, and AI reasoning steps without writing code.' },
      { title: 'Scheduled + manual triggers', desc: 'Run agents on demand or on a cron schedule — daily, hourly, weekly, or any custom expression. Credits are checked before every run.' },
      { title: 'AI reasoning nodes', desc: 'Add a Claude-powered node to classify, summarize, score, or decide — then route the output to the next action.' },
      { title: 'Live run logs', desc: 'Each node shows its output inline after a run so you can debug and iterate without leaving the canvas.' },
      { title: 'No infrastructure to manage', desc: 'Agents run on Wyber\'s infrastructure. No servers, no deployment, no uptime monitoring.' },
    ],
    promptExample: 'Build an agent that checks my Gmail for emails from investors or enterprise prospects, summarizes each one with key action items, and sends me a Slack DM with the summary.',
    ctaLabel: 'Build my agent free',
    ctaHref: '/dashboard?new=agent',
    faqs: [
      { q: 'Do I need to know how to code to build an agent?', a: 'No. You describe the agent\'s job in plain English and WyberAi generates the node canvas. You connect your tools once in Settings → Integrations.' },
      { q: 'What tools can agents connect to?', a: 'WyberAi uses Composio for integrations — covering Gmail, Outlook, Slack, HubSpot, Salesforce, Airtable, GitHub, Linear, Stripe, Notion, Google Calendar, and 240+ more.' },
      { q: 'How do I trigger an agent?', a: 'Click Run from the dashboard for a one-off run, or set a schedule (daily, hourly, weekly, or custom cron) on the agent\'s configuration page. The scheduler checks your credit balance before every run and emails you if a run is skipped.' },
      { q: 'Can agents make decisions with AI?', a: 'Yes. You can add an AI reasoning node that uses Claude to classify, score, summarize, or decide — and then route different outputs to different actions.' },
      { q: 'How much does running an agent cost?', a: 'Agent runs cost credits — typically 1 credit per AI node execution. Check the credit estimate before running.' },
    ],
  },
  {
    slug: 'build-saas-without-code',
    h1: 'Build a SaaS Product Without Code — Launch in Days',
    metaTitle: 'Build a SaaS Without Code — AI SaaS Builder | WyberAi',
    metaDesc: 'Build a complete SaaS product with auth, database, payments, and dashboard — from plain English, no coding required. Launch in days, not months.',
    pillar: 'web',
    pillarLabel: 'Web Apps',
    pillarColor: '#0EA5E9',
    tagline: 'Describe your SaaS. Get auth, database, dashboard, and deploy URL — in minutes.',
    body: [
      'Launching a SaaS product used to mean months of development, a technical co-founder, and significant upfront investment. WyberAi changes the economics entirely.',
      'Describe your product in plain English and WyberAi generates a complete, production-ready React app: authentication flows, a data model, dashboard UI, and all the supporting components. Connect Supabase for a real database and deploy to Vercel in one click. You have a live URL before lunch.',
    ],
    features: [
      { title: 'Complete app from one prompt', desc: 'Every file, every component, every data record — generated in minutes. No scaffolding, no boilerplate.' },
      { title: 'Authentication included', desc: 'Sign-up, login, password reset, and session management — all wired in when you connect Supabase.' },
      { title: 'Real database with RLS', desc: 'Connect Supabase and your app uses a live Postgres database with Row Level Security so each user only sees their own data.' },
      { title: 'Professional dashboard UI', desc: 'Every app ships with a dark-mode design system, data tables, charts, modals, and stats cards.' },
      { title: 'Deploy in 60 seconds', desc: 'One click publishes to Vercel. Your SaaS gets a live URL at yourapp.wyberai.app instantly.' },
      { title: 'Full source code export', desc: 'Export the complete codebase — React + Vite. You own it completely. Hand it to a developer or push to GitHub.' },
    ],
    promptExample: 'Build a SaaS CRM for freelancers with a client list, project pipeline (Prospect → Active → Invoiced → Paid), invoice tracker, and a dashboard showing monthly revenue, active clients, and overdue invoices.',
    ctaLabel: 'Build my SaaS free',
    ctaHref: '/dashboard?new=app',
    faqs: [
      { q: 'Can I really build a full SaaS without coding?', a: 'Yes. WyberAi generates all the frontend code, connects to a real Supabase database (with auth and RLS), and deploys to a live URL. You describe it; we build it.' },
      { q: 'Can I add payments (Stripe)?', a: 'You can ask WyberAi to add a Stripe checkout flow in chat. It generates the frontend components. For backend webhook handling, you\'d need to add a few lines of server code or use Supabase Edge Functions.' },
      { q: 'Who owns the code?', a: 'You do. Export the full source code anytime. It\'s standard React + Vite — take it to any developer, any hosting provider, or your own GitHub repo.' },
      { q: 'How do I handle my own domain?', a: 'Connect a custom domain in Settings → Domains. Or use your free yourapp.wyberai.app subdomain while you\'re in development.' },
      { q: 'What does it cost to build a SaaS with WyberAi?', a: 'Plans start at $29/month (Starter: 150 credits/month). Web and mobile builds cost 10 credits; edits cost 3 credits. Done-for-you builds start at $199.' },
    ],
  },
  {
    slug: 'ai-workflow-automation',
    h1: 'AI Workflow Automation — Build Automations Without Code',
    metaTitle: 'AI Workflow Automation Builder No-Code | WyberAi',
    metaDesc: 'Build multi-step workflow automations that connect your apps, apply AI reasoning, and run automatically — without writing code. 250+ integrations.',
    pillar: 'workflows',
    pillarLabel: 'Workflows',
    pillarColor: '#f59e0b',
    tagline: 'Describe "when X happens, do Y." WyberAi builds the automation and runs it for you.',
    body: [
      'Workflow automation used to mean learning Zapier, Make, or n8n — platforms with steep learning curves and limited AI capabilities. WyberAi\'s workflow builder works differently: describe what you want in plain English and it generates the full automation.',
      'Every workflow is a visual canvas of trigger and action nodes. Add AI reasoning to classify, score, or summarize data mid-flow. Connect 250+ apps without managing API keys. Then activate and watch it run.',
    ],
    features: [
      { title: 'Plain-English workflow creation', desc: 'Describe your automation in a sentence: WyberAi generates the trigger, action nodes, and data mappings between them.' },
      { title: '250+ app connections', desc: 'Airtable, HubSpot, Gmail, Slack, Notion, GitHub, Stripe, Google Sheets, and hundreds more — connected in one click per app.' },
      { title: 'AI reasoning steps', desc: 'Drop a Claude node into your workflow to classify leads, score applications, summarize content, or route data based on AI decisions.' },
      { title: 'Conditional branching', desc: 'Add condition nodes that route data differently based on field values, API responses, or AI outputs.' },
      { title: 'Live run logs', desc: 'Every workflow execution shows a step-by-step log so you can see exactly what ran, what was returned, and where to improve.' },
      { title: 'Scheduled + manual triggers', desc: 'Activate workflows on demand or on a cron schedule. Set it once and the scheduler runs it automatically — credits are checked before every execution.' },
    ],
    promptExample: 'When a new row is added to my Airtable "Job Applications" base: score the applicant 1–10 for fit using AI, add them to HubSpot as a contact tagged with the score, and send a Slack message to #hiring with their name, role, and score.',
    ctaLabel: 'Build my workflow free',
    ctaHref: '/dashboard?new=workflow',
    faqs: [
      { q: 'How is WyberAi different from Zapier or Make?', a: 'Zapier and Make require you to build automations step by step using their interfaces. WyberAi lets you describe the workflow in plain English and generates the full automation. It also has native AI reasoning nodes — not just pass-through OpenAI calls.' },
      { q: 'What apps can workflows connect to?', a: 'WyberAi supports 250+ integrations including Gmail, Slack, HubSpot, Salesforce, Airtable, Notion, GitHub, Linear, Stripe, Google Calendar, and many more.' },
      { q: 'Can workflows use AI to make decisions?', a: 'Yes. You can add a Claude-powered AI node anywhere in the workflow to classify, score, summarize, or route data — then branch based on the AI\'s output.' },
      { q: 'How do I trigger a workflow automatically?', a: 'Select "On a schedule" in the trigger node, pick a preset (daily, hourly, weekly) or enter a custom cron expression, then save. The scheduler fires the workflow automatically and checks your credit balance before each run.' },
      { q: 'Do I need to manage API keys for each integration?', a: 'No. WyberAi uses Composio for integrations. You authenticate each app once in Settings → Integrations and all your workflows can use it.' },
    ],
  },
  {
    slug: 'no-code-web-app-builder',
    h1: 'No-Code Web App Builder — Ship a Full-Stack App Today',
    metaTitle: 'No-Code Web App Builder — AI-Powered | WyberAi',
    metaDesc: 'Build a complete web app — dashboard, auth, database, deploy — from plain English. The best no-code web app builder powered by AI.',
    pillar: 'web',
    pillarLabel: 'Web Apps',
    pillarColor: '#0EA5E9',
    tagline: 'The no-code web app builder that generates complete full-stack apps — not just UI components.',
    body: [
      'Most "no-code" tools build one part of an app. WyberAi builds the whole thing: UI, routing, state management, a connected database, authentication, and a deployment URL — all from a plain English description.',
      'Whether you\'re building an internal tool, a customer-facing dashboard, or a full SaaS product, WyberAi generates production-ready React code that you can use as-is or customize with a developer later.',
    ],
    features: [
      { title: 'Complete app — not components', desc: 'Other no-code tools generate UI snippets. WyberAi generates a complete, running application with every file wired together.' },
      { title: '500+ prebuilt app templates', desc: 'Start from a CRM, dashboard, invoice tracker, kanban board, or any of 500+ templates at zero credit cost.' },
      { title: 'Click-to-edit any element', desc: 'Click anything in the live preview and describe the change. No CSS selectors, no code.' },
      { title: 'Supabase database integration', desc: 'Connect Supabase and your app uses real Postgres with auth, RLS, and live data — wired automatically.' },
      { title: 'One-click Vercel deploy', desc: 'Publish to a live URL in minutes. Free wyberai.app subdomain or your own domain.' },
      { title: 'Export full source code', desc: 'Download the complete React + Vite project. You own it. Take it anywhere.' },
    ],
    promptExample: 'Build an internal operations dashboard for a logistics company with a shipments table (status, carrier, ETA, destination), KPI cards (on-time rate, avg delay, total shipments), and a "Mark as Delivered" button per row.',
    ctaLabel: 'Build my web app free',
    ctaHref: '/dashboard?new=app',
    faqs: [
      { q: 'What makes WyberAi different from Webflow or Bubble?', a: 'Webflow and Bubble have visual editors you build in manually. WyberAi generates the complete app from plain English in seconds. There\'s nothing to drag and drop — you describe it and it\'s built.' },
      { q: 'Is the output real code I can export?', a: 'Yes. WyberAi outputs clean React + Vite code. Export it anytime and take it to GitHub, a developer, or your own hosting.' },
      { q: 'Can it build apps with a real database?', a: 'Yes. Connect your Supabase project in Settings → Connectors and WyberAi rewrites the app to use real Postgres with auth and Row Level Security.' },
      { q: 'How many apps can I build on the free plan?', a: 'The free plan gives you 50 credits/month. Each generation costs 1 credit, so you can build and iterate 50 times per month for free.' },
      { q: 'Can I use WyberAi to build an app for a client?', a: 'Yes. Many Wyber users build apps for clients, then export the code and hand it over. You can also deploy directly to the client\'s Vercel account.' },
    ],
  },
  {
    slug: 'ai-app-builder',
    h1: 'AI App Builder — From Idea to Live App in Minutes',
    metaTitle: 'AI App Builder — Web, Mobile, Agents & Workflows | WyberAi',
    metaDesc: 'The AI app builder that builds web apps, mobile apps, AI agents, and workflow automations from plain English. No code. No waiting. Ship today.',
    pillar: 'web',
    pillarLabel: 'Web Apps',
    pillarColor: '#0EA5E9',
    tagline: 'The only platform that covers all six products: web apps, mobile apps, AI agents, workflows, AI employees, and a full GTM engine.',
    body: [
      'Every other AI app builder does one thing. WyberAi does six: it builds web apps, mobile apps, AI agents, workflow automations, deploys AI employees, and runs your go-to-market — all from the same workspace, all from plain English.',
      'There\'s no learning curve, no template assembly, and no "coming soon" features for what you actually need today. Describe what you want and it\'s built.',
    ],
    features: [
      { title: 'Web app builder', desc: 'Full-stack React apps with dashboard UI, data tables, charts, modals, and Supabase database — generated in A few minutes.' },
      { title: 'Mobile app builder', desc: 'React Native + Expo apps for iOS and Android. Preview on your phone instantly via QR code.' },
      { title: 'AI agent builder', desc: 'Autonomous agents connected to 250+ tools, run manually or on a schedule — with AI reasoning built in.' },
      { title: 'Workflow automation', desc: 'Multi-step automations that connect your apps, apply AI logic, and run without supervision.' },
      { title: '500+ prebuilt templates', desc: 'CRM, invoicing, HR, analytics, e-commerce, booking, and 500+ more — all at 0 credits.' },
      { title: 'One-click deploy', desc: 'Vercel deployment in A few minutes. Free subdomain or your own domain.' },
    ],
    promptExample: 'Build a SaaS platform for freelancers: a web dashboard for project and invoice management, a mobile app for on-the-go time tracking, an agent that emails clients when invoices are overdue, and a workflow that logs new clients to a Google Sheet.',
    ctaLabel: 'Start building free',
    ctaHref: '/dashboard',
    faqs: [
      { q: 'What can WyberAi build?', a: 'WyberAi builds web apps (React, full-stack), mobile apps (React Native + Expo), AI agents (autonomous, connected to 250+ tools), and workflow automations — all from plain English.' },
      { q: 'How is WyberAi different from other AI app builders?', a: 'Every other tool covers one category. Lovable, Bolt, and v0 build web apps only. WyberAi covers all six products — including AI Employees and a full GTM engine — from one workspace at one price.' },
      { q: 'Do I need technical knowledge?', a: 'No. WyberAi is designed for non-technical founders, operators, and makers. You describe what you want; we generate it.' },
      { q: 'How fast does it generate?', a: 'Most apps generate in minutes. You see the code streaming in real time so you\'re never waiting on a blank screen.' },
      { q: 'What does it cost?', a: 'Plans start at $29/month (Starter: 150 credits). Builder is $79/month (500 credits). Pro is $199/month (1,500 credits). Growth is $399/month (4,000 credits). Scale is $799/month (10,000 credits). Every plan unlocks all features — credits are the only currency.' },
    ],
  },
]
