import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Integration tool map — covers all 35 integrations from agent_workflows data
const TOOL_NODE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  // AI
  'llm':          { label: 'AI / LLM',         color: '#8b5cf6', icon: '🤖' },
  'openai':       { label: 'OpenAI',            color: '#10a37f', icon: '⚡' },
  'anthropic':    { label: 'Claude',            color: '#d97706', icon: '🧠' },
  // Comms
  'slack':        { label: 'Slack',             color: '#611f69', icon: '💬' },
  'email':        { label: 'Email',             color: '#0EA5E9', icon: '📧' },
  'gmail':        { label: 'Gmail',             color: '#ea4335', icon: '📬' },
  'teams':        { label: 'Microsoft Teams',   color: '#464eb8', icon: '🫂' },
  // CRM
  'crm':          { label: 'CRM',               color: '#f59e0b', icon: '👥' },
  'salesforce':   { label: 'Salesforce',        color: '#00a1e0', icon: '☁️' },
  'hubspot':      { label: 'HubSpot',           color: '#ff7a59', icon: '🔶' },
  // Project
  'jira':         { label: 'Jira',              color: '#0052cc', icon: '📋' },
  'linear':       { label: 'Linear',            color: '#5e6ad2', icon: '◈'  },
  'notion':       { label: 'Notion',            color: '#ffffff', icon: '📝' },
  'asana':        { label: 'Asana',             color: '#f06a6a', icon: '✅' },
  // Storage
  'drive':        { label: 'Google Drive',      color: '#34a853', icon: '📁' },
  'sharepoint':   { label: 'SharePoint',        color: '#038387', icon: '🗂️' },
  // Productivity
  'sheets':       { label: 'Google Sheets',     color: '#0f9d58', icon: '📊' },
  'airtable':     { label: 'Airtable',          color: '#fcb400', icon: '🗃️' },
  'workspace':    { label: 'Google Workspace',  color: '#4285f4', icon: '🔷' },
  // Finance
  'stripe':       { label: 'Stripe',            color: '#635bff', icon: '💳' },
  'quickbooks':   { label: 'QuickBooks',        color: '#2ca01c', icon: '📒' },
  'xero':         { label: 'Xero',              color: '#13b5ea', icon: '💰' },
  'erp':          { label: 'ERP System',        color: '#6366f1', icon: '🏭' },
  // Security / IT
  'okta':         { label: 'Okta / Azure AD',   color: '#007dc1', icon: '🔐' },
  'github':       { label: 'GitHub',            color: '#24292e', icon: '🐙' },
  'vanta':        { label: 'Vanta / Drata',     color: '#7c3aed', icon: '🛡️' },
  // Support
  'support':      { label: 'Support Desk',      color: '#22c55e', icon: '🎫' },
  'zendesk':      { label: 'Zendesk',           color: '#03363d', icon: '🎟️' },
  // Marketing
  'metaads':      { label: 'Meta Ads',          color: '#1877f2', icon: '📱' },
  'googleads':    { label: 'Google Ads',        color: '#fbbc04', icon: '🎯' },
  'analytics':    { label: 'Analytics / BI',    color: '#a855f7', icon: '📈' },
  // Data
  'websearch':    { label: 'Web Search',        color: '#0EA5E9', icon: '🔍' },
  'webhook':      { label: 'HTTP Webhook',      color: '#64748b', icon: '🔗' },
  'database':     { label: 'Database',          color: '#6b7280', icon: '🗄️' },
}

// Map raw required_tools strings to tool keys
const TOOL_ALIASES: Record<string, string> = {
  'LLM': 'llm', 'AI': 'llm', 'Claude': 'anthropic', 'OpenAI': 'openai',
  'Slack': 'slack', 'Email': 'email', 'Gmail': 'gmail', 'Teams': 'teams',
  'CRM': 'crm', 'Salesforce': 'salesforce', 'HubSpot': 'hubspot',
  'Jira': 'jira', 'Jira/Linear': 'jira', 'Linear': 'linear', 'Notion': 'notion', 'Asana': 'asana',
  'Drive': 'drive', 'Drive/SharePoint': 'drive', 'SharePoint': 'sharepoint', 'Google Drive': 'drive',
  'Sheets': 'sheets', 'Google Sheets': 'sheets', 'Google Workspace': 'workspace', 'Airtable': 'airtable',
  'Stripe': 'stripe', 'QuickBooks': 'quickbooks', 'QuickBooks/Xero': 'quickbooks', 'Xero': 'xero',
  'ERP': 'erp', 'Bank feeds': 'webhook', 'Finance': 'erp',
  'Okta': 'okta', 'Okta/Azure AD': 'okta', 'Azure AD': 'okta',
  'GitHub': 'github', 'Vanta/Drata': 'vanta', 'Vanta': 'vanta', 'Drata': 'vanta',
  'Support': 'support', 'Support desk': 'support', 'Zendesk': 'zendesk',
  'Meta Ads': 'metaads', 'Google Ads': 'googleads',
  'Analytics': 'analytics', 'BI/Sheets': 'analytics', 'Product analytics': 'analytics',
  'Web search/API': 'websearch', 'Web/search': 'websearch',
  'Billing': 'stripe', 'Project tool': 'jira',
  'Docs': 'drive', 'YouTube/transcript': 'websearch',
}

// Composio toolkit slugs for each toolKey (uppercased to match Composio's API)
const TOOL_COMPOSIO_SLUGS: Record<string, string> = {
  slack:        'SLACK',
  gmail:        'GMAIL',
  email:        'GMAIL',
  teams:        'MICROSOFT_TEAMS',
  hubspot:      'HUBSPOT',
  salesforce:   'SALESFORCE',
  notion:       'NOTION',
  linear:       'LINEAR',
  jira:         'JIRA',
  asana:        'ASANA',
  sheets:       'GOOGLESHEETS',
  drive:        'GOOGLEDRIVE',
  workspace:    'GOOGLEDRIVE',
  airtable:     'AIRTABLE',
  github:       'GITHUB',
  stripe:       'STRIPE',
  quickbooks:   'QUICKBOOKS',
  xero:         'XERO',
  zendesk:      'ZENDESK',
  support:      'ZENDESK',
}

interface CanvasNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

interface CanvasEdge {
  id: string
  source: string
  target: string
  animated: boolean
  style: Record<string, unknown>
}

function buildCanvas(agentName: string, requiredTools: string, outcome: string, problem: string): {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
} {
  // Parse required tools
  const toolKeys = requiredTools
    .split(',')
    .map(t => t.trim())
    .map(t => TOOL_ALIASES[t] || null)
    .filter((k): k is string => k !== null && k in TOOL_NODE_MAP)
    .filter((k, i, arr) => arr.indexOf(k) === i) // dedupe
    .slice(0, 6) // max 6 tool nodes for clean canvas

  const nodes: CanvasNode[] = []
  const edges: CanvasEdge[] = []

  // Layout constants
  const COL_WIDTH = 280
  const ROW_HEIGHT = 140
  const CANVAS_TOP = 80

  // 1. Trigger node
  nodes.push({
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 60, y: CANVAS_TOP + (toolKeys.length * ROW_HEIGHT) / 2 },
    data: {
      label: 'Manual Trigger',
      subtitle: problem?.slice(0, 80) || 'Start agent manually',
      config: { type: 'manual' },
      status: 'idle',
    }
  })

  // 2. AI Agent node
  nodes.push({
    id: 'aiagent-1',
    type: 'aiagent',
    position: { x: 60 + COL_WIDTH, y: CANVAS_TOP + (toolKeys.length * ROW_HEIGHT) / 2 },
    data: {
      label: agentName,
      subtitle: outcome?.slice(0, 100) || '',
      config: {
        model: 'claude-sonnet-4-6',
        instructions: `You are ${agentName}.\n\nProblem: ${problem || ''}\n\nOutcome: ${outcome || ''}\n\nAnalyze inputs carefully and take precise, high-quality actions.`,
      },
      status: 'idle',
    }
  })

  edges.push({
    id: 'e-trigger-agent',
    source: 'trigger-1',
    target: 'aiagent-1',
    animated: true,
    style: { stroke: '#0EA5E9', strokeWidth: 2 }
  })

  // 3. Tool nodes — arranged vertically in column 3
  toolKeys.forEach((toolKey, i) => {
    const tool = TOOL_NODE_MAP[toolKey]
    const nodeId = `tool-${toolKey}-${i}`
    nodes.push({
      id: nodeId,
      type: 'tool',
      position: {
        x: 60 + COL_WIDTH * 2,
        y: CANVAS_TOP + i * ROW_HEIGHT,
      },
      data: {
        label: tool.label,
        subtitle: 'Connect credentials to activate',
        toolId: toolKey,
        color: tool.color,
        icon: tool.icon,
        config: TOOL_COMPOSIO_SLUGS[toolKey]
          ? { mode: 'composio', toolkit: TOOL_COMPOSIO_SLUGS[toolKey], action: '' }
          : { mode: 'http', url: '' },
        status: 'idle',
      }
    })

    edges.push({
      id: `e-agent-${nodeId}`,
      source: 'aiagent-1',
      target: nodeId,
      animated: true,
      style: { stroke: tool.color, strokeWidth: 1.5, opacity: 0.8 }
    })
  })

  // 4. Condition node (only if multiple tools — represents routing logic)
  let lastBeforeOutput = toolKeys.length > 2 ? 'condition-1' : (toolKeys.length > 0 ? `tool-${toolKeys[toolKeys.length - 1]}-${toolKeys.length - 1}` : 'aiagent-1')

  if (toolKeys.length > 2) {
    nodes.push({
      id: 'condition-1',
      type: 'condition',
      position: {
        x: 60 + COL_WIDTH * 3,
        y: CANVAS_TOP + (toolKeys.length * ROW_HEIGHT) / 2,
      },
      data: {
        label: 'Evaluate Result',
        subtitle: 'Check agent output quality',
        config: { condition: 'output.success === true' },
        status: 'idle',
      }
    })

    toolKeys.forEach((toolKey, i) => {
      edges.push({
        id: `e-tool-${toolKey}-${i}-condition`,
        source: `tool-${toolKey}-${i}`,
        target: 'condition-1',
        animated: false,
        style: { stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4,4' }
      })
    })
  }

  // 5. Output node
  const outputX = 60 + COL_WIDTH * (toolKeys.length > 2 ? 4 : toolKeys.length > 0 ? 3 : 2)
  nodes.push({
    id: 'output-1',
    type: 'output',
    position: {
      x: outputX,
      y: CANVAS_TOP + (toolKeys.length * ROW_HEIGHT) / 2,
    },
    data: {
      label: 'Done',
      subtitle: outcome?.slice(0, 80) || 'Agent execution complete',
      config: { notify: true },
      status: 'idle',
    }
  })

  edges.push({
    id: 'e-last-output',
    source: lastBeforeOutput,
    target: 'output-1',
    animated: true,
    style: { stroke: '#22c55e', strokeWidth: 2 }
  })

  return { nodes, edges }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { agentId } = body
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

    const admin = await createAdminClient()

    // Fetch agent from library
    const { data: agent, error: agentErr } = await admin
      .from('agent_workflows')
      .select('agent_id, name, category, problem, outcome, required_tools, complexity, primary_buyer')
      .eq('agent_id', agentId)
      .single()

    if (agentErr || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Build canvas layout
    const { nodes, edges } = buildCanvas(
      agent.name,
      agent.required_tools || '',
      agent.outcome || '',
      agent.problem || ''
    )

    // Create project
    const { data: project, error: projectErr } = await admin
      .from('projects')
      .insert({
        user_id: user.id,
        name: agent.name,
        framework: 'react-vite',
        files: {},
        project_type: 'agent',
        initial_prompt: agent.problem || '',
      })
      .select('id')
      .single()

    if (projectErr || !project) {
      console.error('Project create error:', projectErr)
      throw new Error(projectErr?.message || 'Failed to create project')
    }

    // Save to flows table — use try/catch NOT .catch()
    try {
      await admin.from('flows').insert({
        user_id: user.id,
        name: agent.name,
        description: agent.problem || '',
        nodes,
        edges,
        is_active: false,
        run_count: 0,
        project_id: project.id,
      })
    } catch (flowErr) {
      // Non-critical — canvas still works from sessionStorage
      console.warn('Flow save failed (non-critical):', flowErr)
    }

    return NextResponse.json({
      projectId: project.id,
      canvasData: JSON.stringify({ nodes, edges }),
      agent: {
        name: agent.name,
        category: agent.category,
        complexity: agent.complexity,
        primaryBuyer: agent.primary_buyer,
        problem: agent.problem,
        outcome: agent.outcome,
      }
    })
  } catch (err: any) {
    console.error('build-from-agent error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
