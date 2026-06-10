'use client'

interface WorkflowStep {
  id: string; type: 'trigger' | 'action' | 'condition' | 'ai'; label: string; tool?: string; color: string
}
interface Props { agentName: string; requiredTools: string; complexity: string }

function inferWorkflow(name: string, tools: string, complexity: string): WorkflowStep[] {
  const t = (tools || '').toLowerCase(); const n = name.toLowerCase()
  const steps: WorkflowStep[] = []

  if (t.includes('slack')) steps.push({ id:'t', type:'trigger', label:'New message in Slack', tool:'Slack', color:'#E01E5A' })
  else if (t.includes('gmail') || t.includes('email')) steps.push({ id:'t', type:'trigger', label:'New email received', tool:'Gmail', color:'#EA4335' })
  else if (n.includes('daily') || n.includes('morning') || n.includes('brief')) steps.push({ id:'t', type:'trigger', label:'Scheduled: Every day 7AM', tool:'Schedule', color:'#6366f1' })
  else steps.push({ id:'t', type:'trigger', label:'Webhook trigger', tool:'Webhook', color:'#6366f1' })

  steps.push({ id:'ai', type:'ai', label:'Claude AI analyzes & decides', tool:'Claude AI', color:'#8b5cf6' })

  if (t.includes('hubspot') || t.includes('salesforce')) steps.push({ id:'crm', type:'action', label:'Update CRM record', tool:'HubSpot', color:'#FF7A59' })
  if (t.includes('airtable')) steps.push({ id:'db', type:'action', label:'Log to Airtable', tool:'Airtable', color:'#18BFFF' })
  if (t.includes('notion')) steps.push({ id:'notion', type:'action', label:'Update Notion database', tool:'Notion', color:'#ffffff' })
  if (complexity === 'Enterprise') steps.push({ id:'cond', type:'condition', label:'Branch: if score ≥ threshold', tool:'Branch', color:'#f59e0b' })

  if (t.includes('slack')) steps.push({ id:'n', type:'action', label:'Notify owner in Slack', tool:'Slack', color:'#E01E5A' })
  else steps.push({ id:'n', type:'action', label:'Send email notification', tool:'Email', color:'#EA4335' })

  steps.push({ id:'log', type:'action', label:'Log to execution history', tool:'Wyber AI', color:'#22c55e' })
  return steps
}

const ICONS: Record<string,string> = { trigger:'⚡', ai:'🤖', action:'▶', condition:'◆' }

export function WorkflowVisualizer({ agentName, requiredTools, complexity }: Props) {
  const steps = inferWorkflow(agentName, requiredTools, complexity)
  return (
    <div style={{ background:'#0d0d14', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#52526a', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Automation Flow</div>
      {steps.map((step, i) => (
        <div key={step.id}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:`${step.color}18`, border:`1.5px solid ${step.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>{ICONS[step.type]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#d4d4d8' }}>{step.label}</div>
              <div style={{ fontSize:10, color:step.color, fontWeight:700, marginTop:1 }}>{step.type.toUpperCase()} · {step.tool}</div>
            </div>
          </div>
          {i < steps.length-1 && <div style={{ width:1, height:12, background:'rgba(255,255,255,0.07)', marginLeft:15, marginTop:2, marginBottom:2 }}/>}
        </div>
      ))}
      <div style={{ marginTop:14, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:10, color:'#3f3f46' }}>
        {steps.length} steps · Full visual builder coming soon
      </div>
    </div>
  )
}
