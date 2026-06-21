import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { writeFileSync, readFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const WORKFLOW_CATEGORIES = [
  'Sales', 'Marketing', 'Customer Support', 'HR & People', 'Finance',
  'Operations', 'Engineering', 'Product', 'Legal', 'Content',
  'Social Media', 'Analytics', 'Recruitment', 'Project Management',
  'Customer Success', 'Security', 'Data', 'Ecommerce', 'Healthcare', 'Education',
]

const SYSTEM_PROMPT = `You are a workflow automation expert. Generate workflow automation templates as JSON.

Each template needs:
- name: short descriptive name (3-6 words)
- description: one-line description of what it does
- category: one of the provided categories
- icon: a single emoji
- nodes: array of workflow nodes
- edges: array of connections between nodes

Node types and their structure:
- trigger: { id, type: "trigger", label, tool: "Webhook"|"Schedule"|"Email"|"Form", position: {x,y}, config: { type?, cron_expression?, instructions? } }
- ai/aiagent: { id, type: "ai", label, tool: "Claude AI", position: {x,y}, config: { instructions: "detailed prompt" } }
- action: { id, type: "action", label, tool: "Gmail"|"Slack"|"HubSpot"|"Notion"|"Google Sheets"|"Airtable"|"LinkedIn"|"Twitter"|"Stripe"|"Zapier"|"HTTP", position: {x,y}, config: { message? } }
- condition: { id, type: "condition", label, tool: "Logic", position: {x,y}, config: { condition: "rule description" } }
- end: { id, type: "end", label, tool: "End", position: {x,y}, config: {} }

Edge structure: { id, source: "nodeId", target: "nodeId", label?: "optional label" }

Position nodes left-to-right: x starts at 300, increment by 220. y = 200 for main flow, branch at y=120 and y=320.

Each workflow should have 3-6 nodes. Make them PRACTICAL and REALISTIC — things businesses actually automate.

Output a JSON array of 8 workflow templates. Keep config.instructions under 80 chars. No prose, just the JSON array.`

async function generateWorkflowBatch(category, batchNum) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Generate 8 unique workflow automation templates for the "${category}" category. Batch ${batchNum} — make these PRACTICAL and CREATIVE, things real businesses automate daily.

IMPORTANT: Keep config.instructions under 80 characters. Keep descriptions under 100 characters.

Output ONLY a JSON array. No markdown, no code fences, just [ ... ]`,
    }],
  })

  const text = response.content[0].text.trim()
  // Parse JSON — handle potential markdown code fences
  let json = text
  if (json.startsWith('```')) json = json.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  try {
    const templates = JSON.parse(json)
    const cost = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1000000
    return { templates, cost }
  } catch (e) {
    console.error(`  Parse error for ${category}: ${String(e).slice(0, 80)}`)
    return { templates: [], cost: 0 }
  }
}

async function main() {
  const target = parseInt(process.argv[2] || '300')
  const batchesPerCat = Math.ceil(target / (WORKFLOW_CATEGORIES.length * 8))

  console.log(`\n⚡ Workflow Template Generator`)
  console.log(`   Target: ${target} | Categories: ${WORKFLOW_CATEGORIES.length} | Batches/cat: ${batchesPerCat}\n`)

  const allTemplates = []
  let totalCost = 0

  for (const category of WORKFLOW_CATEGORIES) {
    for (let batch = 1; batch <= batchesPerCat; batch++) {
      process.stdout.write(`  ${category} (batch ${batch})...`)
      const { templates, cost } = await generateWorkflowBatch(category, batch)
      totalCost += cost

      // Add IDs and validate
      for (const t of templates) {
        if (!t.name || !t.nodes || !Array.isArray(t.nodes)) continue
        t.category = category
        t.id = `wf-${category.toLowerCase().replace(/[^a-z]/g, '')}-${allTemplates.length + 1}`
        allTemplates.push(t)
      }

      console.log(` ${templates.length} templates ($${cost.toFixed(3)})`)

      if (allTemplates.length >= target) break
    }
    if (allTemplates.length >= target) break
  }

  const final = allTemplates.slice(0, target)
  console.log(`\nGenerated ${final.length} workflow templates, cost: $${totalCost.toFixed(2)}`)

  // Write to workflow-gallery.ts
  const header = `export interface WorkflowNode {
  id: string
  type: 'trigger' | 'ai' | 'action' | 'condition' | 'end'
  label: string
  tool: string
  position: { x: number; y: number }
  config: {
    instructions?: string
    message?: string
    condition?: string
    schedule?: string
    type?: string
    cron_expression?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export const WORKFLOW_CATEGORIES = [
  'All', ${WORKFLOW_CATEGORIES.map(c => `'${c}'`).join(', ')}
]

export const WORKFLOW_GALLERY: WorkflowTemplate[] = ${JSON.stringify(final, null, 2)}
`

  const outPath = resolve(process.cwd(), 'src/lib/templates/workflow-gallery.ts')
  writeFileSync(outPath, header, 'utf-8')
  console.log(`\nWritten to ${outPath}`)
  console.log(`Total cost: $${totalCost.toFixed(2)}`)
}

await main()
