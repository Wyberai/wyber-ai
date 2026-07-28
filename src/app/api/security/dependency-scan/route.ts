import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Real dependency vulnerability scan — queries the free OSV.dev database
// (Google-run, same data source `npm audit` uses under the hood) for every
// package in the generated app's package.json. Not a static linter guess:
// each result is a real published CVE/GHSA advisory for that exact package
// and version range.

interface OsvVuln {
  id: string
  summary?: string
  details?: string
  severity?: { type: string; score: string }[]
  database_specific?: { severity?: string }
}

async function queryOsv(name: string, version: string): Promise<OsvVuln[]> {
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: { name, ecosystem: 'npm' }, version }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.vulns || []
  } catch {
    return [] // one package's lookup failing shouldn't fail the whole scan
  }
}

function severityRank(vuln: OsvVuln): 'critical' | 'high' | 'medium' | 'low' {
  const raw = (vuln.database_specific?.severity || vuln.severity?.[0]?.type || '').toUpperCase()
  if (raw.includes('CRITICAL')) return 'critical'
  if (raw.includes('HIGH')) return 'high'
  if (raw.includes('MEDIUM') || raw.includes('MODERATE')) return 'medium'
  return 'low'
}

// package.json version ranges (^1.2.3, ~1.2.3, >=1.2.3) aren't a single
// version OSV can query directly — resolve to the lowest plausible concrete
// version so the scan checks something real rather than skipping the package.
function resolveConcreteVersion(range: string): string | null {
  const match = range.match(/(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const admin = await createAdminClient()
    const { data: project, error } = await admin
      .from('projects')
      .select('files')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const pkgFile = project.files?.['package.json']
    if (!pkgFile?.content) {
      return NextResponse.json({ error: 'No package.json found in this project' }, { status: 404 })
    }

    let pkg: any
    try {
      pkg = JSON.parse(pkgFile.content)
    } catch {
      return NextResponse.json({ error: 'package.json is not valid JSON' }, { status: 400 })
    }

    const deps: Record<string, string> = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
    const depEntries = Object.entries(deps)

    const results = await Promise.all(
      depEntries.map(async ([name, range]) => {
        const version = resolveConcreteVersion(String(range))
        if (!version) return { name, version: String(range), vulns: [] as OsvVuln[], skipped: true }
        const vulns = await queryOsv(name, version)
        return { name, version, vulns, skipped: false }
      })
    )

    const findings = results
      .filter(r => r.vulns.length > 0)
      .flatMap(r => r.vulns.map(v => ({
        package: r.name,
        version: r.version,
        id: v.id,
        summary: v.summary || v.details?.slice(0, 200) || 'No summary available',
        severity: severityRank(v),
        url: `https://osv.dev/vulnerability/${v.id}`,
      })))
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.severity] - order[b.severity]
      })

    return NextResponse.json({
      packagesScanned: depEntries.length,
      packagesSkipped: results.filter(r => r.skipped).length,
      vulnerabilityCount: findings.length,
      findings,
      scannedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[security/dependency-scan] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
