// What the MCP tells a person a build will cost must be what /api/generate then charges. /api/generate raises the size tier of every
// NEW build to at least "large" when the launch-ready flag for that project type is on (it is on in production for all four types), so
// an estimate from the file count alone is too low and the connector would quote one number and charge another. This is the same
// floor, in one place, for get_build_cost and start_build. Project types are the connector's own: web-app, mobile, website, saas.
import type { BuildSizeTier } from '@/lib/credits'
import { isLaunchReadyApp, floorBuildTier } from '@/lib/launch-ready'
import { isLaunchReadyWebsite, floorWebsiteTier } from '@/lib/website-ready'
import { isLaunchReadySaas, floorSaasTier } from '@/lib/saas-ready'
import { isLaunchReadyMobile, floorMobileTier } from '@/lib/mobile-ready'

export function floorTierForProjectType(projectType: string, tier: BuildSizeTier): BuildSizeTier {
  if (isLaunchReadyWebsite(projectType)) return floorWebsiteTier(tier)
  if (isLaunchReadySaas(projectType)) return floorSaasTier(tier)
  if (isLaunchReadyMobile(projectType)) return floorMobileTier(tier)
  if (isLaunchReadyApp(projectType)) return floorBuildTier(tier)
  return tier
}
