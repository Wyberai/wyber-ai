import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: existing } = await sb.from('prebuilt_apps').select('name, category').limit(600)
const existingNames = new Set(existing.map(e => e.name))

const NEW_WEB = {
  SaaS: ['Help Desk Portal', 'API Gateway Dashboard', 'User Permissions Manager', 'Feature Request Board', 'Usage Analytics Dashboard', 'Billing Invoice Portal', 'Deployment Pipeline', 'Server Monitoring App', 'Log Explorer App', 'Config Manager App', 'Webhook Debugger', 'Rate Limiter Dashboard'],
  Ecommerce: ['Product Reviews Manager', 'Flash Sale Dashboard', 'Affiliate Dashboard', 'Cart Abandonment Tracker', 'Product Recommendation Engine', 'Dropshipping Manager', 'Digital Storefront Builder', 'SKU Inventory Planner', 'Customer Refund Portal', 'Marketplace Seller Hub'],
  CRM: ['Email Outreach Tracker', 'Customer Health Score', 'Referral Program Manager', 'Win Loss Analysis App', 'Revenue Attribution Dashboard', 'Sales Coaching App', 'Deal Velocity Tracker', 'Customer 360 View', 'Renewal Manager App', 'Partner Portal App'],
  Finance: ['Payroll Calculator App', 'Accounts Receivable Dashboard', 'Financial Modeling Tool', 'Audit Trail Viewer', 'Compliance Report Builder', 'Vendor Payment Tracker', 'Treasury Dashboard', 'Revenue Forecasting App', 'Billing Dispute Manager', 'Financial KPI Dashboard'],
  Healthcare: ['Clinical Trial Tracker', 'Drug Interaction Checker', 'Insurance Claims Dashboard', 'Nurse Scheduling App', 'Lab Equipment Tracker', 'Health Compliance Auditor', 'Referral Management App', 'Telehealth Queue Manager'],
  Education: ['Student Enrollment System', 'Attendance Tracker App', 'Parent Communication Portal', 'School Fee Manager', 'Academic Calendar Builder', 'Student Performance Analytics', 'Exam Scheduling App', 'Scholarship Manager'],
  RealEstate: ['Open House Scheduler', 'Rental Application Tracker', 'Property Tax Calculator', 'Real Estate CRM Dashboard', 'Construction Progress Tracker'],
  Legal: ['Document Automation App', 'E-Discovery Dashboard', 'Conflict Check Tool', 'Matter Management App', 'Regulatory Filing Tracker'],
  Marketing: ['Brand Guidelines App', 'Campaign ROI Calculator', 'Competitive Analysis Dashboard', 'Marketing Mix Modeler', 'Event Marketing Planner', 'Webinar Management App'],
  Productivity: ['Meeting Agenda Builder', 'Decision Log App', 'Weekly Planner App', 'Focus Mode Dashboard', 'OKR Tracker App', 'Retrospective Board'],
  Logistics: ['Delivery Route Planner', 'Customs Documentation App', 'Freight Cost Calculator', 'Cold Chain Monitor', 'Last Mile Tracker'],
  HRPeople: ['360 Feedback App', 'Culture Survey Dashboard', 'Compensation Benchmarker', 'Skills Matrix App', 'PTO Calendar App'],
  Food: ['Kitchen Inventory Manager', 'Food Safety Checklist', 'Catering Order Manager', 'Menu Pricing Calculator'],
  Creative: ['Storyboard Creator', 'Brand Kit Manager', 'Mood Board Builder', 'Asset Library App', 'Design Critique Tool', 'Font Pairing App'],
  ProjectManagement: ['Resource Allocation App', 'Risk Register App', 'Change Request Tracker', 'Milestone Timeline App'],
  Events: ['Sponsor Management App', 'Badge Printing App', 'Venue Comparison App', 'Event Budget Tracker', 'Attendee Check-in App'],
  Media: ['Editorial Calendar App', 'Podcast Analytics Dashboard', 'Social Media Scheduler', 'Content Approval Workflow'],
  Travel: ['Travel Expense Report', 'Group Trip Planner', 'Hotel Comparison App', 'Visa Requirements Checker'],
  NonProfit: ['Grant Application Tracker', 'Volunteer Scheduler', 'Donor CRM Dashboard', 'Program Impact Report'],
  Social: ['Community Moderation Dashboard', 'User Engagement Analytics'],
}

const webInserts = []
for (const [cat, apps] of Object.entries(NEW_WEB)) {
  for (const name of apps) {
    if (existingNames.has(name)) continue
    webInserts.push({
      name, category: cat,
      description: `A professional ${name.toLowerCase()} for businesses`,
      app_id: `WYBER-APP-${name.replace(/\s+/g, '-').toUpperCase().slice(0, 20)}-${Date.now().toString(36).slice(-4)}`,
      valid: true, files: {},
    })
  }
}

console.log(`Inserting ${webInserts.length} new web templates...`)
for (let i = 0; i < webInserts.length; i += 50) {
  const { error } = await sb.from('prebuilt_apps').insert(webInserts.slice(i, i + 50))
  if (error) console.error('Web batch error:', error.message)
  else console.log(`  Batch ${Math.floor(i/50)+1}: ${webInserts.slice(i, i + 50).length} inserted`)
}

// Mobile extras
const moreApps = [
  ['Mobile-Fitness', 'Pilates Workout App'], ['Mobile-Fitness', 'Jump Rope Counter App'],
  ['Mobile-Entertainment', 'Movie Night Picker App'], ['Mobile-Entertainment', 'Binge Tracker App'],
  ['Mobile-Music', 'Vinyl Collection App'], ['Mobile-Music', 'Music Journal App'],
  ['Mobile-Photography', 'Photo Challenge App'], ['Mobile-Photography', 'Lens Calculator App'],
  ['Mobile-Sports', 'Workout Buddy Finder App'], ['Mobile-Sports', 'Race Day Tracker App'],
  ['Mobile-Meditation', 'Focus Breathing App'], ['Mobile-Meditation', 'Nature Sounds App'],
  ['Mobile-Cooking', 'Air Fryer Recipes App'], ['Mobile-Cooking', 'Cocktail Recipe App'],
  ['Mobile-Parenting', 'Tooth Fairy Tracker App'], ['Mobile-Parenting', 'Kid Activity Planner App'],
  ['Mobile-Pets', 'Cat Health Tracker App'], ['Mobile-Pets', 'Fish Tank Monitor App'],
  ['Mobile-Weather', 'Frost Alert App'], ['Mobile-Weather', 'Beach Day Checker App'],
  ['Mobile-Dating', 'First Date Tips App'], ['Mobile-Dating', 'Gift Ideas App'],
  ['Mobile-News', 'Podcast News Digest App'], ['Mobile-Gaming', 'Board Game Collection App'],
]

const mInserts = moreApps.filter(([,n]) => !existingNames.has(n)).map(([cat, name]) => ({
  name, category: cat,
  description: `A mobile ${name.toLowerCase().replace(' app', '')} application`,
  app_id: `WYBER-MOB-${name.replace(/\s+/g, '-').toUpperCase().slice(0, 20)}-${Date.now().toString(36).slice(-4)}`,
  valid: true, files: {},
}))

if (mInserts.length) {
  const { error } = await sb.from('prebuilt_apps').insert(mInserts)
  if (error) console.error('Mobile seed error:', error.message)
  else console.log(`Seeded ${mInserts.length} more mobile templates`)
}

const { count: wc } = await sb.from('prebuilt_apps').select('id', { count: 'exact', head: true }).not('category', 'like', 'Mobile-%')
const { count: mc } = await sb.from('prebuilt_apps').select('id', { count: 'exact', head: true }).like('category', 'Mobile-%')
console.log(`\nFinal counts: Web: ${wc} | Mobile: ${mc} | Workflows: 300 (in code) | Grand total: ${wc + mc + 300}`)
