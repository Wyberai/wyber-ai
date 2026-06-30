'use client'
import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'

// All integrations from real agent_workflows required_tools data
export const INTEGRATIONS: Record<string, { label: string; color: string; icon: string; category: string; fields: string[] }> = {
  // AI & LLM
  llm:        { label: 'AI / LLM',        color: '#8b5cf6', icon: '🤖', category: 'AI',          fields: ['Model', 'System Prompt', 'Temperature'] },
  openai:     { label: 'OpenAI',           color: '#10a37f', icon: '⚡', category: 'AI',          fields: ['Model', 'API Key', 'Prompt'] },
  anthropic:  { label: 'Anthropic Claude', color: '#d97706', icon: '🧠', category: 'AI',          fields: ['Model', 'API Key', 'System Prompt'] },

  // Communication
  slack:      { label: 'Slack',            color: '#611f69', icon: '💬', category: 'Comms',       fields: ['Channel', 'Message', 'Bot Token'] },
  email:      { label: 'Email',            color: '#0EA5E9', icon: '📧', category: 'Comms',       fields: ['To', 'Subject', 'Body', 'SMTP Config'] },
  gmail:      { label: 'Gmail',            color: '#ea4335', icon: '📬', category: 'Comms',       fields: ['To', 'Subject', 'Body'] },
  teams:      { label: 'Microsoft Teams',  color: '#464eb8', icon: '🫂', category: 'Comms',       fields: ['Team', 'Channel', 'Message'] },

  // CRM & Sales
  crm:        { label: 'CRM',              color: '#f59e0b', icon: '👥', category: 'CRM',         fields: ['Action', 'Record Type', 'Fields'] },
  salesforce: { label: 'Salesforce',       color: '#00a1e0', icon: '☁️', category: 'CRM',         fields: ['Object', 'Action', 'Fields'] },
  hubspot:    { label: 'HubSpot',          color: '#ff7a59', icon: '🔶', category: 'CRM',         fields: ['Object', 'Action', 'Properties'] },
  pipedrive:  { label: 'Pipedrive',        color: '#007b5e', icon: '🔵', category: 'CRM',         fields: ['Deal Stage', 'Action', 'Fields'] },

  // Project Management
  jira:       { label: 'Jira',             color: '#0052cc', icon: '📋', category: 'Project',     fields: ['Project', 'Issue Type', 'Summary', 'Assignee'] },
  linear:     { label: 'Linear',           color: '#5e6ad2', icon: '◈',  category: 'Project',     fields: ['Team', 'Status', 'Title', 'Assignee'] },
  asana:      { label: 'Asana',            color: '#f06a6a', icon: '✅', category: 'Project',     fields: ['Project', 'Task Name', 'Assignee', 'Due Date'] },
  notion:     { label: 'Notion',           color: '#ffffff', icon: '📝', category: 'Project',     fields: ['Database', 'Action', 'Properties'] },

  // Storage & Docs
  drive:      { label: 'Google Drive',     color: '#34a853', icon: '📁', category: 'Storage',     fields: ['Action', 'Folder', 'File Name'] },
  sharepoint: { label: 'SharePoint',       color: '#038387', icon: '🗂️', category: 'Storage',     fields: ['Site', 'Library', 'Action'] },
  dropbox:    { label: 'Dropbox',          color: '#0061ff', icon: '📦', category: 'Storage',     fields: ['Folder', 'Action', 'File'] },

  // Productivity
  sheets:     { label: 'Google Sheets',    color: '#0f9d58', icon: '📊', category: 'Productivity', fields: ['Spreadsheet', 'Sheet', 'Range', 'Action'] },
  workspace:  { label: 'Google Workspace', color: '#4285f4', icon: '🔷', category: 'Productivity', fields: ['Service', 'Action', 'Parameters'] },
  airtable:   { label: 'Airtable',         color: '#fcb400', icon: '🗃️', category: 'Productivity', fields: ['Base', 'Table', 'Action', 'Fields'] },

  // Finance
  stripe:     { label: 'Stripe',           color: '#635bff', icon: '💳', category: 'Finance',     fields: ['Action', 'Customer', 'Amount', 'Currency'] },
  quickbooks: { label: 'QuickBooks',       color: '#2ca01c', icon: '📒', category: 'Finance',     fields: ['Action', 'Account', 'Amount'] },
  xero:       { label: 'Xero',             color: '#13b5ea', icon: '💰', category: 'Finance',     fields: ['Action', 'Account', 'Contact'] },
  erp:        { label: 'ERP System',       color: '#6366f1', icon: '🏭', category: 'Finance',     fields: ['Module', 'Action', 'Parameters'] },

  // IT & Security
  okta:       { label: 'Okta / Azure AD',  color: '#007dc1', icon: '🔐', category: 'Security',    fields: ['Action', 'User', 'Group', 'App'] },
  github:     { label: 'GitHub',           color: '#24292e', icon: '🐙', category: 'Dev',          fields: ['Repo', 'Action', 'Branch'] },
  vanta:      { label: 'Vanta / Drata',    color: '#7c3aed', icon: '🛡️', category: 'Security',    fields: ['Control', 'Evidence Type', 'Status'] },

  // Support
  support:    { label: 'Support Desk',     color: '#22c55e', icon: '🎫', category: 'Support',     fields: ['Action', 'Ticket ID', 'Status', 'Assignee'] },
  zendesk:    { label: 'Zendesk',          color: '#03363d', icon: '🎟️', category: 'Support',     fields: ['Action', 'Ticket', 'Status'] },
  intercom:   { label: 'Intercom',         color: '#1f8ded', icon: '💭', category: 'Support',     fields: ['Action', 'User', 'Message'] },

  // Marketing & Ads
  metaads:    { label: 'Meta Ads',         color: '#1877f2', icon: '📱', category: 'Marketing',   fields: ['Campaign', 'Metric', 'Date Range'] },
  googleads:  { label: 'Google Ads',       color: '#fbbc04', icon: '🎯', category: 'Marketing',   fields: ['Campaign', 'Metric', 'Date Range'] },
  analytics:  { label: 'Analytics / BI',   color: '#a855f7', icon: '📈', category: 'Marketing',   fields: ['Metric', 'Dimension', 'Date Range'] },

  // Data & Web
  websearch:  { label: 'Web Search / API', color: '#0EA5E9', icon: '🔍', category: 'Data',        fields: ['Query', 'Source', 'Results Limit'] },
  webhook:    { label: 'HTTP / Webhook',   color: '#64748b', icon: '🔗', category: 'Data',        fields: ['URL', 'Method', 'Headers', 'Body'] },
  database:   { label: 'Database',         color: '#6b7280', icon: '🗄️', category: 'Data',        fields: ['Connection', 'Query', 'Parameters'] },
}

// Map common required_tools strings to integration keys
export const TOOL_ALIAS: Record<string, string> = {
  'LLM': 'llm', 'AI': 'llm', 'Claude': 'anthropic', 'OpenAI': 'openai',
  'Slack': 'slack', 'Email': 'email', 'Gmail': 'gmail', 'Teams': 'teams',
  'CRM': 'crm', 'Salesforce': 'salesforce', 'HubSpot': 'hubspot',
  'Jira': 'jira', 'Jira/Linear': 'jira', 'Linear': 'linear', 'Asana': 'asana', 'Notion': 'notion',
  'Drive': 'drive', 'Drive/SharePoint': 'drive', 'SharePoint': 'sharepoint', 'Google Drive': 'drive',
  'Sheets': 'sheets', 'Google Sheets': 'sheets', 'Google Workspace': 'workspace', 'Airtable': 'airtable',
  'Stripe': 'stripe', 'QuickBooks': 'quickbooks', 'QuickBooks/Xero': 'quickbooks', 'Xero': 'xero', 'ERP': 'erp',
  'Okta': 'okta', 'Okta/Azure AD': 'okta', 'Azure AD': 'okta', 'GitHub': 'github', 'Vanta/Drata': 'vanta', 'Vanta': 'vanta', 'Drata': 'vanta',
  'Support': 'support', 'Support desk': 'support', 'Zendesk': 'zendesk', 'Intercom': 'intercom',
  'Meta Ads': 'metaads', 'Google Ads': 'googleads', 'Analytics': 'analytics', 'BI/Sheets': 'analytics',
  'Web search/API': 'websearch', 'Web/search': 'websearch', 'Bank feeds': 'webhook',
  'Billing': 'stripe', 'Finance': 'erp', 'Product analytics': 'analytics',
  'Project tool': 'jira', 'Docs': 'drive', 'YouTube/transcript': 'websearch',
}

export function resolveTools(requiredTools: string): string[] {
  return requiredTools.split(',').map(t => {
    const trimmed = t.trim()
    return TOOL_ALIAS[trimmed] || Object.keys(INTEGRATIONS).find(k =>
      INTEGRATIONS[k].label.toLowerCase().includes(trimmed.toLowerCase())
    ) || 'webhook'
  }).filter(Boolean)
}

// Integration Node Component for ReactFlow
export const IntegrationNode = memo(({ data }: NodeProps) => {
  const integration = INTEGRATIONS[data.integrationKey] || INTEGRATIONS.webhook
  const { label, color, icon } = integration

  return (
    <div style={{
      background: '#111118',
      border: `1px solid ${color}40`,
      borderRadius: 12,
      padding: '10px 14px',
      minWidth: 160,
      boxShadow: `0 0 0 1px ${color}20, 0 4px 20px rgba(0,0,0,0.3)`,
      fontFamily: 'var(--font-sans)',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8, border: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fafafa', lineHeight: 1.2 }}>{label}</div>
          {data.action && <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>{data.action}</div>}
        </div>
        <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: data.connected ? '#22c55e' : '#3f3f46', flexShrink: 0 }} />
      </div>

      {data.fields && data.fields.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.fields.slice(0, 2).map((field: string) => (
            <div key={field} style={{ fontSize: 10, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#3f3f46', flexShrink: 0 }} />
              {field}
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8, border: 'none' }} />
    </div>
  )
})
IntegrationNode.displayName = 'IntegrationNode'

// Integration picker panel — shows in the canvas sidebar
export function IntegrationPicker({ onAdd }: { onAdd: (key: string) => void }) {
  const categories = Array.from(new Set(Object.values(INTEGRATIONS).map(i => i.category)))

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {categories.map(cat => (
        <div key={cat}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{cat}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(INTEGRATIONS)
              .filter(([, v]) => v.category === cat)
              .map(([key, integration]) => (
                <button
                  key={key}
                  onClick={() => onAdd(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'transparent', color: '#a1a1aa',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = `${integration.color}12`
                    ;(e.currentTarget as HTMLElement).style.borderColor = `${integration.color}40`
                    ;(e.currentTarget as HTMLElement).style.color = '#fafafa'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                    ;(e.currentTarget as HTMLElement).style.color = '#a1a1aa'
                  }}
                >
                  <span style={{ fontSize: 14 }}>{integration.icon}</span>
                  <span>{integration.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
