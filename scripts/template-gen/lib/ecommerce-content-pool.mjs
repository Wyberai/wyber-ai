// Compact-descriptor helper for the Ecommerce/WebApp-Ecommerce batch files —
// same philosophy as content-pool.mjs's assembleConfig(): each niche only
// hand-supplies what's genuinely vertical-specific (name, KPIs, real item
// vocabulary); rows/activity/notifications/team/sparks are still generated
// by assembleConfig() itself. This layer just removes the saas-shell
// boilerplate (route/pascal/label/singular, filters, rowsSpec wrapper) that
// would otherwise be repeated identically across all 88 descriptors.
import { assembleConfig } from './content-pool.mjs'

const DEFAULT_STATUSES = ['Pending', 'Processing', 'Fulfilled']

export function ecomSpec(d) {
  const category = d.webapp ? 'WebApp-Ecommerce' : 'Ecommerce'
  const statuses = d.statuses || DEFAULT_STATUSES
  return {
    seed: d.seed,
    name: d.name,
    category,
    paletteId: d.paletteId,
    appName: d.appName,
    tagline: d.tagline,
    loginQuote: d.loginQuote,
    navIcon: d.navIcon,
    primaryFeatureRoute: d.route,
    primaryFeaturePascal: d.pascal,
    primaryFeatureLabel: d.label,
    primaryFeatureSingular: d.singular,
    greetingInsight: d.insight,
    dashboardVariant: 'activity',
    weeklyBase: d.weeklyBase,
    kpis: d.kpis,
    primaryTable: {
      columns: d.columns,
      filters: statuses,
      rowsSpec: {
        count: 9,
        subjectKind: d.subjectKind || 'company',
        statuses,
        itemTypes: d.itemTypes,
        details: d.details,
      },
    },
    analyticsKpis: d.analyticsKpis,
    trend: d.trend,
    sources: d.sources,
    rankedLabel: d.rankedLabel,
  }
}

export function buildBatch(descriptors) {
  return descriptors.map((d) => ({
    name: d.name,
    category: d.webapp ? 'WebApp-Ecommerce' : 'Ecommerce',
    paletteId: d.paletteId,
    config: assembleConfig(ecomSpec(d)),
  }))
}
