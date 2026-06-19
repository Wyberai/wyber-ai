import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns a suggested canvas layout based on ICP profile
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch GTM profile for context
  const { data: profile } = await supabase
    .from('gtm_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Return a pre-built suggested flow based on profile
  const nodes: any[] = [
    { id: '1', type: 'gtm', position: { x: 280, y: 60 }, data: { type: 'audience', icon: '🎯', label: 'ICP Segment', subtitle: profile?.company_name ? `${profile.company_name} ICP` : 'Your target audience', description: profile?.icp_industries?.join(', ') || 'Define your ICP first' } },
    { id: '2', type: 'gtm', position: { x: 280, y: 210 }, data: { type: 'enrich', icon: '🔍', label: 'Enrich via Apollo', subtitle: 'Pull verified contacts', description: 'Email + direct dial for ICP matches', creditCost: '2 credits per contact' } },
    { id: '3', type: 'gtm', position: { x: 280, y: 360 }, data: { type: 'filter', icon: '⚗️', label: 'Filter: ICP score ≥ 70', subtitle: 'Quality gate', description: 'Only pass high-fit leads forward' } },
    { id: '4', type: 'gtm', position: { x: 280, y: 510 }, data: { type: 'email', icon: '✉️', label: 'Email 1 — Day 0', subtitle: 'Personalised intro', description: 'Reference their role + company. Short & value-first.' } },
    { id: '5', type: 'gtm', position: { x: 280, y: 660 }, data: { type: 'wait', icon: '⏳', label: 'Wait 3 days', days: 3 } },
    { id: '6', type: 'gtm', position: { x: 280, y: 790 }, data: { type: 'email', icon: '✉️', label: 'Email 2 — Day 3', subtitle: 'Social proof', description: 'Share a relevant case study or result.' } },
    { id: '7', type: 'gtm', position: { x: 280, y: 940 }, data: { type: 'wait', icon: '⏳', label: 'Wait 4 days', days: 4 } },
    { id: '8', type: 'gtm', position: { x: 280, y: 1070 }, data: { type: 'branch', icon: '⑂', label: 'Opened or replied?' } },
    { id: '9', type: 'gtm', position: { x: 80, y: 1220 }, data: { type: 'call', icon: '📞', label: 'Call hot lead', subtitle: 'Same-day call', description: 'Strike while warm. 5-min discovery.' } },
    { id: '10', type: 'gtm', position: { x: 280, y: 1220 }, data: { type: 'sdr_employee', icon: '👤', label: 'SDR takes over', subtitle: 'Wyber AI SDR', description: 'Hands off to AI SDR for nurture' } },
    { id: '11', type: 'gtm', position: { x: 480, y: 1220 }, data: { type: 'suppress', icon: '⛔', label: 'Suppress 90 days', description: 'No signal — remove from sequence' } },
  ]

  const edges: any[] = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', style: { stroke: '#8b5cf650', strokeWidth: 1.5 } },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', style: { stroke: '#0EA5E950', strokeWidth: 1.5 } },
    { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', style: { stroke: '#71717a50', strokeWidth: 1.5 } },
    { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', style: { stroke: '#10b98150', strokeWidth: 1.5 } },
    { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', style: { stroke: '#52525b50', strokeWidth: 1.5 } },
    { id: 'e6-7', source: '6', target: '7', type: 'smoothstep', style: { stroke: '#10b98150', strokeWidth: 1.5 } },
    { id: 'e7-8', source: '7', target: '8', type: 'smoothstep', style: { stroke: '#52525b50', strokeWidth: 1.5 } },
    { id: 'e8-9', source: '8', target: '9', sourceHandle: 'branch-0', type: 'smoothstep', style: { stroke: '#10b98150', strokeWidth: 1.5 } },
    { id: 'e8-10', source: '8', target: '10', sourceHandle: 'branch-1', type: 'smoothstep', style: { stroke: '#f59e0b50', strokeWidth: 1.5 } },
    { id: 'e8-11', source: '8', target: '11', sourceHandle: 'branch-2', type: 'smoothstep', style: { stroke: '#ef444450', strokeWidth: 1.5 } },
  ]

  return NextResponse.json({ nodes, edges })
}
