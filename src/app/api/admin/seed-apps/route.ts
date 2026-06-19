import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const APPS = [
  { name: 'SaaS Analytics Dashboard', category: 'SaaS', description: 'Track MRR, churn, active users and key SaaS metrics in a clean dashboard with charts and KPI cards.', keywords: ['analytics','dashboard','saas','metrics','kpi','charts'], preview_color: '#0EA5E9' },
  { name: 'User Management Admin', category: 'SaaS', description: 'Manage users, roles, and permissions with a full admin panel including search, filters, and bulk actions.', keywords: ['user','admin','management','roles','permissions','team'], preview_color: '#0EA5E9' },
  { name: 'API Documentation Portal', category: 'SaaS', description: 'Beautiful API docs portal with endpoint listings, request/response examples, and authentication guides.', keywords: ['api','documentation','docs','developer','endpoint'], preview_color: '#8b5cf6' },
  { name: 'Status Page Monitor', category: 'SaaS', description: 'Public status page showing uptime, incidents, and service health for your product.', keywords: ['status','monitor','uptime','incident','service','health'], preview_color: '#10b981' },
  { name: 'Feature Flag Manager', category: 'SaaS', description: 'Toggle features on/off per user segment with rollout percentages and environment controls.', keywords: ['feature','flag','toggle','release','rollout','experiment'], preview_color: '#0EA5E9' },
  { name: 'Email Campaign Manager', category: 'SaaS', description: 'Create, schedule and track email campaigns with subscriber lists and open rate analytics.', keywords: ['email','campaign','newsletter','marketing','subscriber'], preview_color: '#f59e0b' },
  { name: 'Subscription Billing Dashboard', category: 'SaaS', description: 'Monitor subscriptions, MRR, churn rate and billing events with revenue analytics.', keywords: ['subscription','billing','payment','mrr','churn','revenue'], preview_color: '#0EA5E9' },
  { name: 'Customer Support Ticket System', category: 'SaaS', description: 'Help desk with ticket queue, priority levels, agent assignment, and status tracking.', keywords: ['support','ticket','helpdesk','customer service','issue'], preview_color: '#f59e0b' },
  { name: 'Webhook Manager', category: 'SaaS', description: 'Configure, test, and monitor webhook endpoints with delivery logs and retry controls.', keywords: ['webhook','integration','event','trigger','endpoint'], preview_color: '#0EA5E9' },
  { name: 'Error Tracking Dashboard', category: 'SaaS', description: 'Monitor exceptions, errors and stack traces across your services with alerting.', keywords: ['error','tracking','bug','exception','log','debug'], preview_color: '#ef4444' },
  { name: 'Sales CRM Dashboard', category: 'CRM', description: 'Pipeline view with deals, contacts, activities, and revenue forecasting for sales teams.', keywords: ['crm','sales','pipeline','leads','deals','contacts'], preview_color: '#8b5cf6' },
  { name: 'Invoice Generator', category: 'CRM', description: 'Create professional invoices with line items, taxes, and PDF export for freelancers.', keywords: ['invoice','billing','payment','client','freelance','quote'], preview_color: '#10b981' },
  { name: 'Client Portal', category: 'CRM', description: 'Branded client-facing portal to share deliverables, updates, and project status.', keywords: ['client','portal','agency','project','deliverable'], preview_color: '#8b5cf6' },
  { name: 'Proposal Builder', category: 'CRM', description: 'Create and send business proposals with scope, pricing, and e-signature.', keywords: ['proposal','quote','estimate','contract','scope'], preview_color: '#f59e0b' },
  { name: 'Expense Tracker', category: 'CRM', description: 'Log business expenses with categories, receipts, and monthly spending reports.', keywords: ['expense','receipt','reimbursement','spending','cost'], preview_color: '#ef4444' },
  { name: 'E-commerce Store', category: 'Ecommerce', description: 'Full online store with product listings, shopping cart, checkout, and order history.', keywords: ['shop','store','ecommerce','product','cart','checkout'], preview_color: '#f97316' },
  { name: 'Order Management Dashboard', category: 'Ecommerce', description: 'Manage orders, fulfillment, shipping status and customer notifications.', keywords: ['order','fulfillment','shipping','tracking','delivery'], preview_color: '#f97316' },
  { name: 'Inventory Manager', category: 'Ecommerce', description: 'Track stock levels, SKUs, low-stock alerts and purchase orders.', keywords: ['inventory','stock','warehouse','sku','product','supply'], preview_color: '#f59e0b' },
  { name: 'Product Catalog', category: 'Ecommerce', description: 'Searchable product catalog with categories, filters, and variant management.', keywords: ['catalog','product','listing','category','search'], preview_color: '#f97316' },
  { name: 'Discount & Coupon Manager', category: 'Ecommerce', description: 'Create and manage promo codes, discounts, and flash sales with usage analytics.', keywords: ['discount','coupon','promo','promotion','voucher'], preview_color: '#10b981' },
  { name: 'Patient Portal', category: 'Healthcare', description: 'Patient-facing portal for viewing records, test results, prescriptions and appointments.', keywords: ['patient','portal','medical','health','records','doctor'], preview_color: '#10b981' },
  { name: 'Appointment Booking System', category: 'Healthcare', description: 'Online booking system for clinics with calendar, reminders, and patient management.', keywords: ['appointment','booking','doctor','clinic','schedule','healthcare'], preview_color: '#10b981' },
  { name: 'Hospital Admin Dashboard', category: 'Healthcare', description: 'Admin panel for managing wards, beds, staff shifts, and patient flow.', keywords: ['hospital','admin','ward','bed','nurse','staff'], preview_color: '#0EA5E9' },
  { name: 'Telemedicine Platform', category: 'Healthcare', description: 'Video consultation platform for doctors and patients with appointment scheduling.', keywords: ['telemedicine','telehealth','video','consultation','remote'], preview_color: '#10b981' },
  { name: 'Fitness & Health Tracker', category: 'Healthcare', description: 'Track workouts, calories, sleep, and health goals with progress charts.', keywords: ['fitness','health','workout','exercise','calories','wellness'], preview_color: '#10b981' },
  { name: 'Learning Management System', category: 'Education', description: 'Complete LMS with courses, lessons, progress tracking and student management.', keywords: ['lms','learning','course','lesson','student','education'], preview_color: '#8b5cf6' },
  { name: 'Student Dashboard', category: 'Education', description: 'Student portal showing grades, assignments, upcoming deadlines and course progress.', keywords: ['student','grade','assignment','course','progress','school'], preview_color: '#8b5cf6' },
  { name: 'Quiz & Assessment Builder', category: 'Education', description: 'Build quizzes with multiple choice, true/false, and short answer questions.', keywords: ['quiz','test','assessment','exam','question','answer'], preview_color: '#f59e0b' },
  { name: 'Online Course Builder', category: 'Education', description: 'Build and sell online courses with video lessons, quizzes, and certificates.', keywords: ['course','builder','curriculum','module','video'], preview_color: '#f97316' },
  { name: 'School Admin Portal', category: 'Education', description: 'School management system with enrollment, timetables, fees, and parent communication.', keywords: ['school','admin','enrollment','timetable','parent','fee'], preview_color: '#0EA5E9' },
  { name: 'Personal Finance Dashboard', category: 'Finance', description: 'Track income, expenses, savings goals, and net worth with budget alerts.', keywords: ['finance','budget','spending','savings','income','money'], preview_color: '#10b981' },
  { name: 'Investment Portfolio Tracker', category: 'Finance', description: 'Monitor stocks, ETFs, and investments with performance charts and allocation view.', keywords: ['investment','portfolio','stock','trading','returns','market'], preview_color: '#10b981' },
  { name: 'Crypto Dashboard', category: 'Finance', description: 'Track crypto portfolio, prices, and DeFi positions with P&L calculations.', keywords: ['crypto','bitcoin','ethereum','defi','wallet','token'], preview_color: '#f59e0b' },
  { name: 'Banking Dashboard', category: 'Finance', description: 'Fintech-style banking UI with accounts, transactions, transfers and spending insights.', keywords: ['bank','banking','account','transaction','transfer','fintech'], preview_color: '#10b981' },
  { name: 'Payroll Management', category: 'Finance', description: 'Process payroll, generate payslips, and manage deductions and tax calculations.', keywords: ['payroll','salary','employee','tax','deduction','pay slip'], preview_color: '#0EA5E9' },
  { name: 'HR Dashboard', category: 'HR', description: 'People operations hub with headcount, org chart, leave tracking and performance.', keywords: ['hr','human resources','employee','staff','people','workforce'], preview_color: '#8b5cf6' },
  { name: 'Employee Onboarding', category: 'HR', description: 'Structured onboarding flow for new hires with tasks, documents, and check-ins.', keywords: ['onboarding','new hire','employee','checklist','training'], preview_color: '#0EA5E9' },
  { name: 'Leave Management System', category: 'HR', description: 'Request and approve leaves with balance tracking and team calendar view.', keywords: ['leave','vacation','pto','holiday','absence','time off'], preview_color: '#f59e0b' },
  { name: 'Performance Review Tool', category: 'HR', description: 'Run quarterly performance reviews with goals, self-assessment, and manager feedback.', keywords: ['performance','review','goals','okr','feedback','appraisal'], preview_color: '#8b5cf6' },
  { name: 'Job Board & ATS', category: 'HR', description: 'Applicant tracking system with job postings, applications pipeline, and interview scheduling.', keywords: ['ats','recruiting','hiring','job board','applicant','interview'], preview_color: '#0EA5E9' },
  { name: 'Real Estate Listing Platform', category: 'RealEstate', description: 'Property listings with search filters, map view, photo galleries, and inquiry forms.', keywords: ['real estate','property','listing','rent','buy','house'], preview_color: '#f97316' },
  { name: 'Property Management Dashboard', category: 'RealEstate', description: 'Manage rental properties, tenants, maintenance requests, and rent collection.', keywords: ['property management','tenant','landlord','rent','maintenance'], preview_color: '#f97316' },
  { name: 'Mortgage Calculator App', category: 'RealEstate', description: 'Calculate monthly payments, amortization schedule, and compare loan options.', keywords: ['mortgage','calculator','loan','payment','interest','home'], preview_color: '#10b981' },
  { name: 'Agent CRM', category: 'RealEstate', description: 'Real estate agent CRM with lead tracking, property matching, and client pipeline.', keywords: ['agent','realtor','crm','lead','client','commission'], preview_color: '#8b5cf6' },
  { name: 'Property Inspection App', category: 'RealEstate', description: 'Digital property inspection reports with photos, defects, and condition ratings.', keywords: ['inspection','property','report','condition','defect','checklist'], preview_color: '#f59e0b' },
  { name: 'Restaurant POS System', category: 'Restaurant', description: 'Point-of-sale for restaurants with table management, orders, and kitchen display.', keywords: ['restaurant','pos','table','order','kitchen','food'], preview_color: '#ef4444' },
  { name: 'Food Delivery Dashboard', category: 'Restaurant', description: 'Manage delivery orders, drivers, and real-time tracking for food delivery.', keywords: ['delivery','food','driver','order','tracking','restaurant'], preview_color: '#ef4444' },
  { name: 'Menu Builder', category: 'Restaurant', description: 'Create and manage digital menus with categories, photos, prices, and allergen info.', keywords: ['menu','food','restaurant','category','price','digital menu'], preview_color: '#f97316' },
  { name: 'Reservation System', category: 'Restaurant', description: 'Online table booking with capacity management, reminders, and waitlist.', keywords: ['reservation','booking','table','restaurant','waitlist','seating'], preview_color: '#ef4444' },
  { name: 'Kitchen Display System', category: 'Restaurant', description: 'Digital kitchen orders board replacing paper tickets with real-time updates.', keywords: ['kitchen','kds','order','cooking','restaurant','display'], preview_color: '#f59e0b' },
  { name: 'Project Management Board', category: 'ProjectManagement', description: 'Kanban-style project board with tasks, assignees, deadlines, and sprints.', keywords: ['project','kanban','task','sprint','agile','board'], preview_color: '#6366f1' },
  { name: 'Team Task Manager', category: 'ProjectManagement', description: 'Assign and track team tasks with priorities, due dates, and progress indicators.', keywords: ['task','team','assign','deadline','priority','to-do'], preview_color: '#6366f1' },
  { name: 'Client Project Tracker', category: 'ProjectManagement', description: 'Track client projects with timelines, milestones, budgets, and deliverables.', keywords: ['project','client','timeline','milestone','budget','agency'], preview_color: '#8b5cf6' },
  { name: 'Time Tracking App', category: 'ProjectManagement', description: 'Log hours by project and task with timers, reports, and billable hour tracking.', keywords: ['time tracking','timesheet','hours','billable','project','log'], preview_color: '#0EA5E9' },
  { name: 'Meeting Notes App', category: 'ProjectManagement', description: 'Take structured meeting notes with action items, owners, and follow-up tracking.', keywords: ['meeting','notes','action items','minutes','follow-up','agenda'], preview_color: '#6366f1' },
  { name: 'SaaS Landing Page', category: 'Landing', description: 'High-converting SaaS landing page with hero, features, pricing, and CTA sections.', keywords: ['landing page','saas','marketing','hero','conversion','startup'], preview_color: '#0EA5E9' },
  { name: 'Product Launch Page', category: 'Landing', description: 'Product launch landing page with countdown, early access signup, and social proof.', keywords: ['launch','product','countdown','waitlist','early access','signup'], preview_color: '#8b5cf6' },
  { name: 'Agency Portfolio', category: 'Landing', description: 'Creative agency portfolio with case studies, services, team, and contact form.', keywords: ['portfolio','agency','case study','services','design','creative'], preview_color: '#f97316' },
  { name: 'Event Landing Page', category: 'Landing', description: 'Event registration page with schedule, speakers, tickets, and countdown timer.', keywords: ['event','conference','registration','speaker','ticket','schedule'], preview_color: '#10b981' },
  { name: 'Coming Soon Page', category: 'Landing', description: 'Pre-launch page with email capture, countdown timer, and social links.', keywords: ['coming soon','waitlist','launch','countdown','pre-launch','email'], preview_color: '#0EA5E9' },
]

export async function POST(req: NextRequest) {
  try {
    const authKey = req.headers.get('x-admin-key')
    const adminSecret = process.env.ADMIN_SECRET_KEY
    if (!adminSecret || authKey !== adminSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()

    // Check if SUPABASE_SERVICE_ROLE_KEY is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 503 })
    }

    // Insert all apps in batches of 10
    const { batch } = await req.json().catch(() => ({ batch: 0 }))
    const batchSize = 10
    const start = batch * batchSize
    const apps = APPS.slice(start, start + batchSize)

    if (apps.length === 0) {
      return NextResponse.json({ processed: 0, remaining: 0, message: 'All done' })
    }

    const { data, error } = await admin.from('prebuilt_apps').upsert(
      apps.map(a => ({ ...a, files: { prompt: `Build a ${a.name}: ${a.description}` } })),
      { onConflict: 'name' }
    ).select('id')

    if (error) {
      console.error('Seed error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const remaining = Math.max(0, APPS.length - start - batchSize)
    console.log(`Seeded batch ${batch}: ${data?.length} apps, ${remaining} remaining`)

    return NextResponse.json({ processed: data?.length || 0, remaining, total: APPS.length })
  } catch (err) {
    console.error('Seed error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
