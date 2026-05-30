// Detects user intent from a prompt and returns the best skeleton + slot-fill config
import { SkeletonKey } from './slot-fill'

interface IntentMatch {
  skeleton: SkeletonKey
  accent: string
  appName: string
  confidence: number
}

// Keyword patterns → skeleton mapping
const INTENT_PATTERNS: Array<{
  keywords: string[]
  skeleton: SkeletonKey
  accent: string
  defaultName: string
}> = [
  // Dashboards & Admin
  { keywords: ['dashboard', 'admin', 'analytics', 'metrics', 'kpi', 'overview', 'reporting', 'stats', 'monitor'], skeleton: 'admin-dashboard', accent: '#0EA5E9', defaultName: 'Dashboard' },
  // CRM & Sales
  { keywords: ['crm', 'sales', 'leads', 'pipeline', 'contacts', 'deals', 'prospects', 'customers', 'accounts'], skeleton: 'crm', accent: '#0EA5E9', defaultName: 'CRM' },
  // Project Management & Kanban
  { keywords: ['kanban', 'project', 'tasks', 'board', 'sprint', 'agile', 'todo', 'tickets', 'issues', 'backlog', 'trello', 'jira', 'linear'], skeleton: 'kanban', accent: '#0EA5E9', defaultName: 'TaskBoard' },
  // E-commerce & Shop
  { keywords: ['shop', 'store', 'ecommerce', 'products', 'cart', 'checkout', 'marketplace', 'inventory', 'catalog', 'retail', 'buy', 'sell'], skeleton: 'ecommerce', accent: '#f97316', defaultName: 'Store' },
  // Portfolio & Personal
  { keywords: ['portfolio', 'personal site', 'resume', 'cv', 'showcase', 'developer profile', 'about me'], skeleton: 'portfolio', accent: '#0EA5E9', defaultName: 'Portfolio' },
  // Invoice & Finance forms
  { keywords: ['invoice', 'billing', 'receipt', 'quote', 'estimate', 'payment form', 'invoice generator'], skeleton: 'invoice', accent: '#0EA5E9', defaultName: 'Invoice' },
  // Chat & Messaging
  { keywords: ['chat', 'messaging', 'messenger', 'inbox', 'conversation', 'dm', 'slack', 'discord', 'communication'], skeleton: 'chat', accent: '#0EA5E9', defaultName: 'Chat' },
  // HR & People
  { keywords: ['hr', 'human resources', 'employees', 'staff', 'hiring', 'recruitment', 'payroll', 'workforce', 'people ops', 'org chart', 'team management'], skeleton: 'hr-dashboard', accent: '#8b5cf6', defaultName: 'HR Hub' },
  // Real Estate & Property
  { keywords: ['real estate', 'property', 'listings', 'homes', 'apartments', 'rent', 'buy house', 'mortgage', 'realty', 'housing'], skeleton: 'real-estate', accent: '#f59e0b', defaultName: 'EstateHub' },
  // Restaurant & Food
  { keywords: ['restaurant', 'food', 'menu', 'orders', 'kitchen', 'dining', 'cafe', 'bistro', 'pos', 'tables', 'reservations'], skeleton: 'restaurant', accent: '#f97316', defaultName: 'Restaurant' },
  // Banking & Finance
  { keywords: ['bank', 'banking', 'finance', 'fintech', 'wallet', 'transactions', 'accounts', 'money', 'payments', 'investment', 'portfolio', 'stocks', 'crypto', 'trading', 'budget', 'expense'], skeleton: 'banking', accent: '#10b981', defaultName: 'Finance' },
  // Landing Page & Marketing
  { keywords: ['landing page', 'saas landing', 'marketing site', 'homepage', 'hero', 'pricing page', 'startup', 'waitlist', 'coming soon'], skeleton: 'saas-landing', accent: '#0EA5E9', defaultName: 'Landing' },
]

export function detectIntent(prompt: string): IntentMatch | null {
  const p = prompt.toLowerCase()
  let bestMatch: IntentMatch | null = null
  let bestScore = 0

  for (const pattern of INTENT_PATTERNS) {
    let score = 0
    for (const kw of pattern.keywords) {
      if (p.includes(kw)) {
        // Longer keywords = more specific = higher score
        score += kw.length > 6 ? 3 : kw.length > 4 ? 2 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = {
        skeleton: pattern.skeleton,
        accent: pattern.accent,
        appName: extractAppName(prompt) || pattern.defaultName,
        confidence: score,
      }
    }
  }

  // Only return if we have reasonable confidence
  return bestScore >= 2 ? bestMatch : null
}

function extractAppName(prompt: string): string | null {
  // Extract app name from patterns like "called X", "named X", "for X", "brand X"
  const patterns = [
    /(?:called|named|for|brand|app|platform|system|tool)\s+["']?([A-Z][a-zA-Z0-9\s]{1,20})["']?/,
    /["']([A-Z][a-zA-Z0-9\s]{2,20})["']/,
  ]
  for (const pat of patterns) {
    const m = prompt.match(pat)
    if (m?.[1]) return m[1].trim().split(' ').slice(0, 2).join(' ')
  }
  return null
}
