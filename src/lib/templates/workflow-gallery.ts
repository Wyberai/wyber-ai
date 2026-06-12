export interface WorkflowNode {
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
  'All', 'Customer Support', 'Marketing', 'Sales', 'HR & People',
  'Finance', 'Operations', 'Dev & IT',
]

export const WORKFLOW_GALLERY: WorkflowTemplate[] = [
  {
    id: 'wf-lead-qualifier',
    name: 'Lead Qualifier',
    description: 'Qualify inbound leads via webhook, score with AI, and route to CRM or rejection.',
    category: 'Sales',
    icon: '🎯',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Lead Webhook', tool: 'Webhook', position: { x: 300, y: 80 }, config: { instructions: 'Receives lead data: name, email, company, message' } },
      { id: 'n2', type: 'ai', label: 'Score & Qualify Lead', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Score this lead 1-10 based on company size, intent, and message quality. Output JSON: { score, reason, qualified: true/false, priority: "high"|"medium"|"low" }' } },
      { id: 'n3', type: 'condition', label: 'Qualified?', tool: 'Logic', position: { x: 300, y: 360 }, config: { condition: 'If score >= 7 → route to CRM, else → send rejection email' } },
      { id: 'n4', type: 'action', label: 'Add to HubSpot CRM', tool: 'HubSpot', position: { x: 120, y: 500 }, config: { message: 'Create contact with lead score and priority tag' } },
      { id: 'n5', type: 'action', label: 'Send Nurture Email', tool: 'Gmail', position: { x: 480, y: 500 }, config: { message: 'Send a polite "not a fit right now" email with helpful resources' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'Qualified' },
      { id: 'e4', source: 'n3', target: 'n5', label: 'Not qualified' },
    ],
  },
  {
    id: 'wf-support-ticket',
    name: 'Support Ticket Router',
    description: 'Auto-classify support emails, generate AI draft replies, and route by priority.',
    category: 'Customer Support',
    icon: '🎧',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Support Email', tool: 'Gmail', position: { x: 300, y: 80 }, config: { instructions: 'Triggered when email arrives to support@' } },
      { id: 'n2', type: 'ai', label: 'Classify & Draft Reply', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Classify ticket: category (billing/bug/feature/account), urgency (high/medium/low), sentiment. Draft a helpful, empathetic reply. Output JSON: { category, urgency, sentiment, draft_reply }' } },
      { id: 'n3', type: 'action', label: 'Create Ticket in Notion', tool: 'Notion', position: { x: 300, y: 360 }, config: { message: 'Log ticket with classification, urgency, customer email, and AI draft' } },
      { id: 'n4', type: 'action', label: 'Notify Slack', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post to #support-queue with ticket details and urgency badge' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-content-publisher',
    name: 'Blog → Social Publisher',
    description: 'Turn a new blog post into Twitter, LinkedIn, and newsletter content automatically.',
    category: 'Marketing',
    icon: '📣',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Blog Post (RSS)', tool: 'Webhook', position: { x: 300, y: 80 }, config: { instructions: 'Triggered when new post is published; receives title, URL, summary' } },
      { id: 'n2', type: 'ai', label: 'Write Social Variants', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'From the blog title and summary, write: a punchy 280-char tweet, a professional 3-paragraph LinkedIn post, and a 2-sentence newsletter blurb. Output JSON: { tweet, linkedin, newsletter }' } },
      { id: 'n3', type: 'action', label: 'Save Drafts to Notion', tool: 'Notion', position: { x: 300, y: 360 }, config: { message: 'Create a content calendar row with all variants and post date' } },
      { id: 'n4', type: 'action', label: 'Notify Team on Slack', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post to #marketing with all draft variants and a "approve to publish" reaction prompt' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-daily-standup',
    name: 'Daily Standup Digest',
    description: 'Collect standup updates from Slack, summarize with AI, post a team digest.',
    category: 'HR & People',
    icon: '☀️',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Schedule: 9:30 AM Daily', tool: 'Schedule', position: { x: 300, y: 80 }, config: { schedule: '30 9 * * 1-5' } },
      { id: 'n2', type: 'action', label: 'Fetch #standup Messages', tool: 'Slack', position: { x: 300, y: 220 }, config: { message: 'Read last 24h messages from #standup channel' } },
      { id: 'n3', type: 'ai', label: 'Summarize Updates', tool: 'Claude AI', position: { x: 300, y: 360 }, config: { instructions: 'Summarize individual standup updates into a clean digest. Group by: Done Yesterday, Doing Today, Blockers. Format as bullet points per person. Keep it concise and scannable.' } },
      { id: 'n4', type: 'action', label: 'Post Digest to Slack', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post the AI-generated digest to #team-digest channel' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-invoice-processor',
    name: 'Invoice Processor',
    description: 'Extract invoice data with AI, validate amounts, log to Airtable, and alert finance.',
    category: 'Finance',
    icon: '🧾',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Email with Invoice PDF', tool: 'Gmail', position: { x: 300, y: 80 }, config: { instructions: 'Triggered by emails with "invoice" in subject and PDF attachment' } },
      { id: 'n2', type: 'ai', label: 'Extract Invoice Data', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Extract from the invoice: vendor name, invoice number, date, line items, subtotal, tax, total. Output structured JSON. Flag if total > $10,000.' } },
      { id: 'n3', type: 'action', label: 'Log to Airtable', tool: 'Airtable', position: { x: 300, y: 360 }, config: { message: 'Create a row in Invoices table with extracted fields and "Pending Approval" status' } },
      { id: 'n4', type: 'action', label: 'Notify Finance on Slack', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post invoice summary to #finance-approvals, tag approver if total > $10k' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-onboarding-sequence',
    name: 'Employee Onboarding',
    description: 'Auto-trigger onboarding tasks, welcome email, and Slack intro when a hire is added.',
    category: 'HR & People',
    icon: '👋',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Hire Added to Notion', tool: 'Notion', position: { x: 300, y: 80 }, config: { instructions: 'Triggered when a new row is added to the Employees database' } },
      { id: 'n2', type: 'ai', label: 'Generate Welcome Message', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Write a warm, personalized welcome message for the new hire. Include their role, start date, team name, and a fun fact about company culture. Keep it 2 short paragraphs.' } },
      { id: 'n3', type: 'action', label: 'Send Welcome Email', tool: 'Gmail', position: { x: 120, y: 360 }, config: { message: 'Send personalized welcome email with first-week schedule and links to key docs' } },
      { id: 'n4', type: 'action', label: 'Intro in Slack #general', tool: 'Slack', position: { x: 480, y: 360 }, config: { message: 'Post a friendly intro for the new hire with their role and photo' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n2', target: 'n4' },
    ],
  },
  {
    id: 'wf-review-monitor',
    name: 'Review Monitor & Responder',
    description: 'Watch for new reviews, analyze sentiment, draft personalized responses with AI.',
    category: 'Customer Support',
    icon: '⭐',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'New Review Webhook', tool: 'Webhook', position: { x: 300, y: 80 }, config: { instructions: 'Receives review: platform, rating (1-5), reviewer name, review text' } },
      { id: 'n2', type: 'ai', label: 'Analyze & Draft Response', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Analyze sentiment and key themes. Draft a professional, empathetic response. For negative reviews (1-2★): apologize and offer to resolve. For positive (4-5★): thank and reinforce highlights. Output: { sentiment, themes[], draft_response }' } },
      { id: 'n3', type: 'action', label: 'Log to Airtable', tool: 'Airtable', position: { x: 300, y: 360 }, config: { message: 'Log review with sentiment score, themes, and draft response for team review' } },
      { id: 'n4', type: 'action', label: 'Alert Slack if 1-2★', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post to #reputation-management if rating ≤ 2 stars for urgent human review' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-weekly-report',
    name: 'Weekly KPI Report',
    description: 'Pull metrics from multiple sources, compile with AI, and email a polished report.',
    category: 'Operations',
    icon: '📊',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Schedule: Every Friday 5 PM', tool: 'Schedule', position: { x: 300, y: 80 }, config: { schedule: '0 17 * * 5' } },
      { id: 'n2', type: 'action', label: 'Fetch Metrics from Airtable', tool: 'Airtable', position: { x: 300, y: 220 }, config: { message: 'Query this week\'s KPI table: revenue, signups, churn, NPS, support tickets' } },
      { id: 'n3', type: 'ai', label: 'Write Executive Summary', tool: 'Claude AI', position: { x: 300, y: 360 }, config: { instructions: 'Given this week\'s metrics vs last week, write a concise executive summary. Highlight wins, concerns, and one recommendation. Format with emoji bullets, keep under 300 words.' } },
      { id: 'n4', type: 'action', label: 'Email Report to Leadership', tool: 'Gmail', position: { x: 300, y: 500 }, config: { message: 'Send weekly report email to team leads with metrics table and AI summary' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-github-notifier',
    name: 'GitHub PR Notifier',
    description: 'When a PR is opened, summarize the diff with AI and notify the team on Slack.',
    category: 'Dev & IT',
    icon: '🔀',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'GitHub PR Opened', tool: 'Webhook', position: { x: 300, y: 80 }, config: { instructions: 'GitHub webhook: pull_request.opened event with title, author, diff summary' } },
      { id: 'n2', type: 'ai', label: 'Summarize PR', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Summarize the pull request in 3 bullet points: what changed, why it matters, what reviewers should focus on. Keep it under 100 words. Use technical language.' } },
      { id: 'n3', type: 'action', label: 'Notify Slack #engineering', tool: 'Slack', position: { x: 300, y: 360 }, config: { message: 'Post PR notification with author, title, AI summary, and direct link to review' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'wf-competitor-monitor',
    name: 'Competitor Monitor',
    description: 'Track competitor pricing pages weekly, detect changes with AI, alert the team.',
    category: 'Marketing',
    icon: '🔍',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Schedule: Every Monday 8 AM', tool: 'Schedule', position: { x: 300, y: 80 }, config: { schedule: '0 8 * * 1' } },
      { id: 'n2', type: 'action', label: 'Fetch Competitor Pages', tool: 'Webhook', position: { x: 300, y: 220 }, config: { message: 'Fetch content from competitor pricing/feature pages via URLs stored in Airtable' } },
      { id: 'n3', type: 'ai', label: 'Detect Changes & Insights', tool: 'Claude AI', position: { x: 300, y: 360 }, config: { instructions: 'Compare current and previous page content. Identify: pricing changes, new features, messaging shifts, removed features. Rate significance 1-10. Output JSON: { changes[], significance, recommendation }' } },
      { id: 'n4', type: 'action', label: 'Post to Slack #competitive', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post weekly competitive intelligence summary, only if significance > 5' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-contract-reviewer',
    name: 'Contract Reviewer',
    description: 'Receive contracts via email, extract key terms with AI, flag risks, log to Notion.',
    category: 'Operations',
    icon: '📄',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Contract Email Received', tool: 'Gmail', position: { x: 300, y: 80 }, config: { instructions: 'Triggered by emails with "contract" or "agreement" in subject with PDF attachment' } },
      { id: 'n2', type: 'ai', label: 'Extract & Review Contract', tool: 'Claude AI', position: { x: 300, y: 220 }, config: { instructions: 'Extract: parties, effective date, term length, payment terms, termination clauses, liability caps, IP ownership. Flag any unusual or risky clauses. Output JSON: { parties, term, payment, risks[], red_flags[], summary }' } },
      { id: 'n3', type: 'action', label: 'Log to Notion', tool: 'Notion', position: { x: 300, y: 360 }, config: { message: 'Create contract record with extracted terms, risk summary, and "Needs Legal Review" tag if red flags exist' } },
      { id: 'n4', type: 'action', label: 'Notify Legal Team', tool: 'Slack', position: { x: 300, y: 500 }, config: { message: 'Post to #legal-queue with contract summary and flag count; ping legal lead if red flags > 2' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'wf-churn-alert',
    name: 'Churn Risk Alert',
    description: 'Identify at-risk users from usage data, score with AI, trigger outreach automatically.',
    category: 'Sales',
    icon: '🚨',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Schedule: Daily 7 AM', tool: 'Schedule', position: { x: 300, y: 80 }, config: { schedule: '0 7 * * *' } },
      { id: 'n2', type: 'action', label: 'Query At-Risk Users', tool: 'Airtable', position: { x: 300, y: 220 }, config: { message: 'Fetch users with: no login in 14+ days, declining usage, or recent support complaints' } },
      { id: 'n3', type: 'ai', label: 'Score Churn Risk', tool: 'Claude AI', position: { x: 300, y: 360 }, config: { instructions: 'For each user, analyze login frequency, feature adoption, support history, and plan tier. Score churn risk 1-10 and suggest intervention: re-engagement email, offer, CSM call, or no action. Output JSON per user: { user_id, score, reason, action }' } },
      { id: 'n4', type: 'action', label: 'Create Outreach Tasks', tool: 'HubSpot', position: { x: 300, y: 500 }, config: { message: 'Create CRM tasks for users with score ≥ 7, assigned to CSM with suggested action and context' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
]
