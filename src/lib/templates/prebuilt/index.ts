import { SAAS_LANDING } from './saas-landing'
import { ADMIN_DASHBOARD } from './admin-dashboard'
import { CRM } from './crm'
import { KANBAN } from './kanban'
import { ECOMMERCE } from './ecommerce'
import { PORTFOLIO } from './portfolio'
import { INVOICE } from './invoice'
import { CHAT } from './chat'
import { HR_DASHBOARD } from './hr-dashboard'
import { REAL_ESTATE } from './real-estate'
import { RESTAURANT } from './restaurant'
import { BANKING } from './banking'

export const PREBUILT_TEMPLATES: Record<string, Record<string, string>> = {
  // Landing pages
  'landing-page': SAAS_LANDING,
  'startup-landing': SAAS_LANDING,
  'waitlist-landing': SAAS_LANDING,

  // Dashboards
  'saas-dashboard': ADMIN_DASHBOARD,
  'analytics-dashboard': ADMIN_DASHBOARD,
  'hr-dashboard': HR_DASHBOARD,
  'banking-dashboard': BANKING,

  // Apps
  'crm': CRM,
  'kanban-board': KANBAN,
  'project-management': KANBAN,
  'product-catalog': ECOMMERCE,
  'invoice-generator': INVOICE,
  'chat-app': CHAT,
  'email-client': CHAT,

  // Industry
  'property-listings': REAL_ESTATE,
  'real-estate-agent': REAL_ESTATE,
  'restaurant-dashboard': RESTAURANT,
  'restaurant-ordering': RESTAURANT,
  'recruitment-ats': HR_DASHBOARD,
  'employee-directory': HR_DASHBOARD,
  'investment-portfolio': BANKING,
  'expense-tracker': BANKING,

  // Personal
  'portfolio': PORTFOLIO,
  'portfolio-dark': PORTFOLIO,
}

export function getPrebuilt(id: string): Record<string, string> | null {
  return PREBUILT_TEMPLATES[id] ?? null
}

export const PREBUILT_COUNT = Object.keys(PREBUILT_TEMPLATES).length
