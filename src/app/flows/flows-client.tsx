'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Flow { id: string; name: string; description: string; is_active: boolean; run_count: number; updated_at: string; nodes: unknown[] }

const SKY = '#0EA5E9'
const BORDER = 'rgba(255,255,255,0.06)'
const MUTED = '#52525b'
const SURFACE = '#111118'

// ── Starter templates ──────────────────────────────────────────────────────────
interface Template {
  name: string
  description: string
  category: string
  icon: string
  nodes: unknown[]
  edges: unknown[]
}

const TEMPLATES: Template[] = [
  // Sales & GTM
  {
    name: 'Lead enrichment → CRM sync',
    description: 'New lead comes in → enrich with company data → push to HubSpot',
    category: 'Sales', icon: '🎯',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'New lead webhook', subtitle: 'Fires when a lead fills a form', config: {}, status: 'idle' } },
      { id: 'transform-1', type: 'transform', position: { x: 360, y: 200 }, data: { label: 'Extract fields', subtitle: 'Parse email, name, company', config: { op: 'map', mapping: '{"email":"{{webhook.body.email}}","company":"{{webhook.body.company}}"}' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 200 }, data: { label: 'CRM sync', subtitle: 'Push to HubSpot', config: { mode: 'composio', toolkit: 'HUBSPOT' }, status: 'idle' } },
      { id: 'output-1', type: 'output', position: { x: 920, y: 200 }, data: { label: 'Done', subtitle: 'Lead saved in CRM', config: {}, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'transform-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'transform-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'tool-1', target: 'output-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Daily outreach digest',
    description: 'Every morning: pull CRM tasks due today → summarise with AI → send Slack digest',
    category: 'Sales', icon: '📨',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'Daily 8 AM', subtitle: '', config: { type: 'schedule', cron_expression: '0 8 * * *' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Fetch CRM tasks', subtitle: '', config: { mode: 'composio', toolkit: 'HUBSPOT' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 640, y: 200 }, data: { label: 'Summarise tasks', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Summarise these CRM tasks into a crisp morning briefing. List the top 3 priority actions.' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 200 }, data: { label: 'Send to Slack', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Demo request → calendar invite',
    description: 'Form submission → AI qualifies the lead → books Calendly slot → confirms via email',
    category: 'Sales', icon: '📅',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Demo form webhook', subtitle: '', config: {}, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Qualify lead', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Score this lead 1-10. If score >= 7, output JSON {qualified: true}. Otherwise {qualified: false, reason: "..."}.' }, status: 'idle' } },
      { id: 'condition-1', type: 'condition', position: { x: 640, y: 200 }, data: { label: 'Is qualified?', subtitle: '', config: { rule: 'qualified === true' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 920, y: 120 }, data: { label: 'Send calendar link', subtitle: '', config: { mode: 'http', method: 'POST', url: 'https://api.calendly.com/scheduling_links' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 280 }, data: { label: 'Send nurture email', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'condition-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'condition-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e4', source: 'condition-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },

  // Customer support
  {
    name: 'Support ticket triage',
    description: 'New support email → AI classifies priority → routes to right Slack channel',
    category: 'Support', icon: '🎫',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'New Gmail email', subtitle: '', config: { type: 'email' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Classify & prioritise', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Classify this support email. Output JSON: {priority: "urgent"|"normal"|"low", category: "billing"|"bug"|"feature"|"other", summary: "one sentence"}' }, status: 'idle' } },
      { id: 'condition-1', type: 'condition', position: { x: 640, y: 200 }, data: { label: 'Urgent?', subtitle: '', config: { rule: 'priority === "urgent"' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 920, y: 120 }, data: { label: 'Alert #urgent-support', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 280 }, data: { label: 'Add to #support', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'condition-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'condition-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e4', source: 'condition-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'AI first-reply drafter',
    description: 'Support email arrives → AI drafts a personalised reply → saves as Gmail draft for review',
    category: 'Support', icon: '✍️',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'New Gmail email', subtitle: '', config: { type: 'email' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Draft reply', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Write a friendly, helpful reply to this support email. Be concise. Sign off as "The Wyber Team".' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 200 }, data: { label: 'Save as Gmail draft', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
      { id: 'output-1', type: 'output', position: { x: 920, y: 200 }, data: { label: 'Draft ready', subtitle: 'Review before sending', config: {}, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'tool-1', target: 'output-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },

  // Content & Marketing
  {
    name: 'Publish blog → share everywhere',
    description: 'Webhook when blog publishes → AI writes social posts → posts to LinkedIn + X',
    category: 'Marketing', icon: '📢',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'CMS publish webhook', subtitle: '', config: {}, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Write social posts', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Write 3 social posts for this blog article: (1) LinkedIn — professional, 150 words, (2) X/Twitter — punchy, under 280 chars, (3) Short teaser for email. Output as JSON {linkedin, twitter, email_teaser}.' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 120 }, data: { label: 'Post to LinkedIn', subtitle: '', config: { mode: 'composio', toolkit: 'LINKEDIN' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 640, y: 280 }, data: { label: 'Post to X', subtitle: '', config: { mode: 'composio', toolkit: 'TWITTER' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Weekly competitor monitor',
    description: 'Every Monday: check competitor news → AI summarises changes → Slack report',
    category: 'Marketing', icon: '🔭',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'Every Monday 9 AM', subtitle: '', config: { type: 'schedule', cron_expression: '0 9 * * 1' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Fetch competitor pages', subtitle: '', config: { mode: 'http', method: 'GET', url: 'https://r.jina.ai/https://competitor.com/blog' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 640, y: 200 }, data: { label: 'Analyse changes', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Summarise the most important competitor updates this week. What new features, pricing changes, or messaging shifts do you notice? Be specific and actionable.' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 200 }, data: { label: 'Post to Slack', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },

  // Data & Ops
  {
    name: 'Error alert → Slack + Linear ticket',
    description: 'Webhook from error tracker → AI analyses root cause → creates Linear ticket + Slack alert',
    category: 'Ops', icon: '🚨',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Error webhook', subtitle: '', config: {}, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Analyse error', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Analyse this error. Output JSON: {severity: "critical"|"high"|"medium", root_cause: "...", fix_suggestion: "...", title: "concise ticket title"}' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 120 }, data: { label: 'Create Linear ticket', subtitle: '', config: { mode: 'composio', toolkit: 'LINEAR' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 640, y: 280 }, data: { label: 'Alert Slack', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Daily metrics email',
    description: 'Every morning: pull key metrics from your DB → AI writes a concise CEO digest → email',
    category: 'Ops', icon: '📊',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'Daily 7 AM', subtitle: '', config: { type: 'schedule', cron_expression: '0 7 * * *' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Fetch metrics API', subtitle: '', config: { mode: 'http', method: 'GET', url: 'https://your-api.com/metrics' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 640, y: 200 }, data: { label: 'Write digest', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Write a concise daily metrics digest for the CEO. Highlight notable changes vs yesterday. Flag anything requiring action. Keep it under 150 words.' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 200 }, data: { label: 'Send email', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Stripe payment → Slack + Notion',
    description: 'New Stripe payment → log to Notion revenue tracker → celebrate in Slack',
    category: 'Ops', icon: '💳',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Stripe webhook', subtitle: 'payment_intent.succeeded', config: {}, status: 'idle' } },
      { id: 'transform-1', type: 'transform', position: { x: 360, y: 200 }, data: { label: 'Extract payment data', subtitle: '', config: { op: 'map', mapping: '{"amount":"{{webhook.body.data.object.amount}}","customer":"{{webhook.body.data.object.customer}}"}' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 120 }, data: { label: 'Log to Notion', subtitle: '', config: { mode: 'composio', toolkit: 'NOTION' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 640, y: 280 }, data: { label: 'Celebrate in Slack', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'transform-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'transform-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'transform-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'GitHub PR review summary',
    description: 'New GitHub PR opened → AI reviews and posts a summary comment on the PR',
    category: 'Engineering', icon: '🔍',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'GitHub webhook', subtitle: 'pull_request.opened', config: {}, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Fetch PR diff', subtitle: '', config: { mode: 'composio', toolkit: 'GITHUB' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 640, y: 200 }, data: { label: 'Review code', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Review this PR diff. Comment on: (1) potential bugs, (2) security issues, (3) performance concerns, (4) what looks good. Be constructive and specific.' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 200 }, data: { label: 'Post PR comment', subtitle: '', config: { mode: 'composio', toolkit: 'GITHUB' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'User signup onboarding sequence',
    description: 'New user signs up → wait 1 day → send welcome email → wait 3 days → send tips email',
    category: 'Product', icon: '🚀',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Signup webhook', subtitle: '', config: {}, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Send welcome email', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
      { id: 'delay-1', type: 'delay', position: { x: 640, y: 200 }, data: { label: 'Wait 3 days', subtitle: '', config: { amount: '3', unit: 'days' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 920, y: 200 }, data: { label: 'Send tips email', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'delay-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'delay-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Meeting notes → action items',
    description: 'Receive meeting transcript → AI extracts action items → creates Notion tasks → emails attendees',
    category: 'Productivity', icon: '📝',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Transcript webhook', subtitle: 'From Otter.ai, Fireflies, etc.', config: {}, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 360, y: 200 }, data: { label: 'Extract action items', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'Extract action items from this meeting transcript. For each item output: {owner, task, due_date, priority}. Return a JSON array.' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 120 }, data: { label: 'Create Notion tasks', subtitle: '', config: { mode: 'composio', toolkit: 'NOTION' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 640, y: 280 }, data: { label: 'Email summary', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'aiagent-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Invoice → payment reminder loop',
    description: 'Invoice sent → wait 7 days → check if paid → if not, send reminder → repeat twice',
    category: 'Finance', icon: '💰',
    nodes: [
      { id: 'trigger-1', type: 'webhook', position: { x: 80, y: 200 }, data: { label: 'Invoice sent', subtitle: '', config: {}, status: 'idle' } },
      { id: 'delay-1', type: 'delay', position: { x: 360, y: 200 }, data: { label: 'Wait 7 days', subtitle: '', config: { amount: '7', unit: 'days' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 640, y: 200 }, data: { label: 'Check payment status', subtitle: '', config: { mode: 'http', method: 'GET', url: 'https://api.stripe.com/v1/invoices/{{trigger.invoice_id}}' }, status: 'idle' } },
      { id: 'condition-1', type: 'condition', position: { x: 920, y: 200 }, data: { label: 'Paid?', subtitle: '', config: { rule: 'status === "paid"' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 1200, y: 280 }, data: { label: 'Send reminder', subtitle: '', config: { mode: 'composio', toolkit: 'GMAIL' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'delay-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'delay-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'tool-1', target: 'condition-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e4', source: 'condition-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
  {
    name: 'Churn risk alert',
    description: 'Daily: find users with low usage → score churn risk with AI → alert CSM in Slack',
    category: 'Product', icon: '⚠️',
    nodes: [
      { id: 'trigger-1', type: 'trigger', position: { x: 80, y: 200 }, data: { label: 'Daily 9 AM', subtitle: '', config: { type: 'schedule', cron_expression: '0 9 * * *' }, status: 'idle' } },
      { id: 'tool-1', type: 'tool', position: { x: 360, y: 200 }, data: { label: 'Fetch low-usage users', subtitle: '', config: { mode: 'http', method: 'GET', url: 'https://your-api.com/users?last_active_days_ago=7' }, status: 'idle' } },
      { id: 'aiagent-1', type: 'aiagent', position: { x: 640, y: 200 }, data: { label: 'Score churn risk', subtitle: '', config: { model: 'claude-sonnet-4-6', instructions: 'For each user, output a churn risk score 1-10 and the top reason. Return JSON array. Flag anyone above 7 as high risk.' }, status: 'idle' } },
      { id: 'condition-1', type: 'condition', position: { x: 920, y: 200 }, data: { label: 'Any high risk?', subtitle: '', config: { rule: 'high_risk_count > 0' }, status: 'idle' } },
      { id: 'tool-2', type: 'tool', position: { x: 1200, y: 200 }, data: { label: 'Alert CSM in Slack', subtitle: '', config: { mode: 'composio', toolkit: 'SLACK' }, status: 'idle' } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'tool-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e2', source: 'tool-1', target: 'aiagent-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e3', source: 'aiagent-1', target: 'condition-1', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
      { id: 'e4', source: 'condition-1', target: 'tool-2', animated: true, style: { stroke: SKY, strokeWidth: 2 } },
    ],
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))]

// ── Component ──────────────────────────────────────────────────────────────────
export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'my-flows' | 'templates'>('my-flows')
  const [catFilter, setCatFilter] = useState('All')
  const [creating, setCreating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/flows').then(r => {
      if (r.status === 401) { router.push('/login'); return r.json() }
      return r.json()
    }).then(d => { if (d) { setFlows(d.flows || []); setLoading(false) } })
  }, [router])

  const createFlow = async () => {
    setCreating('blank')
    const res = await fetch('/api/flows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'New Automation', description: '' }) })
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    if (data.flow?.id) router.push('/flows/' + data.flow.id)
    setCreating(null)
  }

  const createFromTemplate = async (tpl: Template) => {
    setCreating(tpl.name)
    const res = await fetch('/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tpl.name, description: tpl.description, nodes: tpl.nodes, edges: tpl.edges }),
    })
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    if (data.flow?.id) router.push('/flows/' + data.flow.id)
    setCreating(null)
  }

  const filtered = catFilter === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === catFilter)

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: tab === id ? SKY : 'transparent', color: tab === id ? '#fff' : MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
    >{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f5', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>← Dashboard</Link>
          <span style={{ color: BORDER }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Automations</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 3, gap: 2, marginLeft: 8 }}>
            {tabBtn('my-flows', 'My flows')}
            {tabBtn('templates', 'Templates')}
          </div>
          <button
            onClick={createFlow}
            disabled={!!creating}
            style={{ marginLeft: 'auto', padding: '7px 18px', borderRadius: 8, border: 'none', background: SKY, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {creating === 'blank' ? 'Creating…' : '+ Blank flow'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>

        {/* My flows tab */}
        {tab === 'my-flows' && (
          loading ? <div style={{ color: MUTED }}>Loading...</div> : flows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Build your first automation</div>
              <div style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>Start from a template or build from scratch</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={createFlow} style={{ padding: '11px 24px', borderRadius: 8, border: 'none', background: SKY, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Blank flow</button>
                <button onClick={() => setTab('templates')} style={{ padding: '11px 24px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Browse templates →</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {flows.map(flow => (
                <Link key={flow.id} href={'/flows/' + flow.id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = BORDER}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5', flex: 1 }}>{flow.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: flow.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', color: flow.is_active ? '#22c55e' : MUTED, fontWeight: 700 }}>{flow.is_active ? 'ACTIVE' : 'DRAFT'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{flow.description || 'No description'}</div>
                    <div style={{ fontSize: 11, color: '#3f3f46' }}>{(flow.nodes || []).length} steps · {flow.run_count} runs</div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Templates tab */}
        {tab === 'templates' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${catFilter === cat ? SKY : BORDER}`, background: catFilter === cat ? 'rgba(14,165,233,0.1)' : 'transparent', color: catFilter === cat ? SKY : MUTED, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >{cat}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {filtered.map(tpl => (
                <div key={tpl.name} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{tpl.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5', marginBottom: 3 }}>{tpl.name}</div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{tpl.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', color: MUTED, fontWeight: 600 }}>{tpl.category}</span>
                    <span style={{ fontSize: 11, color: '#3f3f46' }}>{tpl.nodes.length} steps</span>
                    <button
                      onClick={() => createFromTemplate(tpl)}
                      disabled={creating === tpl.name}
                      style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 7, border: 'none', background: SKY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {creating === tpl.name ? 'Creating…' : 'Use template →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
