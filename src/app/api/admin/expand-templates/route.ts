import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Categories and subcategories for massive template expansion
const WEB_CATEGORIES: Record<string, string[]> = {
  SaaS: [
    'Analytics dashboard','User management admin','API docs portal','Status page','Feature flag manager',
    'Email campaign manager','Subscription billing','Support ticket system','Webhook manager','Error tracking',
    'A/B testing dashboard','Onboarding flow builder','Changelog manager','Customer feedback portal','NPS survey tool',
    'Knowledge base','Team wiki','Audit log viewer','OAuth app manager','Multi-tenant admin',
    'Usage metering dashboard','Customer health score','Churn prediction dashboard','Revenue recognition','Pricing page builder',
    'Release notes generator','Incident management','On-call rotation scheduler','API rate limit monitor','Integration marketplace',
  ],
  CRM: [
    'Sales pipeline','Contact manager','Invoice generator','Client portal','Proposal builder',
    'Expense tracker','Lead scoring dashboard','Deal room','Meeting scheduler','Sales forecasting',
    'Commission tracker','Territory mapping','Account planning','Competitor battlecard','RFP response builder',
    'Customer timeline','Referral tracking','Partnership portal','Contract lifecycle manager','Quote configurator',
  ],
  Ecommerce: [
    'Online store','Order management','Inventory tracker','Product catalog','Coupon manager',
    'Shipping calculator','Returns portal','Vendor marketplace','Wholesale ordering','Subscription box manager',
    'Price comparison','Digital downloads store','Print-on-demand storefront','Gift card system','Loyalty points dashboard',
    'Dropshipping manager','Product reviews','Size guide builder','Abandoned cart recovery','Supplier management',
  ],
  Healthcare: [
    'Patient portal','Appointment booking','Hospital admin','Telemedicine platform','Fitness tracker',
    'Mental health journal','Medication tracker','Lab results viewer','Diet & nutrition planner','Physical therapy tracker',
    'Insurance claims dashboard','EMR lite','Vaccination tracker','Symptom checker','Blood pressure log',
    'Dental practice manager','Veterinary clinic dashboard','Pharmacy inventory','Home health aide tracker','Clinical trial dashboard',
  ],
  Education: [
    'Learning management system','Student dashboard','Quiz builder','Classroom manager','Report card generator',
    'Library catalog','Study planner','Flashcard app','Grade book','Assignment tracker',
    'Tutoring marketplace','Online exam proctoring','Certificate generator','School bus tracker','Parent-teacher portal',
    'Attendance tracker','Course marketplace','Scholarship finder','Campus event calendar','Alumni directory',
  ],
  Finance: [
    'Banking dashboard','Budget planner','Investment portfolio','Stock watchlist','Tax calculator',
    'Loan amortization','Crypto portfolio','Personal finance tracker','Profit & loss report','Balance sheet viewer',
    'Payroll manager','Accounts payable','Accounts receivable','Financial modeling','Cash flow forecaster',
    'Expense approval workflow','Vendor payment tracker','Treasury dashboard','Fundraising tracker','Grant management',
  ],
  Marketing: [
    'Social media scheduler','Content calendar','SEO audit tool','Keyword tracker','UTM builder',
    'Landing page builder','A/B test results','Influencer CRM','Brand asset manager','Press release manager',
    'Podcast manager','Newsletter dashboard','Affiliate dashboard','Event marketing planner','Webinar manager',
    'Competitive intelligence','Market research dashboard','Campaign ROI tracker','Content performance','Hashtag analytics',
  ],
  HRPeople: [
    'Employee directory','Leave management','Performance review','Recruiting pipeline','Onboarding checklist',
    'Org chart builder','Time tracking','Shift scheduler','Benefits enrollment','Training tracker',
    'Employee engagement survey','OKR tracker','360 feedback tool','Job board','Intern management',
    'Remote work dashboard','Company handbook','Exit interview form','Diversity dashboard','Workplace safety log',
  ],
  RealEstate: [
    'Property listings','Mortgage calculator','Tenant portal','Lease management','Property inspection',
    'Virtual tour scheduler','HOA management','Maintenance request tracker','Rent collection dashboard','Property comparison',
    'Real estate CRM','Agent commission tracker','Open house RSVP','Construction progress','Interior design mood board',
  ],
  Food: [
    'Restaurant POS','Menu builder','Table reservation','Kitchen display system','Food delivery tracker',
    'Recipe manager','Meal prep planner','Calorie counter','Grocery list','Wine cellar inventory',
    'Catering order manager','Food truck finder','Restaurant review aggregator','Farm-to-table marketplace','Bakery order system',
  ],
  Productivity: [
    'Kanban board','Sprint planner','Time tracker','Note taking app','Habit tracker',
    'Meeting notes','Daily standup log','Pomodoro timer','Goal tracker','Bookmarks manager',
    'Journaling app','Mind map builder','To-do list','Read later list','Personal CRM',
    'Weekly planner','Decision matrix','Checklist builder','Eisenhower matrix','Mood tracker',
  ],
  Legal: [
    'Case management','Contract review','Court calendar','Client intake form','Billing & timesheets',
    'Document management','Compliance tracker','Legal hold manager','Patent tracker','Trademark registry',
  ],
  Logistics: [
    'Fleet management','Route optimizer','Warehouse dashboard','Supply chain tracker','Shipping label generator',
    'Container tracking','Load planning','Last-mile delivery','Customs documentation','Freight calculator',
  ],
  Events: [
    'Event landing page','Ticket sales','Guest list manager','Conference schedule','Speaker management',
    'Venue booking','Photo gallery','Attendee networking','Feedback survey','Sponsorship management',
  ],
  Creative: [
    'Portfolio website','Design system viewer','Color palette generator','Typography showcase','Icon library browser',
    'Moodboard creator','Client brief form','Project gallery','Freelance rate calculator','Asset approval workflow',
  ],
}

const MOBILE_CATEGORIES: Record<string, string[]> = {
  Social: ['Chat app','Social feed','Stories viewer','Dating app','Community forum','Photo sharing','Video social','Group chat','Profile builder','Activity feed'],
  Productivity: ['Task manager','Note taking','Habit tracker','Expense logger','Calendar','Time tracker','Pomodoro','Journal','Bookmarks','Voice memo'],
  Health: ['Step counter','Meditation timer','Water intake','Sleep tracker','Workout log','Calorie counter','Pill reminder','Period tracker','Mental health check','Blood pressure log'],
  Shopping: ['Product browser','Shopping list','Barcode scanner','Wishlist','Deal finder','Price tracker','Order tracker','Coupon wallet','Size calculator','Store finder'],
  Travel: ['Trip planner','Flight tracker','Hotel booking','Packing list','Currency converter','City guide','Restaurant finder','Taxi booking','Travel journal','Language phrasebook'],
  Finance: ['Budget tracker','Expense splitter','Investment tracker','Bill reminder','Savings goals','Crypto tracker','Receipt scanner','Tax estimator','Net worth tracker','Subscription manager'],
  Education: ['Flashcards','Language learning','Math practice','Reading log','Study timer','Course viewer','Quiz app','Vocabulary builder','GPA calculator','Lecture notes'],
  Food: ['Recipe finder','Meal planner','Grocery list','Restaurant menu','Food diary','Cooking timer','Cocktail recipes','Diet tracker','Pantry inventory','Takeout ordering'],
  Utility: ['QR scanner','Unit converter','Password generator','File manager','Compass','Level tool','Color picker','WiFi analyzer','Battery monitor','Speed test'],
  Lifestyle: ['Wardrobe organizer','Home workout','Plant care','Pet tracker','Mood journal','Gratitude diary','Vision board','Weekly review','Morning routine','Event countdown'],
  Business: ['Timesheet','Invoice maker','Client list','Meeting notes','Business card scanner','Lead tracker','Proposal viewer','Project status','Team directory','Feedback collector'],
  Kids: ['Drawing pad','Math games','Story reader','Animal sounds','ABC learning','Puzzle games','Music maker','Color book','Shape sorter','Memory game'],
}

const WORKFLOW_CATEGORIES: Record<string, string[]> = {
  Sales: [
    'Lead qualification','Follow-up reminder','Deal stage updater','Win/loss analysis','Commission calculator',
    'Territory assignment','Quota tracker','Pipeline cleanup','Competitor alert','Customer expansion signal',
  ],
  Marketing: [
    'Social media auto-poster','Blog → newsletter','SEO rank tracker','UTM link builder','PR mention alert',
    'Webinar follow-up','Content repurposer','Hashtag monitor','Ad spend optimizer','Influencer outreach',
  ],
  Support: [
    'Ticket auto-tagger','SLA breach alert','CSAT survey sender','FAQ auto-responder','Escalation router',
    'Bug report → Jira','Onboarding email drip','Churn risk alert','Knowledge gap detector','Agent performance report',
  ],
  Engineering: [
    'PR review reminder','Deploy notification','Error spike alert','Dependency update check','Sprint velocity tracker',
    'Incident post-mortem','Code coverage report','API latency monitor','Database backup check','Security scan reporter',
  ],
  HR: [
    'New hire onboarding','Birthday reminder','Leave balance alert','Performance review scheduler','Exit interview sender',
    'Training completion tracker','Policy update notifier','Referral bonus tracker','Headcount report','Culture survey sender',
  ],
  Finance: [
    'Invoice follow-up','Expense approval','Budget vs actual alert','Revenue recognition','Vendor payment reminder',
    'Monthly close checklist','Cash flow alert','Subscription renewal','Tax deadline reminder','Payroll reconciliation',
  ],
  Operations: [
    'Inventory reorder alert','Shipping delay notifier','Vendor SLA monitor','Asset maintenance scheduler','Quality check workflow',
    'Compliance audit prep','Safety incident report','Meeting room booker','Visitor log','Office supply reorder',
  ],
  Product: [
    'Feature request aggregator','User feedback digest','Release notes generator','Beta tester recruiter','Roadmap update notifier',
    'Usage analytics reporter','NPS score tracker','A/B test result emailer','Competitor feature tracker','Customer interview scheduler',
  ],
  Recruitment: [
    'Resume screener','Interview scheduler','Offer letter sender','Reference check requester','Candidate pipeline cleaner',
    'Job posting syndicator','Sourcing outreach','Skills assessment sender','Panel feedback collector','Rejection email sender',
  ],
  Personal: [
    'Daily standup summary','Weekly goal review','Read-later digest','Habit streak tracker','Mood logger',
    'Journal prompt sender','Fitness goal checker','Savings milestone alert','News digest','Learning reminder',
  ],
}

export async function POST(req: NextRequest) {
  const authKey = req.headers.get('x-admin-key')
  if (authKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    type: 'web' | 'mobile' | 'workflow' | 'gtm'
    category?: string
    batch_size?: number
    dry_run?: boolean
  }

  const batchSize = Math.min(body.batch_size ?? 10, 25)
  const admin = getAdmin()

  if (body.type === 'web') {
    const categories = body.category ? { [body.category]: WEB_CATEGORIES[body.category] ?? [] } : WEB_CATEGORIES
    let total = 0
    const created: string[] = []

    for (const [cat, apps] of Object.entries(categories)) {
      for (const appName of apps.slice(0, batchSize)) {
        const { data: existing } = await admin.from('prebuilt_apps').select('id').eq('name', appName).limit(1)
        if (existing?.length) continue

        if (body.dry_run) { created.push(`[DRY] ${cat}: ${appName}`); total++; continue }

        const keywords = appName.toLowerCase().split(/[\s&/,]+/).filter(w => w.length > 2)
        keywords.push(cat.toLowerCase())

        const colors: Record<string, string> = {
          SaaS: '#0EA5E9', CRM: '#8b5cf6', Ecommerce: '#f97316', Healthcare: '#10b981',
          Education: '#8b5cf6', Finance: '#0EA5E9', Marketing: '#f59e0b', HRPeople: '#e879f9',
          RealEstate: '#f97316', Food: '#ef4444', Productivity: '#0EA5E9', Legal: '#52525b',
          Logistics: '#f59e0b', Events: '#a855f7', Creative: '#e879f9',
        }

        const { error: insertErr } = await admin.from('prebuilt_apps').insert({
          name: appName,
          category: cat,
          description: `${appName} — complete ready-to-use ${cat.toLowerCase()} application.`,
          keywords,
          preview_color: colors[cat] ?? '#0EA5E9',
          valid: true,
          files: {},
          use_count: 0,
        })
        if (insertErr) {
          created.push(`[ERROR] ${cat}: ${appName} — ${insertErr.message}`)
        } else {
          created.push(`${cat}: ${appName}`)
          total++
        }
      }
    }
    return NextResponse.json({ type: 'web', created: total, apps: created, total_possible: Object.values(WEB_CATEGORIES).flat().length })
  }

  if (body.type === 'mobile') {
    const categories = body.category ? { [body.category]: MOBILE_CATEGORIES[body.category] ?? [] } : MOBILE_CATEGORIES
    let total = 0
    const created: string[] = []

    for (const [cat, apps] of Object.entries(categories)) {
      for (const appName of apps.slice(0, batchSize)) {
        const { data: existing } = await admin.from('prebuilt_apps').select('id').ilike('name', `%${appName}%`).eq('category', `Mobile-${cat}`).limit(1)
        if (existing?.length) continue

        if (body.dry_run) { created.push(`[DRY] Mobile-${cat}: ${appName}`); total++; continue }

        const keywords = appName.toLowerCase().split(/[\s&/,]+/).filter(w => w.length > 2)
        keywords.push('mobile', 'react-native', cat.toLowerCase())

        const { error: insertErr } = await admin.from('prebuilt_apps').insert({
          name: `${appName} (Mobile)`,
          category: `Mobile-${cat}`,
          description: `${appName} — React Native + Expo mobile app for ${cat.toLowerCase()}.`,
          keywords,
          preview_color: '#10b981',
          valid: true,
          files: {},
          use_count: 0,
        })
        if (insertErr) {
          created.push(`[ERROR] Mobile-${cat}: ${appName} — ${insertErr.message}`)
        } else {
          created.push(`Mobile-${cat}: ${appName}`)
          total++
        }
      }
    }
    return NextResponse.json({ type: 'mobile', created: total, apps: created, total_possible: Object.values(MOBILE_CATEGORIES).flat().length })
  }

  if (body.type === 'workflow') {
    const categories = body.category ? { [body.category]: WORKFLOW_CATEGORIES[body.category] ?? [] } : WORKFLOW_CATEGORIES
    let total = 0
    const created: string[] = []

    for (const [cat, flows] of Object.entries(categories)) {
      for (const flowName of flows.slice(0, batchSize)) {
        if (body.dry_run) { created.push(`[DRY] ${cat}: ${flowName}`); total++; continue }

        const prompt = `Generate a workflow template for: "${flowName}" in the ${cat} category.
Return JSON with: { "name": "${flowName}", "category": "${cat}", "description": "one sentence", "nodes": [...], "edges": [...] }
Nodes array should have 4-6 nodes, each: { "id": "node-1", "type": "trigger|aiagent|tool|condition|output|transform|delay", "position": {"x": N, "y": N}, "data": {"label": "Step name", "subtitle": "what it does", "config": {}} }
Edges connect them: { "id": "e1", "source": "node-1", "target": "node-2" }
Start with a trigger node. Return only valid JSON.`

        try {
          const res = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          })
          const text = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
          const match = text.match(/\{[\s\S]*\}/)
          if (match) {
            const template = JSON.parse(match[0])
            await admin.from('workflow_templates').insert({
              name: template.name || flowName,
              category: cat,
              description: template.description || `${flowName} workflow template`,
              nodes: template.nodes || [],
              edges: template.edges || [],
            })
            created.push(`${cat}: ${flowName}`)
            total++
          }
        } catch { /* skip failed generation */ }
      }
    }
    return NextResponse.json({ type: 'workflow', created: total, templates: created, total_possible: Object.values(WORKFLOW_CATEGORIES).flat().length })
  }

  return NextResponse.json({ error: 'type must be web, mobile, workflow, or gtm' }, { status: 400 })
}
