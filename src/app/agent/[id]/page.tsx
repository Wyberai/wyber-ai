'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { detectRequiredTools, ToolDefinition } from '@/lib/tool-registry'

const SCHEDULE_PRESETS = [
  { label: 'Every hour',      cron: '0 * * * *'   },
  { label: 'Daily at 7 AM',   cron: '0 7 * * *'   },
  { label: 'Daily at 9 AM',   cron: '0 9 * * *'   },
  { label: 'Weekly (Mon 9AM)',cron: '0 9 * * 1'   },
  { label: 'Custom cron…',    cron: 'custom'       },
]


interface Agent { agent_id: string; name: string; category: string; problem: string; outcome: string; primary_buyer: string; complexity: string; required_tools: string }
interface Execution { id: string; status: string; summary?: string; logs: Array<{type:string;message:string}>; steps: number; started_at: string }
interface ConnectedTool { tool_id: string; connected_at: string; credentials: Record<string,string> }
interface Schedule { cron_expression: string; is_active: boolean; next_run_at: string | null; last_run_at: string | null }

export default function AgentStudioPage() {
  const { id } = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [requiredTools, setRequiredTools] = useState<ToolDefinition[]>([])
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([])
  const [connecting, setConnecting] = useState<string|null>(null)
  const [credentials, setCredentials] = useState<Record<string,Record<string,string>>>({})
  const [running, setRunning] = useState(false)
  const [currentExec, setCurrentExec] = useState<Execution|null>(null)
  const [input, setInput] = useState('')

  // Schedule state
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'manual' | 'scheduled' | 'email'>('manual')
  const [selectedPreset, setSelectedPreset] = useState(SCHEDULE_PRESETS[1].cron) // daily 7am
  const [customCron, setCustomCron] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [emailTriggerActive, setEmailTriggerActive] = useState(false)
  const [emailTriggerLoading, setEmailTriggerLoading] = useState(false)

  const [projectId] = useState(() => {
    if (typeof window === 'undefined') return 'agent-standalone'
    // Try to get user's most recent project ID for tool connections
    return localStorage.getItem('wyber_agent_project') || 
           localStorage.getItem('wyber_default_project') || 
           'agent-' + String(id)
  })

  const load = useCallback(async () => {
    // Fetch by agent_id text field (e.g. WYBER-079) directly
    const res = await fetch('/api/agents/by-agent-id?agentId=' + encodeURIComponent(String(id)))
    const data = await res.json()
    if (data.agent) { setAgent(data.agent); setRequiredTools(detectRequiredTools(data.agent.required_tools||'')) }
    const toolsRes = await fetch('/api/tools?projectId=' + encodeURIComponent(projectId))
    const toolsData = await toolsRes.json()
    setConnectedTools(toolsData.tools || [])

    // Load existing schedule if any
    const schedRes = await fetch('/api/agents/schedule?agentId=' + encodeURIComponent(String(id)))
    if (schedRes.ok) {
      const schedData = await schedRes.json()
      if (schedData.schedule) {
        setSchedule(schedData.schedule)
        setScheduleMode(schedData.schedule.is_active ? 'scheduled' : 'manual')
        const preset = SCHEDULE_PRESETS.find(p => p.cron === schedData.schedule.cron_expression)
        if (preset && preset.cron !== 'custom') {
          setSelectedPreset(schedData.schedule.cron_expression)
        } else {
          setSelectedPreset('custom')
          setCustomCron(schedData.schedule.cron_expression)
        }
      }
    }
    // Check for active email trigger
    const trigRes = await fetch('/api/composio/triggers?agentId=' + encodeURIComponent(String(id)))
    if (trigRes.ok) {
      const trigData = await trigRes.json()
      if (trigData.subscription?.is_active) {
        setEmailTriggerActive(true)
        setScheduleMode('email')
      }
    }
  }, [id, projectId])

  useEffect(() => { load() }, [load])

  const connectTool = async (toolId: string) => {
    const creds = credentials[toolId] || {}
    const res = await fetch('/api/tools', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({projectId, toolId, credentials: creds}) })
    const data = await res.json()
    if (data.success) { setConnecting(null); load() }
    else alert('Failed: ' + data.error)
  }

  const runAgent = async () => {
    if (running) return
    setRunning(true); setCurrentExec(null)
    const res = await fetch('/api/agents/run', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({agentId: id, projectId, input}) })
    const data = await res.json()
    setCurrentExec(data.success ? { id: data.execution_id, status:'completed', summary: data.summary, logs: data.logs||[], steps: data.steps||0, started_at: new Date().toISOString() } : { id:'err', status:'failed', summary: data.error, logs:[], steps:0, started_at: new Date().toISOString() })
    setRunning(false)
  }

  const saveSchedule = async () => {
    setSavingSchedule(true)
    const cronExpr = selectedPreset === 'custom' ? customCron.trim() : selectedPreset
    if (!cronExpr) { setSavingSchedule(false); return }
    const res = await fetch('/api/agents/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: String(id), projectId, cronExpression: cronExpr, lastInput: input || null }),
    })
    const data = await res.json()
    if (data.schedule) {
      setSchedule(data.schedule)
      setScheduleSaved(true)
      setTimeout(() => setScheduleSaved(false), 2500)
    }
    setSavingSchedule(false)
  }

  const removeSchedule = async () => {
    await fetch('/api/agents/schedule?agentId=' + encodeURIComponent(String(id)), { method: 'DELETE' })
    setSchedule(null)
    setScheduleMode('manual')
  }

  const toggleEmailTrigger = async () => {
    setEmailTriggerLoading(true)
    if (emailTriggerActive) {
      await fetch(`/api/composio/triggers?agentId=${encodeURIComponent(String(id))}`, { method: 'DELETE' })
      setEmailTriggerActive(false)
      setScheduleMode('manual')
    } else {
      const res = await fetch('/api/composio/triggers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: String(id), sourceType: 'gmail_new_email' }) })
      const data = await res.json()
      if (data.code === 'no_gmail_connection') {
        alert('Connect Gmail in Settings → Integrations first, then return here to activate.')
      } else {
        setEmailTriggerActive(true)
      }
    }
    setEmailTriggerLoading(false)
  }

  const allConnected = requiredTools.length === 0 || requiredTools.every(t => connectedTools.some(c => c.tool_id === t.id))

  if (!agent) return <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',color:'#52526a',fontFamily: 'var(--font-sans)'}}>Loading...</div>

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',color:'#f0f0f5',fontFamily: 'var(--font-sans)'}}>
      <div style={{borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 32px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',height:60,gap:16}}>
          <button onClick={() => router.push('/agents')} style={{background:'none',border:'none',color:'#52526a',cursor:'pointer',fontSize:13}}>← Agents</button>
          <span style={{color:'rgba(255,255,255,0.15)'}}>|</span>
          <span style={{fontSize:14,fontWeight:600}}>{agent.name}</span>
          <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'rgba(99,102,241,0.1)',color:'#6366f1',border:'1px solid rgba(99,102,241,0.2)'}}>{agent.agent_id}</span>
          <div style={{marginLeft:'auto'}}>
            <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:allConnected?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)',color:allConnected?'#22c55e':'#f59e0b',border:`1px solid ${allConnected?'rgba(34,197,94,0.2)':'rgba(245,158,11,0.2)'}`}}>
              {allConnected?'✓ Ready':'Connect tools to run'}
            </span>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:32,display:'grid',gridTemplateColumns:'1fr 360px',gap:24}}>
        <div>
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:'#6366f1',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>{agent.category} · {agent.complexity}</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>{agent.name}</div>
            <div style={{fontSize:13,color:'#8b8b9a',lineHeight:1.6,marginBottom:12}}>{agent.problem}</div>
            <div style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.12)',borderRadius:8,padding:12,fontSize:13,color:'#a1a1aa'}}>
              <span style={{color:'#22c55e',fontWeight:700}}>Outcome: </span>{agent.outcome}
            </div>
          </div>

          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:20}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Connect Tools</div>
            <div style={{fontSize:12,color:'#52526a',marginBottom:16}}>All credentials encrypted with AES-256-GCM before storage. Never logged or exposed.</div>
            {requiredTools.length === 0 && <div style={{fontSize:13,color:'#52526a'}}>No external tools required for this agent.</div>}
            {requiredTools.map(tool => {
              const isConnected = connectedTools.some(c => c.tool_id === tool.id)
              const isOpen = connecting === tool.id
              return (
                <div key={tool.id} style={{border:`1px solid ${isConnected?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)'}`,borderRadius:10,padding:14,marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:18}}>{tool.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>{tool.name}</div>
                      <div style={{fontSize:11,color:'#52526a'}}>{tool.description}</div>
                    </div>
                    {isConnected
                      ? <span style={{fontSize:11,color:'#22c55e',fontWeight:700}}>✓ Connected</span>
                      : <button onClick={() => setConnecting(isOpen?null:tool.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.08)',color:'#6366f1',fontSize:12,fontWeight:600,cursor:'pointer'}}>{isOpen?'Cancel':'Connect'}</button>
                    }
                  </div>
                  {isOpen && (
                    <div style={{marginTop:12}}>
                      {tool.credentials.map(f => (
                        <div key={f.key} style={{marginBottom:8}}>
                          <div style={{fontSize:11,fontWeight:600,color:'#8b8b9a',marginBottom:3}}>{f.label}{f.required&&<span style={{color:'#ef4444'}}>*</span>}</div>
                          <input type={f.type==='url'?'text':'password'} placeholder={f.placeholder}
                            value={credentials[tool.id]?.[f.key]||''}
                            onChange={e => setCredentials(p => ({...p,[tool.id]:{...(p[tool.id]||{}),[f.key]:e.target.value}}))}
                            style={{width:'100%',background:'#1a1a24',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:'7px 10px',color:'#f0f0f5',fontSize:12,outline:'none',fontFamily:'monospace'}}/>
                          <div style={{fontSize:10,color:'#52526a',marginTop:2}}>{f.helpText}</div>
                        </div>
                      ))}
                      <button onClick={() => connectTool(tool.id)} style={{padding:'7px 16px',borderRadius:6,border:'none',background:'#6366f1',color:'white',fontSize:12,fontWeight:700,cursor:'pointer',marginTop:4}}>
                        🔒 Save Encrypted
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Run Agent</div>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Optional: add context for this run..."
              style={{width:'100%',background:'#1a1a24',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'10px 12px',color:'#f0f0f5',fontSize:13,resize:'vertical',minHeight:72,outline:'none',fontFamily:'inherit',marginBottom:16}}/>

            {/* Run mode toggle */}
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
              {([
                { key: 'manual',    label: '▶  Manual' },
                { key: 'scheduled', label: '⏱  Schedule' },
                { key: 'email',     label: '📧  On Email' },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setScheduleMode(key)}
                  style={{flex:1,minWidth:90,padding:'8px 4px',borderRadius:8,border:`1px solid ${scheduleMode===key?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.06)'}`,background:scheduleMode===key?'rgba(99,102,241,0.1)':'transparent',color:scheduleMode===key?'#a5b4fc':'#71717a',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                  {label}
                </button>
              ))}
            </div>

            {scheduleMode === 'manual' ? (
              <>
                <button onClick={runAgent} disabled={running||(!allConnected&&requiredTools.length>0)}
                  style={{padding:'10px 28px',borderRadius:8,border:'none',background:running||(!allConnected&&requiredTools.length>0)?'#2a2a3a':'#6366f1',color:running||(!allConnected&&requiredTools.length>0)?'#52526a':'white',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                  {running?'⚡ Running agent...':'▶ Run Agent Now'}
                </button>
                {schedule?.is_active && (
                  <div style={{marginTop:12,padding:'8px 12px',borderRadius:8,background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',fontSize:12,color:'#f59e0b',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span>Schedule active — agent also runs automatically</span>
                    <button onClick={removeSchedule} style={{background:'none',border:'none',color:'#ef4444',fontSize:11,fontWeight:700,cursor:'pointer'}}>Remove</button>
                  </div>
                )}
              </>
            ) : scheduleMode === 'scheduled' ? (
              <div style={{background:'rgba(99,102,241,0.04)',border:'1px solid rgba(99,102,241,0.12)',borderRadius:10,padding:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'#a5b4fc',marginBottom:12}}>Choose schedule</div>

                <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
                  {SCHEDULE_PRESETS.map(p => (
                    <label key={p.cron} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                      <input type="radio" name="preset" value={p.cron}
                        checked={selectedPreset === p.cron}
                        onChange={() => setSelectedPreset(p.cron)}
                        style={{accentColor:'#6366f1'}}/>
                      <span style={{fontSize:13,color:'#d4d4d8'}}>{p.label}</span>
                    </label>
                  ))}
                </div>

                {selectedPreset === 'custom' && (
                  <input
                    value={customCron}
                    onChange={e => setCustomCron(e.target.value)}
                    placeholder="e.g. 30 8 * * 1-5  (weekdays at 8:30 AM)"
                    style={{width:'100%',background:'#1a1a24',border:'1px solid rgba(99,102,241,0.2)',borderRadius:6,padding:'7px 10px',color:'#f0f0f5',fontSize:12,outline:'none',fontFamily:'monospace',marginBottom:12,boxSizing:'border-box'}}
                  />
                )}

                {schedule?.is_active && schedule.next_run_at && (
                  <div style={{fontSize:11,color:'#52526a',marginBottom:10}}>
                    Next run: {new Date(schedule.next_run_at).toLocaleString()}
                    {schedule.last_run_at && <> · Last: {new Date(schedule.last_run_at).toLocaleString()}</>}
                  </div>
                )}

                <div style={{display:'flex',gap:8}}>
                  <button onClick={saveSchedule} disabled={savingSchedule}
                    style={{padding:'8px 20px',borderRadius:8,border:'none',background:scheduleSaved?'rgba(34,197,94,0.15)':savingSchedule?'#2a2a3a':'#6366f1',color:scheduleSaved?'#22c55e':savingSchedule?'#52526a':'white',fontSize:13,fontWeight:700,cursor:savingSchedule?'not-allowed':'pointer',transition:'all 0.2s'}}>
                    {scheduleSaved ? '✓ Saved' : savingSchedule ? 'Saving…' : 'Save schedule'}
                  </button>
                  {schedule?.is_active && (
                    <button onClick={removeSchedule}
                      style={{padding:'8px 16px',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.06)',color:'#ef4444',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Remove
                    </button>
                  )}
                </div>
                <div style={{marginTop:10,fontSize:11,color:'#52526a',lineHeight:1.5}}>
                  Credits are checked before each scheduled run. If your balance is too low, the run is skipped and you receive an email notification.
                </div>
              </div>
            ) : scheduleMode === 'email' ? (
              <div style={{background:'rgba(14,165,233,0.04)',border:'1px solid rgba(14,165,233,0.12)',borderRadius:10,padding:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'#7dd3fc',marginBottom:8}}>Gmail trigger — checks every ~15 min</div>
                <div style={{fontSize:12,color:'#a1a1aa',lineHeight:1.6,marginBottom:14}}>
                  Wyber polls your Gmail inbox every ~15 minutes. When a new email arrives, this agent runs automatically with the email as input. You must have Gmail connected in Settings → Integrations.
                </div>
                <button onClick={toggleEmailTrigger} disabled={emailTriggerLoading}
                  style={{padding:'8px 20px',borderRadius:8,border:emailTriggerActive?'1px solid rgba(239,68,68,0.3)':'none',background:emailTriggerActive?'rgba(239,68,68,0.1)':emailTriggerLoading?'#2a2a3a':'#0EA5E9',color:emailTriggerActive?'#ef4444':emailTriggerLoading?'#52526a':'white',fontSize:13,fontWeight:700,cursor:emailTriggerLoading?'not-allowed':'pointer'}}>
                  {emailTriggerLoading ? 'Working…' : emailTriggerActive ? '✕ Deactivate trigger' : '✓ Activate Gmail trigger'}
                </button>
                {emailTriggerActive && <div style={{marginTop:8,fontSize:11,color:'#22c55e'}}>✓ Active — agent will run when new Gmail arrives</div>}
                <div style={{marginTop:10,fontSize:11,color:'#52526a',lineHeight:1.5}}>
                  Credits are checked before each triggered run. If your balance is too low, the run is skipped and you receive an email notification.
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={{position:'sticky',top:24}}>
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Execution Results</div>
            {running && <div style={{textAlign:'center',padding:'32px 0'}}><div style={{width:28,height:28,border:'2px solid rgba(99,102,241,0.15)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/><div style={{fontSize:13,color:'#8b8b9a'}}>Running...</div></div>}
            {currentExec && !running && (
              <div>
                <div style={{padding:'8px 12px',borderRadius:8,marginBottom:12,background:currentExec.status==='completed'?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)',border:`1px solid ${currentExec.status==='completed'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'}`,fontSize:12,fontWeight:700,color:currentExec.status==='completed'?'#22c55e':'#ef4444'}}>
                  {currentExec.status==='completed'?`✓ Completed · ${currentExec.steps} API calls`:'✗ Failed'}
                </div>
                {currentExec.summary && <div style={{fontSize:12,color:'#a1a1aa',lineHeight:1.6,marginBottom:12,padding:12,background:'rgba(255,255,255,0.02)',borderRadius:8,maxHeight:220,overflowY:'auto',whiteSpace:'pre-wrap'}}>{currentExec.summary}</div>}
                {currentExec.logs.map((log,i) => (
                  <div key={i} style={{fontSize:11,padding:'3px 8px',borderRadius:4,marginBottom:2,color:log.type==='error'?'#ef4444':log.type==='success'?'#22c55e':log.type==='warning'?'#f59e0b':'#8b8b9a'}}>{log.message}</div>
                ))}
              </div>
            )}
            {!currentExec && !running && <div style={{textAlign:'center',padding:'32px 0',color:'#3f3f46',fontSize:13}}>Run the agent to see results here</div>}
          </div>

          <div style={{background:'rgba(99,102,241,0.04)',border:'1px solid rgba(99,102,241,0.12)',borderRadius:12,padding:16,marginTop:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#6366f1',marginBottom:8}}>🔒 Security</div>
            <div style={{fontSize:11,color:'#52526a',lineHeight:1.6}}>
              • AES-256-GCM encryption at rest<br/>
              • Credentials decrypted only during execution<br/>
              • Never logged or exposed in responses<br/>
              • TLS 1.3 in transit<br/>
              • Row-level security on all data<br/>
              • Keys never leave your control
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
