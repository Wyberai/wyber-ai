import { WEBAPP_SKELETON } from './webapp'
import { WEBSITE_SKELETON } from './website'
import { SAAS_SKELETON } from './saas'
import { MOBILE_SKELETON } from './mobile'

export { WEBAPP_SKELETON, WEBSITE_SKELETON, SAAS_SKELETON, MOBILE_SKELETON }

export function getSkeletonForType(projectType: string | undefined): Record<string, string> | null {
  switch (projectType) {
    case 'website': return WEBSITE_SKELETON
    case 'saas': return SAAS_SKELETON
    case 'mobile': return MOBILE_SKELETON
    case 'webapp':
    default: return WEBAPP_SKELETON
  }
}
