import { fontsHrefFor, renderTokensCss } from '../build-spec/tokens'
import { CSV_TS, DB_TS, LOGIC_TS } from '../app-spec/runtime-core'
import { API_TS, CSV_IMPORT_TSX, FORM_TSX } from '../app-spec/runtime-ui'
import { ENTITY_PAGE_TSX, HISTORY_TSX, HOME_TSX } from '../app-spec/runtime-pages'
import { renderSchema } from '../app-spec/render'
import { llmsTxt, renderIndexHtml, robotsTxt, sitemapXml } from '../website-spec/seo'
import type { SiteCopy } from '../website-spec/types'
import { renderPlansTs } from './plans'
import { renderProductApp } from './render-product'
import { renderSite } from './render-site'
import { EMAIL_TS, CHECKOUT_TS, HTTP_TS, STATUS_TS, STORE_TS, SUBSCRIPTION_TS, WEBHOOK_TS } from './templates-api'
import { SAAS_TS } from './templates-core'
import { ADMIN_TSX, AUTH_TSX, BILLING_TSX, CHECKLIST_TSX, LEGAL_TSX, PARTS_TSX, SETTINGS_TSX, SETUP_TSX, TEAM_TSX } from './templates-pages'
import type { SaasModel, SaasSpec } from './types'

const PRINT_CSS = `section[id] { scroll-margin-top: 5rem; }
@media print {
  [data-noprint], aside, nav { display: none !important; }
  body { background: #fff; color: #000; }
  main { padding: 0; max-width: none; }
}
`

export function renderOwnerDetails(spec: SaasSpec, productName: string): string {
  const f = spec.site.brief.facts
  const v = (s?: string) => JSON.stringify(s ?? '')
  return `// What the owner told us. Leave a value as an empty string when unknown; nothing here is guessed, and anything empty is left out of the Terms and Privacy pages.
export const OWNER = {
  productName: ${v(productName)},
  name: ${v(f.name)},
  city: ${v(f.city)},
  country: '',
  email: ${v(f.email)},
  phone: ${v(f.phone)},
}
`
}

export const ROUTER_TSX = `import { useEffect, useState } from 'react'
import Site from './Site'
import ProductApp from './product/ProductApp'
import { Privacy, Terms } from './saas/Legal'

// One page, three places: the product site at #/ , the product at #/app and the legal pages at #/terms and #/privacy.
export default function App() {
  const [hash, setHash] = useState<string>(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  if (hash.startsWith('#/app')) return <ProductApp />
  if (hash.startsWith('#/terms')) return <Terms />
  if (hash.startsWith('#/privacy')) return <Privacy />
  return <Site />
}
`

export interface RenderedSaas { files: Record<string, string> }

export function renderSaas(spec: SaasSpec, model: SaasModel, copy: SiteCopy): RenderedSaas {
  const app = model.app
  const html = renderIndexHtml(spec.site, copy, fontsHrefFor(spec.direction.id, ['en']))
  return {
    files: {
      'src/App.tsx': ROUTER_TSX,
      'src/Site.tsx': renderSite(spec, copy, app),
      'src/product/ProductApp.tsx': renderProductApp(app),
      'src/schema.ts': renderSchema(spec.app, app, spec.currency),
      'src/plans.ts': renderPlansTs(model.plans, app, spec.currency),
      'src/owner-details.ts': renderOwnerDetails(spec, app.appName),
      'src/lib/db.ts': DB_TS,
      'src/lib/csv.ts': CSV_TS,
      'src/lib/logic.ts': LOGIC_TS,
      'src/lib/saas.ts': SAAS_TS,
      'src/components/api.ts': API_TS,
      'src/components/FormDialog.tsx': FORM_TSX,
      'src/components/CsvImport.tsx': CSV_IMPORT_TSX,
      'src/components/EntityPage.tsx': ENTITY_PAGE_TSX,
      'src/components/HomePage.tsx': HOME_TSX,
      'src/components/HistoryPage.tsx': HISTORY_TSX,
      'src/saas/parts.tsx': PARTS_TSX,
      'src/saas/AuthPage.tsx': AUTH_TSX,
      'src/saas/TeamPage.tsx': TEAM_TSX,
      'src/saas/BillingPage.tsx': BILLING_TSX,
      'src/saas/SetupPage.tsx': SETUP_TSX,
      'src/saas/SettingsPage.tsx': SETTINGS_TSX,
      'src/saas/AdminPage.tsx': ADMIN_TSX,
      'src/saas/Checklist.tsx': CHECKLIST_TSX,
      'src/saas/Legal.tsx': LEGAL_TSX,
      'api/_store.ts': STORE_TS,
      'api/_http.ts': HTTP_TS,
      'api/checkout.ts': CHECKOUT_TS,
      'api/webhook.ts': WEBHOOK_TS,
      'api/subscription.ts': SUBSCRIPTION_TS,
      'api/status.ts': STATUS_TS,
      'api/send-email.ts': EMAIL_TS,
      'src/index.css': renderTokensCss(spec.direction.id, ['en'], PRINT_CSS),
      'index.html': html,
      'public/robots.txt': robotsTxt(spec.site),
      'public/sitemap.xml': sitemapXml(spec.site),
      'public/llms.txt': llmsTxt(spec.site, copy),
      'src/build-spec.json': JSON.stringify({ spec, model, copy }, null, 2),
    },
  }
}
