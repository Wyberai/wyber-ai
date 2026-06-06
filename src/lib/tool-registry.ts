// Tool registry — defines every supported tool for agent execution
// Icons are now rendered via BrandLogo/ToolLogo component — see BrandLogo.tsx

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: 'communication' | 'crm' | 'database' | 'productivity' | 'ai' | 'developer' | 'marketing' | 'finance'
  domain: string        // for BrandLogo component
  icon: string          // kept for legacy/fallback text use
  credentials: CredentialField[]
  actions: ToolAction[]
  docsUrl: string
}

export interface CredentialField {
  key: string
  label: string
  placeholder: string
  type: 'api_key' | 'url' | 'token' | 'webhook_url'
  helpText: string
  required: boolean
}

export interface ToolAction {
  id: string
  name: string
  description: string
  parameters: Record<string, string>
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'slack', name: 'Slack', domain: 'slack.com',
    description: 'Send messages, post to channels, create alerts',
    category: 'communication', icon: 'SL',
    credentials: [
      { key: 'bot_token', label: 'Bot Token', placeholder: 'xoxb-...', type: 'token', helpText: 'Create a Slack App at api.slack.com and get Bot Token', required: true },
      { key: 'default_channel', label: 'Default Channel', placeholder: '#general', type: 'api_key', helpText: 'Default channel to post messages', required: false },
    ],
    actions: [
      { id: 'send_message', name: 'Send Message', description: 'Post a message to a channel', parameters: { channel: 'string', message: 'string' } },
      { id: 'create_alert', name: 'Create Alert', description: 'Post a formatted alert', parameters: { channel: 'string', title: 'string', body: 'string', severity: 'info|warning|error' } },
    ],
    docsUrl: 'https://api.slack.com/authentication/token-types',
  },
  {
    id: 'gmail', name: 'Gmail', domain: 'gmail.google.com',
    description: 'Read emails, send messages, create drafts',
    category: 'communication', icon: 'GM',
    credentials: [
      { key: 'api_key', label: 'Gmail API Key', placeholder: 'AIza...', type: 'api_key', helpText: 'Enable Gmail API in Google Cloud Console', required: true },
      { key: 'sender_email', label: 'Sender Email', placeholder: 'you@gmail.com', type: 'api_key', helpText: 'Gmail address to send from', required: true },
    ],
    actions: [
      { id: 'send_email', name: 'Send Email', description: 'Send an email', parameters: { to: 'string', subject: 'string', body: 'string' } },
      { id: 'read_inbox', name: 'Read Inbox', description: 'Read recent emails', parameters: { max_results: 'number', query: 'string' } },
    ],
    docsUrl: 'https://developers.google.com/gmail/api/quickstart',
  },
  {
    id: 'hubspot', name: 'HubSpot', domain: 'hubspot.com',
    description: 'Manage contacts, deals, and CRM data',
    category: 'crm', icon: 'HS',
    credentials: [
      { key: 'api_key', label: 'Private App Token', placeholder: 'pat-na1-...', type: 'api_key', helpText: 'Create a Private App in HubSpot Settings → Integrations', required: true },
    ],
    actions: [
      { id: 'create_contact', name: 'Create Contact', description: 'Add a new contact', parameters: { email: 'string', firstname: 'string', lastname: 'string', company: 'string' } },
      { id: 'update_deal', name: 'Update Deal', description: 'Update a deal stage', parameters: { deal_id: 'string', stage: 'string', amount: 'number' } },
      { id: 'get_contacts', name: 'Get Contacts', description: 'Retrieve contacts list', parameters: { limit: 'number', properties: 'string[]' } },
    ],
    docsUrl: 'https://developers.hubspot.com/docs/api/private-apps',
  },
  {
    id: 'airtable', name: 'Airtable', domain: 'airtable.com',
    description: 'Read and write records to Airtable bases',
    category: 'database', icon: 'AT',
    credentials: [
      { key: 'api_key', label: 'Personal Access Token', placeholder: 'pat...', type: 'api_key', helpText: 'Generate at airtable.com/create/tokens', required: true },
      { key: 'base_id', label: 'Base ID', placeholder: 'app...', type: 'api_key', helpText: 'Found in your Airtable API docs URL', required: true },
    ],
    actions: [
      { id: 'list_records', name: 'List Records', description: 'Get records from a table', parameters: { table: 'string', max_records: 'number', filter: 'string' } },
      { id: 'create_record', name: 'Create Record', description: 'Add a new record', parameters: { table: 'string', fields: 'object' } },
      { id: 'update_record', name: 'Update Record', description: 'Update existing record', parameters: { table: 'string', record_id: 'string', fields: 'object' } },
    ],
    docsUrl: 'https://airtable.com/developers/web/api/introduction',
  },
  {
    id: 'notion', name: 'Notion', domain: 'notion.so',
    description: 'Create pages, update databases, manage content',
    category: 'productivity', icon: 'NT',
    credentials: [
      { key: 'api_key', label: 'Integration Token', placeholder: 'secret_...', type: 'api_key', helpText: 'Create integration at notion.so/my-integrations', required: true },
    ],
    actions: [
      { id: 'create_page', name: 'Create Page', description: 'Create a new page', parameters: { parent_id: 'string', title: 'string', content: 'string' } },
      { id: 'query_database', name: 'Query Database', description: 'Query a Notion database', parameters: { database_id: 'string', filter: 'object' } },
    ],
    docsUrl: 'https://developers.notion.com/docs/authorization',
  },
  {
    id: 'github', name: 'GitHub', domain: 'github.com',
    description: 'Manage repos, issues, PRs and code',
    category: 'developer', icon: 'GH',
    credentials: [
      { key: 'token', label: 'Personal Access Token', placeholder: 'ghp_...', type: 'token', helpText: 'Generate at github.com/settings/tokens', required: true },
    ],
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a GitHub issue', parameters: { repo: 'string', title: 'string', body: 'string', labels: 'string[]' } },
      { id: 'list_prs', name: 'List PRs', description: 'List open pull requests', parameters: { repo: 'string', state: 'open|closed|all' } },
    ],
    docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
  },
  {
    id: 'openai', name: 'OpenAI', domain: 'openai.com',
    description: 'Use GPT models in your agent workflows',
    category: 'ai', icon: 'OA',
    credentials: [
      { key: 'api_key', label: 'API Key', placeholder: 'sk-...', type: 'api_key', helpText: 'Found at platform.openai.com/api-keys', required: true },
    ],
    actions: [
      { id: 'complete', name: 'Completion', description: 'Generate text completion', parameters: { model: 'string', prompt: 'string', max_tokens: 'number' } },
    ],
    docsUrl: 'https://platform.openai.com/docs/api-reference',
  },
  {
    id: 'webhook', name: 'Custom Webhook', domain: '',
    description: 'Send data to any webhook URL',
    category: 'developer', icon: 'WH',
    credentials: [
      { key: 'url', label: 'Webhook URL', placeholder: 'https://...', type: 'webhook_url', helpText: 'Your webhook endpoint URL', required: true },
      { key: 'secret', label: 'Secret (optional)', placeholder: 'your-secret', type: 'api_key', helpText: 'Signing secret for verification', required: false },
    ],
    actions: [
      { id: 'post', name: 'POST Request', description: 'Send POST to webhook', parameters: { payload: 'object', headers: 'object' } },
    ],
    docsUrl: '',
  },
  {
    id: 'supabase', name: 'Supabase', domain: 'supabase.com',
    description: 'Read and write to your Supabase database',
    category: 'database', icon: 'SB',
    credentials: [
      { key: 'url', label: 'Project URL', placeholder: 'https://xxx.supabase.co', type: 'url', helpText: 'Found in Project Settings → API', required: true },
      { key: 'service_key', label: 'Service Role Key', placeholder: 'eyJ...', type: 'api_key', helpText: 'Service role key from Project Settings → API', required: true },
    ],
    actions: [
      { id: 'query', name: 'Query Table', description: 'Read records from a table', parameters: { table: 'string', filter: 'object', limit: 'number' } },
      { id: 'insert', name: 'Insert Record', description: 'Insert a record', parameters: { table: 'string', data: 'object' } },
    ],
    docsUrl: 'https://supabase.com/docs/reference/javascript/introduction',
  },
  {
    id: 'sendgrid', name: 'SendGrid', domain: 'sendgrid.com',
    description: 'Send transactional and marketing emails',
    category: 'marketing', icon: 'SG',
    credentials: [
      { key: 'api_key', label: 'API Key', placeholder: 'SG....', type: 'api_key', helpText: 'Found in SendGrid Settings → API Keys', required: true },
      { key: 'from_email', label: 'From Email', placeholder: 'noreply@yourcompany.com', type: 'api_key', helpText: 'Verified sender email', required: true },
    ],
    actions: [
      { id: 'send_email', name: 'Send Email', description: 'Send a transactional email', parameters: { to: 'string', subject: 'string', html: 'string' } },
    ],
    docsUrl: 'https://docs.sendgrid.com/ui/account-and-settings/api-keys',
  },
  {
    id: 'stripe', name: 'Stripe', domain: 'stripe.com',
    description: 'Check payments, customers and subscriptions',
    category: 'finance', icon: 'ST',
    credentials: [
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'api_key', helpText: 'Found in Stripe Dashboard → Developers → API Keys', required: true },
    ],
    actions: [
      { id: 'list_customers', name: 'List Customers', description: 'Get recent customers', parameters: { limit: 'number', email: 'string' } },
      { id: 'get_revenue', name: 'Get Revenue', description: 'Get revenue stats', parameters: { period: 'day|week|month' } },
    ],
    docsUrl: 'https://stripe.com/docs/keys',
  },
  {
    id: 'linear', name: 'Linear', domain: 'linear.app',
    description: 'Create and manage issues and projects',
    category: 'developer', icon: 'LN',
    credentials: [
      { key: 'api_key', label: 'API Key', placeholder: 'lin_api_...', type: 'api_key', helpText: 'Generated in Linear Settings → API', required: true },
    ],
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a Linear issue', parameters: { team_id: 'string', title: 'string', description: 'string', priority: '0|1|2|3|4' } },
    ],
    docsUrl: 'https://linear.app/settings/api',
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find(t => t.id === id)
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return TOOL_REGISTRY.filter(t => t.category === category)
}

export function detectRequiredTools(requiredToolsString: string): ToolDefinition[] {
  if (!requiredToolsString) return []
  const lower = requiredToolsString.toLowerCase()
  return TOOL_REGISTRY.filter(tool => {
    const name = tool.name.toLowerCase()
    return lower.includes(name) || lower.includes(tool.id)
  })
}
