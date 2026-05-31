import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const APP_DEFINITIONS = [
  // SaaS
  { name: 'SaaS Analytics Dashboard', category: 'SaaS', keywords: ['analytics','dashboard','saas','metrics','kpi','charts'], color: '#0EA5E9' },
  { name: 'User Management Admin', category: 'SaaS', keywords: ['user','admin','management','roles','permissions','team'], color: '#0EA5E9' },
  { name: 'API Documentation Portal', category: 'SaaS', keywords: ['api','documentation','docs','developer','endpoint'], color: '#8b5cf6' },
  { name: 'Status Page Monitor', category: 'SaaS', keywords: ['status','monitor','uptime','incident','service','health'], color: '#10b981' },
  { name: 'Feature Flag Manager', category: 'SaaS', keywords: ['feature','flag','toggle','release','rollout','experiment'], color: '#0EA5E9' },
  { name: 'Error Tracking Dashboard', category: 'SaaS', keywords: ['error','tracking','bug','exception','log','debug'], color: '#ef4444' },
  { name: 'Email Campaign Manager', category: 'SaaS', keywords: ['email','campaign','newsletter','marketing','subscriber'], color: '#f59e0b' },
  { name: 'Subscription Billing Dashboard', category: 'SaaS', keywords: ['subscription','billing','payment','mrr','churn','revenue'], color: '#0EA5E9' },
  { name: 'Customer Support Ticket System', category: 'SaaS', keywords: ['support','ticket','helpdesk','customer service','issue'], color: '#f59e0b' },
  { name: 'Webhook Manager', category: 'SaaS', keywords: ['webhook','integration','event','trigger','endpoint'], color: '#0EA5E9' },
  // CRM
  { name: 'Sales CRM Dashboard', category: 'CRM', keywords: ['crm','sales','pipeline','leads','deals','contacts'], color: '#0EA5E9' },
  { name: 'Invoice Generator', category: 'CRM', keywords: ['invoice','billing','payment','client','freelance','quote'], color: '#10b981' },
  { name: 'Client Portal', category: 'CRM', keywords: ['client','portal','agency','project','deliverable'], color: '#8b5cf6' },
  { name: 'Proposal Builder', category: 'CRM', keywords: ['proposal','quote','estimate','contract','scope'], color: '#f59e0b' },
  { name: 'Expense Tracker', category: 'CRM', keywords: ['expense','receipt','reimbursement','spending','cost'], color: '#ef4444' },
  // Ecommerce
  { name: 'E-commerce Store', category: 'Ecommerce', keywords: ['shop','store','ecommerce','product','cart','checkout'], color: '#f97316' },
  { name: 'Order Management Dashboard', category: 'Ecommerce', keywords: ['order','fulfillment','shipping','tracking','delivery'], color: '#f97316' },
  { name: 'Inventory Manager', category: 'Ecommerce', keywords: ['inventory','stock','warehouse','sku','product','supply'], color: '#f59e0b' },
  { name: 'Product Catalog', category: 'Ecommerce', keywords: ['catalog','product','listing','category','search'], color: '#f97316' },
  { name: 'Discount & Coupon Manager', category: 'Ecommerce', keywords: ['discount','coupon','promo','promotion','voucher'], color: '#10b981' },
  // Healthcare
  { name: 'Patient Portal', category: 'Healthcare', keywords: ['patient','portal','medical','health','records','doctor'], color: '#10b981' },
  { name: 'Appointment Booking System', category: 'Healthcare', keywords: ['appointment','booking','doctor','clinic','schedule','healthcare'], color: '#10b981' },
  { name: 'Hospital Admin Dashboard', category: 'Healthcare', keywords: ['hospital','admin','ward','bed','nurse','staff'], color: '#0EA5E9' },
  { name: 'Telemedicine Platform', category: 'Healthcare', keywords: ['telemedicine','telehealth','video','consultation','remote'], color: '#10b981' },
  { name: 'Fitness & Health Tracker', category: 'Healthcare', keywords: ['fitness','health','workout','exercise','calories','wellness'], color: '#10b981' },
  // Education
  { name: 'Learning Management System', category: 'Education', keywords: ['lms','learning','course','lesson','student','education'], color: '#8b5cf6' },
  { name: 'Student Dashboard', category: 'Education', keywords: ['student','grade','assignment','course','progress','school'], color: '#8b5cf6' },
  { name: 'Quiz & Assessment Builder', category: 'Education', keywords: ['quiz','test','assessment','exam','question','answer'], color: '#f59e0b' },
  { name: 'Online Course Builder', category: 'Education', keywords: ['course','builder','curriculum','module','video','udemy'], color: '#f97316' },
  { name: 'School Admin Portal', category: 'Education', keywords: ['school','admin','enrollment','timetable','parent','fee'], color: '#0EA5E9' },
  // Finance
  { name: 'Personal Finance Dashboard', category: 'Finance', keywords: ['finance','budget','spending','savings','income','money'], color: '#10b981' },
  { name: 'Investment Portfolio Tracker', category: 'Finance', keywords: ['investment','portfolio','stock','trading','returns','market'], color: '#10b981' },
  { name: 'Crypto Dashboard', category: 'Finance', keywords: ['crypto','bitcoin','ethereum','defi','wallet','token'], color: '#f59e0b' },
  { name: 'Banking Dashboard', category: 'Finance', keywords: ['bank','banking','account','transaction','transfer','fintech'], color: '#10b981' },
  { name: 'Payroll Management', category: 'Finance', keywords: ['payroll','salary','employee','tax','deduction','pay slip'], color: '#0EA5E9' },
  // HR
  { name: 'HR Dashboard', category: 'HR', keywords: ['hr','human resources','employee','staff','people','workforce'], color: '#8b5cf6' },
  { name: 'Job Board', category: 'HR', keywords: ['job','career','hiring','recruitment','application','resume'], color: '#0EA5E9' },
  { name: 'Leave Management System', category: 'HR', keywords: ['leave','vacation','time off','attendance','absence','pto'], color: '#f59e0b' },
  { name: 'Performance Review System', category: 'HR', keywords: ['performance','review','appraisal','okr','goal','feedback'], color: '#8b5cf6' },
  { name: 'Remote Team Dashboard', category: 'HR', keywords: ['remote','distributed','team','timezone','async'], color: '#8b5cf6' },
  // Real Estate
  { name: 'Property Listings Platform', category: 'RealEstate', keywords: ['real estate','property','listing','home','apartment','rent'], color: '#f59e0b' },
  { name: 'Rental Management', category: 'RealEstate', keywords: ['rental','landlord','tenant','lease','maintenance'], color: '#f97316' },
  { name: 'Real Estate Agent CRM', category: 'RealEstate', keywords: ['real estate','agent','broker','commission'], color: '#f59e0b' },
  { name: 'Airbnb Short Term Rental', category: 'RealEstate', keywords: ['airbnb','short term','vacation rental','host','guest'], color: '#ef4444' },
  { name: 'Construction Project Tracker', category: 'RealEstate', keywords: ['construction','contractor','site','milestone','building'], color: '#f97316' },
  // Restaurant
  { name: 'Restaurant Management System', category: 'Restaurant', keywords: ['restaurant','food','menu','order','table','kitchen'], color: '#f97316' },
  { name: 'Food Delivery Dashboard', category: 'Restaurant', keywords: ['food delivery','delivery','rider','order tracking'], color: '#ef4444' },
  { name: 'Restaurant Reservation System', category: 'Restaurant', keywords: ['reservation','table booking','restaurant','dining'], color: '#f97316' },
  { name: 'Cafe POS System', category: 'Restaurant', keywords: ['cafe','coffee','pos','barista','order','payment'], color: '#f97316' },
  { name: 'Customer Loyalty Program', category: 'Restaurant', keywords: ['loyalty','rewards','points','customer','retention'], color: '#f59e0b' },
  // Project Management
  { name: 'Kanban Board', category: 'ProjectManagement', keywords: ['kanban','board','task','sprint','todo','backlog','agile'], color: '#0EA5E9' },
  { name: 'Time Tracker', category: 'ProjectManagement', keywords: ['time tracker','timesheet','hours','billable','log'], color: '#0EA5E9' },
  { name: 'Bug Tracker', category: 'ProjectManagement', keywords: ['bug','issue','tracker','jira','defect','fix'], color: '#ef4444' },
  { name: 'Product Roadmap', category: 'ProjectManagement', keywords: ['roadmap','product','feature','quarter','plan'], color: '#8b5cf6' },
  { name: 'OKR Tracker', category: 'ProjectManagement', keywords: ['okr','objective','key result','goal','quarterly'], color: '#0EA5E9' },
  // Landing
  { name: 'SaaS Landing Page', category: 'Landing', keywords: ['landing page','saas','startup','hero','pricing','cta'], color: '#0EA5E9' },
  { name: 'Coming Soon Page', category: 'Landing', keywords: ['coming soon','waitlist','launch soon','countdown','notify'], color: '#0EA5E9' },
  { name: 'Agency Landing Page', category: 'Landing', keywords: ['agency','design agency','services','portfolio'], color: '#8b5cf6' },
  { name: 'Personal Portfolio', category: 'Landing', keywords: ['portfolio','personal','developer','designer','resume'], color: '#8b5cf6' },
  { name: 'Pricing Page', category: 'Landing', keywords: ['pricing','plan','tier','free','pro','enterprise','compare'], color: '#10b981' },
]

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-admin-key')
  if (auth !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const batch = body.batch ?? 0
  const BATCH_SIZE = 5
  const apps = APP_DEFINITIONS.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE)

  if (apps.length === 0) {
    return NextResponse.json({ done: true, total: APP_DEFINITIONS.length })
  }

  const admin = await createAdminClient()
  const results = []

  for (const app of apps) {
    try {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: `You are a React app generator. Build complete production-quality React apps.
Output ONLY <file path="...">complete content</file> blocks. Nothing else.
Rules: src/index.css (dark theme, Space Grotesk font), src/App.tsx as entry, max 4 files, relative imports, realistic data.`,
        messages: [{ role: 'user', content: `Build: ${app.name}. Category: ${app.category}. Production-ready, beautiful, dark themed, realistic data.` }]
      })

      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      const fileMap: Record<string, string> = {}
      const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g
      let match
      while ((match = regex.exec(text)) !== null) {
        fileMap[match[1]] = match[2].trim()
      }

      if (Object.keys(fileMap).length >= 2) {
        const { data } = await admin.from('prebuilt_apps').insert({
          name: app.name, category: app.category,
          keywords: app.keywords, files: fileMap,
          preview_color: app.color,
        }).select('id').single()
        results.push({ name: app.name, id: data?.id, files: Object.keys(fileMap).length, status: 'ok' })
      } else {
        results.push({ name: app.name, status: 'no files' })
      }
    } catch (err) {
      results.push({ name: app.name, error: String(err), status: 'error' })
    }
  }

  return NextResponse.json({ batch, processed: apps.length, results, nextBatch: batch + 1, remaining: Math.max(0, APP_DEFINITIONS.length - (batch + 1) * BATCH_SIZE), total: APP_DEFINITIONS.length })
}
