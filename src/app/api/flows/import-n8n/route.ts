import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── n8n JSON types ────────────────────────────────────────────────────────────
interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  disabled?: boolean;
}

// connections: { [sourceNodeName]: { main: [[{node: targetName, type:'main', index:0}]] } }
type N8nConnections = Record<string, { main?: Array<Array<{ node: string; type: string; index: number }>> }>;

interface N8nWorkflow {
  name?: string;
  nodes: N8nNode[];
  connections: N8nConnections;
}

// ── Wyber canvas types ────────────────────────────────────────────────────────
interface WyberNode {
  id: string;
  type: 'trigger' | 'aiagent' | 'tool' | 'condition' | 'output';
  position: { x: number; y: number };
  data: {
    label: string;
    subtitle?: string;
    config: Record<string, unknown>;
    status: 'idle';
    toolId?: string;
  };
}

interface WyberEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  style: { stroke: string; strokeWidth: number };
}

// ── Node-type registry ────────────────────────────────────────────────────────
// Maps n8n node type → { wyberType, toolId, label }
const N8N_TYPE_MAP: Record<string, { wyberType: WyberNode['type']; toolId?: string; label: string }> = {
  // Triggers / start
  'n8n-nodes-base.manualTrigger':             { wyberType: 'trigger', label: 'Manual Trigger' },
  'n8n-nodes-base.scheduleTrigger':           { wyberType: 'trigger', label: 'Schedule Trigger' },
  'n8n-nodes-base.webhook':                   { wyberType: 'trigger', label: 'Webhook Trigger' },
  'n8n-nodes-base.formTrigger':               { wyberType: 'trigger', label: 'Form Trigger' },
  'n8n-nodes-base.emailReadImap':             { wyberType: 'trigger', label: 'Email Trigger (IMAP)' },
  'n8n-nodes-base.gmailTrigger':              { wyberType: 'trigger', toolId: 'gmail', label: 'Gmail Trigger' },
  'n8n-nodes-base.slackTrigger':              { wyberType: 'trigger', toolId: 'slack', label: 'Slack Trigger' },
  'n8n-nodes-base.airtableTrigger':           { wyberType: 'trigger', toolId: 'airtable', label: 'Airtable Trigger' },
  'n8n-nodes-base.hubspotTrigger':            { wyberType: 'trigger', toolId: 'hubspot', label: 'HubSpot Trigger' },
  'n8n-nodes-base.typeformTrigger':           { wyberType: 'trigger', toolId: 'typeform', label: 'Typeform Trigger' },
  'n8n-nodes-base.githubTrigger':             { wyberType: 'trigger', toolId: 'github', label: 'GitHub Trigger' },
  'n8n-nodes-base.stripeTrigger':             { wyberType: 'trigger', toolId: 'stripe', label: 'Stripe Trigger' },
  'n8n-nodes-base.calendarTrigger':           { wyberType: 'trigger', toolId: 'google_calendar', label: 'Calendar Trigger' },
  'n8n-nodes-base.notionTrigger':             { wyberType: 'trigger', toolId: 'notion', label: 'Notion Trigger' },
  'n8n-nodes-base.linearTrigger':             { wyberType: 'trigger', toolId: 'linear', label: 'Linear Trigger' },
  'n8n-nodes-base.jiraTrigger':               { wyberType: 'trigger', toolId: 'jira', label: 'Jira Trigger' },
  'n8n-nodes-base.intercomTrigger':           { wyberType: 'trigger', toolId: 'intercom', label: 'Intercom Trigger' },

  // AI / LLM
  '@n8n/n8n-nodes-langchain.openAi':          { wyberType: 'aiagent', label: 'AI Agent (GPT)' },
  '@n8n/n8n-nodes-langchain.lmChatOpenAi':    { wyberType: 'aiagent', label: 'AI Chat (GPT)' },
  '@n8n/n8n-nodes-langchain.lmChatAnthropic': { wyberType: 'aiagent', label: 'AI Agent (Claude)' },
  '@n8n/n8n-nodes-langchain.agent':           { wyberType: 'aiagent', label: 'AI Agent' },
  '@n8n/n8n-nodes-langchain.chainLlm':        { wyberType: 'aiagent', label: 'LLM Chain' },
  '@n8n/n8n-nodes-langchain.chainSummarize':  { wyberType: 'aiagent', label: 'Summarize' },
  '@n8n/n8n-nodes-langchain.chainRetrievalQa':{ wyberType: 'aiagent', label: 'Q&A Chain' },
  '@n8n/n8n-nodes-langchain.textClassifier':  { wyberType: 'aiagent', label: 'Text Classifier' },
  '@n8n/n8n-nodes-langchain.sentimentAnalysis':{ wyberType: 'aiagent', label: 'Sentiment Analysis' },

  // Logic / control flow
  'n8n-nodes-base.if':                        { wyberType: 'condition', label: 'Condition (If)' },
  'n8n-nodes-base.switch':                    { wyberType: 'condition', label: 'Switch' },
  'n8n-nodes-base.filter':                    { wyberType: 'condition', label: 'Filter' },
  'n8n-nodes-base.wait':                      { wyberType: 'condition', label: 'Wait / Delay' },
  'n8n-nodes-base.merge':                     { wyberType: 'condition', label: 'Merge' },
  'n8n-nodes-base.splitInBatches':            { wyberType: 'condition', label: 'Split in Batches' },
  'n8n-nodes-base.splitOut':                  { wyberType: 'condition', label: 'Split Out' },
  'n8n-nodes-base.aggregate':                 { wyberType: 'condition', label: 'Aggregate' },
  'n8n-nodes-base.itemLists':                 { wyberType: 'condition', label: 'Item Lists' },

  // Comms
  'n8n-nodes-base.slack':                     { wyberType: 'tool', toolId: 'slack', label: 'Slack' },
  'n8n-nodes-base.gmail':                     { wyberType: 'tool', toolId: 'gmail', label: 'Gmail' },
  'n8n-nodes-base.emailSend':                 { wyberType: 'tool', toolId: 'email', label: 'Send Email' },
  'n8n-nodes-base.microsoftTeams':            { wyberType: 'tool', toolId: 'teams', label: 'Microsoft Teams' },
  'n8n-nodes-base.discord':                   { wyberType: 'tool', toolId: 'discord', label: 'Discord' },
  'n8n-nodes-base.telegram':                  { wyberType: 'tool', toolId: 'telegram', label: 'Telegram' },
  'n8n-nodes-base.twilio':                    { wyberType: 'tool', toolId: 'twilio', label: 'Twilio (SMS)' },
  'n8n-nodes-base.sendGrid':                  { wyberType: 'tool', toolId: 'sendgrid', label: 'SendGrid' },
  'n8n-nodes-base.mailchimp':                 { wyberType: 'tool', toolId: 'mailchimp', label: 'Mailchimp' },

  // CRM / sales
  'n8n-nodes-base.hubspot':                   { wyberType: 'tool', toolId: 'hubspot', label: 'HubSpot' },
  'n8n-nodes-base.salesforce':                { wyberType: 'tool', toolId: 'salesforce', label: 'Salesforce' },
  'n8n-nodes-base.pipedrive':                 { wyberType: 'tool', toolId: 'pipedrive', label: 'Pipedrive' },
  'n8n-nodes-base.intercom':                  { wyberType: 'tool', toolId: 'intercom', label: 'Intercom' },
  'n8n-nodes-base.zendesk':                   { wyberType: 'tool', toolId: 'zendesk', label: 'Zendesk' },

  // Project / PM
  'n8n-nodes-base.notion':                    { wyberType: 'tool', toolId: 'notion', label: 'Notion' },
  'n8n-nodes-base.linear':                    { wyberType: 'tool', toolId: 'linear', label: 'Linear' },
  'n8n-nodes-base.jira':                      { wyberType: 'tool', toolId: 'jira', label: 'Jira' },
  'n8n-nodes-base.asana':                     { wyberType: 'tool', toolId: 'asana', label: 'Asana' },
  'n8n-nodes-base.trello':                    { wyberType: 'tool', toolId: 'trello', label: 'Trello' },
  'n8n-nodes-base.clickUp':                   { wyberType: 'tool', toolId: 'clickup', label: 'ClickUp' },
  'n8n-nodes-base.monday':                    { wyberType: 'tool', toolId: 'monday', label: 'Monday.com' },

  // Data / spreadsheets
  'n8n-nodes-base.googleSheets':              { wyberType: 'tool', toolId: 'google_sheets', label: 'Google Sheets' },
  'n8n-nodes-base.airtable':                  { wyberType: 'tool', toolId: 'airtable', label: 'Airtable' },
  'n8n-nodes-base.microsoftExcel':            { wyberType: 'tool', toolId: 'excel', label: 'Microsoft Excel' },
  'n8n-nodes-base.supabase':                  { wyberType: 'tool', toolId: 'supabase', label: 'Supabase' },
  'n8n-nodes-base.postgres':                  { wyberType: 'tool', toolId: 'postgres', label: 'PostgreSQL' },
  'n8n-nodes-base.mysql':                     { wyberType: 'tool', toolId: 'mysql', label: 'MySQL' },
  'n8n-nodes-base.mongoDb':                   { wyberType: 'tool', toolId: 'mongodb', label: 'MongoDB' },

  // Storage / files
  'n8n-nodes-base.googleDrive':               { wyberType: 'tool', toolId: 'google_drive', label: 'Google Drive' },
  'n8n-nodes-base.dropbox':                   { wyberType: 'tool', toolId: 'dropbox', label: 'Dropbox' },
  'n8n-nodes-base.awsS3':                     { wyberType: 'tool', toolId: 's3', label: 'AWS S3' },
  'n8n-nodes-base.box':                       { wyberType: 'tool', toolId: 'box', label: 'Box' },
  'n8n-nodes-base.microsoftOneDrive':         { wyberType: 'tool', toolId: 'onedrive', label: 'OneDrive' },
  'n8n-nodes-base.sharePoint':                { wyberType: 'tool', toolId: 'sharepoint', label: 'SharePoint' },

  // Finance
  'n8n-nodes-base.stripe':                    { wyberType: 'tool', toolId: 'stripe', label: 'Stripe' },
  'n8n-nodes-base.quickbooks':                { wyberType: 'tool', toolId: 'quickbooks', label: 'QuickBooks' },
  'n8n-nodes-base.xero':                      { wyberType: 'tool', toolId: 'xero', label: 'Xero' },

  // Dev / engineering
  'n8n-nodes-base.github':                    { wyberType: 'tool', toolId: 'github', label: 'GitHub' },
  'n8n-nodes-base.gitlab':                    { wyberType: 'tool', toolId: 'gitlab', label: 'GitLab' },
  'n8n-nodes-base.httpRequest':               { wyberType: 'tool', toolId: 'http', label: 'HTTP Request' },
  'n8n-nodes-base.respondToWebhook':          { wyberType: 'output', label: 'Respond to Webhook' },
  'n8n-nodes-base.graphql':                   { wyberType: 'tool', toolId: 'graphql', label: 'GraphQL' },

  // Calendar / scheduling
  'n8n-nodes-base.googleCalendar':            { wyberType: 'tool', toolId: 'google_calendar', label: 'Google Calendar' },
  'n8n-nodes-base.microsoftOutlook':          { wyberType: 'tool', toolId: 'outlook', label: 'Outlook' },
  'n8n-nodes-base.calendly':                  { wyberType: 'tool', toolId: 'calendly', label: 'Calendly' },

  // Social / marketing
  'n8n-nodes-base.twitter':                   { wyberType: 'tool', toolId: 'twitter', label: 'Twitter/X' },
  'n8n-nodes-base.linkedIn':                  { wyberType: 'tool', toolId: 'linkedin', label: 'LinkedIn' },

  // Utility / output
  'n8n-nodes-base.set':                       { wyberType: 'output', label: 'Set / Transform' },
  'n8n-nodes-base.code':                      { wyberType: 'tool', toolId: 'code', label: 'Code' },
  'n8n-nodes-base.noOp':                      { wyberType: 'output', label: 'No Operation' },
  'n8n-nodes-base.stopAndError':              { wyberType: 'output', label: 'Stop & Error' },
  'n8n-nodes-base.executeWorkflow':           { wyberType: 'tool', label: 'Execute Sub-Workflow' },
  'n8n-nodes-base.function':                  { wyberType: 'tool', toolId: 'code', label: 'Function' },
  'n8n-nodes-base.functionItem':              { wyberType: 'tool', toolId: 'code', label: 'Function Item' },
};

// ── Conversion logic ──────────────────────────────────────────────────────────

const EDGE_COLORS: Record<WyberNode['type'], string> = {
  trigger: '#0EA5E9',
  aiagent: '#8b5cf6',
  tool: '#10b981',
  condition: '#f59e0b',
  output: '#6b7280',
};

function convertN8nToWyber(wf: N8nWorkflow): { nodes: WyberNode[]; edges: WyberEdge[] } {
  // Build name → Wyber node id map
  const nameToId: Record<string, string> = {};
  const wyberNodes: WyberNode[] = [];

  for (const n of wf.nodes) {
    if (n.disabled) continue;

    const mapping = N8N_TYPE_MAP[n.type];
    const wyberType: WyberNode['type'] = mapping?.wyberType ?? 'tool';
    const id = `${wyberType}-${n.id || n.name.replace(/\s+/g, '-').toLowerCase()}`;
    nameToId[n.name] = id;

    // Translate n8n [x,y] position to Wyber {x,y} — n8n uses pixel coords that are compatible
    const position = { x: (n.position?.[0] ?? 0), y: (n.position?.[1] ?? 0) };

    // Extract a human-readable subtitle from common parameters
    let subtitle: string | undefined;
    const p = n.parameters;
    if (p.resource && p.operation) subtitle = `${p.resource} → ${p.operation}`;
    else if (p.operation) subtitle = String(p.operation);
    else if (p.text) subtitle = String(p.text).slice(0, 80);

    wyberNodes.push({
      id,
      type: wyberType,
      position,
      data: {
        label: n.name,
        subtitle,
        config: { n8nType: n.type, parameters: n.parameters },
        status: 'idle',
        toolId: mapping?.toolId,
      },
    });
  }

  // BFS-style edge extraction from n8n connections map
  const wyberEdges: WyberEdge[] = [];
  const seen = new Set<string>();

  for (const [sourceName, outputs] of Object.entries(wf.connections ?? {})) {
    const sourceId = nameToId[sourceName];
    if (!sourceId) continue;

    const sourceType = wyberNodes.find(n => n.id === sourceId)?.type ?? 'tool';

    for (const outputSlots of Object.values(outputs ?? {})) {
      for (const slot of outputSlots ?? []) {
        for (const conn of slot ?? []) {
          const targetId = nameToId[conn.node];
          if (!targetId) continue;
          const edgeId = `e-${sourceId}-${targetId}`;
          if (seen.has(edgeId)) continue;
          seen.add(edgeId);

          wyberEdges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            animated: sourceType === 'trigger' || sourceType === 'aiagent',
            style: { stroke: EDGE_COLORS[sourceType], strokeWidth: 2 },
          });
        }
      }
    }
  }

  return { nodes: wyberNodes, edges: wyberEdges };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { workflow: N8nWorkflow; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workflow, name } = body;
  if (!workflow?.nodes || !Array.isArray(workflow.nodes)) {
    return NextResponse.json({ error: 'Not a valid n8n workflow export. Expected a JSON object with a "nodes" array.' }, { status: 400 });
  }

  const { nodes, edges } = convertN8nToWyber(workflow);
  if (nodes.length === 0) return NextResponse.json({ error: 'No nodes found in the workflow.' }, { status: 400 });

  const flowName = name || workflow.name || 'Imported n8n Workflow';

  const { data: flow, error } = await supabase
    .from('flows')
    .insert({ user_id: user.id, name: flowName, nodes, edges, is_active: false })
    .select('id, name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flow, nodeCount: nodes.length, edgeCount: edges.length });
}
