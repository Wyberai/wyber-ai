import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Maps required_tools string keywords to node configs
function buildNodesFromTools(agentName: string, requiredTools: string, outcome: string) {
  const lower = (requiredTools || '').toLowerCase()
  
  const nodes = [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 80, y: 200 },
      data: { label: 'Manual Trigger', subtitle: `Start the ${agentName}`, config: { type: 'manual' }, status: 'idle' }
    },
    {
      id: 'aiagent-1',
      type: 'aiagent',
      position: { x: 380, y: 200 },
      data: { label: agentName, subtitle: outcome?.slice(0, 100) || '', config: { model: 'claude-sonnet-4-6', instructions: `You are ${agentName}. ${outcome || ''}` }, status: 'idle' }
    },
  ]

  const edges = [
    { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: '#0EA5E9', strokeWidth: 2 } }
  ]

  let x = 680
  let lastNodeId = 'aiagent-1'

  // Add tool nodes based on required_tools
  const toolMap: Record<string, { toolId: string; label: string }> = {
    'slack': { toolId: 'slack', label: 'Send Slack Alert' },
    'gmail': { toolId: 'gmail', label: 'Send Email' },
    'hubspot': { toolId: 'hubspot', label: 'Update HubSpot' },
    'salesforce': { toolId: 'hubspot', label: 'Update CRM' },
    'notion': { toolId: 'notion', label: 'Update Notion' },
    'github': { toolId: 'github', label: 'GitHub Action' },
    'stripe': { toolId: 'stripe', label: 'Check Stripe' },
    'airtable': { toolId: 'airtable', label: 'Update Airtable' },
    'linear': { toolId: 'linear', label: 'Create Linear Issue' },
  }

  let toolY = 120
  const addedTools: string[] = []

  Object.entries(toolMap).forEach(([keyword, tool]) => {
    if (lower.includes(keyword) && !addedTools.includes(tool.toolId)) {
      addedTools.push(tool.toolId)
      const nodeId = `tool-${tool.toolId}`
      nodes.push({
        id: nodeId,
        type: 'tool',
        position: { x, y: toolY },
        data: { label: tool.label, subtitle: `Connect ${tool.toolId} credentials to activate`, config: {}, toolId: tool.toolId, status: 'idle' }
      })
      edges.push({
        id: `e-${lastNodeId}-${nodeId}`,
        source: 'aiagent-1',
        target: nodeId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      })
      toolY += 180
      x += 0
    }
  })

  // Add output node
  const outputX = addedTools.length > 0 ? 980 : 680
  nodes.push({
    id: 'output-1',
    type: 'output',
    position: { x: outputX, y: 200 },
    data: { label: 'Done', subtitle: 'Agent execution complete', config: {}, status: 'idle' }
  })

  return { nodes, edges }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId } = await req.json()
    if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

    const admin = await createAdminClient()

    // Get agent from library
    const { data: agent } = await admin
      .from('agent_workflows')
      .select('agent_id, name, category, problem, outcome, required_tools')
      .eq('agent_id', agentId)
      .single()

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    // Build canvas nodes from agent config
    const { nodes, edges } = buildNodesFromTools(agent.name, agent.required_tools, agent.outcome)

    // Create project
    const { data: project, error } = await admin
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

    if (error || !project) throw error || new Error('Failed to create project')

    // Save canvas state to flows table
    await admin.from('flows').insert({
      user_id: user.id,
      name: agent.name,
      description: agent.problem || '',
      nodes,
      edges,
      is_active: false,
      run_count: 0,
      project_id: project.id,
    }).catch(() => {}) // non-critical

    // Store canvas in sessionStorage key
    const canvasData = JSON.stringify({ nodes, edges })

    return NextResponse.json({
      projectId: project.id,
      canvasData,
      agent: { name: agent.name, category: agent.category }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
