import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MCP_MANIFEST = {
  name: 'wyber-ai',
  version: '1.0.0',
  description: 'Build full-stack apps from plain English using WyberAi',
  tools: [
    {
      name: 'create_project',
      description: 'Create a new WyberAi project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          framework: { type: 'string', enum: ['next', 'react-vite', 'vue', 'vanilla'], description: 'Framework (default: next)' },
          description: { type: 'string', description: 'What you want to build' },
        },
        required: ['name'],
      },
    },
    {
      name: 'send_message',
      description: 'Send a build message to a WyberAi project',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          message: { type: 'string', description: 'What to build or change' },
        },
        required: ['project_id', 'message'],
      },
    },
    {
      name: 'list_projects',
      description: 'List all projects in your WyberAi workspace',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_project',
      description: 'Get details of a specific project',
      inputSchema: {
        type: 'object',
        properties: { project_id: { type: 'string' } },
        required: ['project_id'],
      },
    },
    {
      name: 'publish_project',
      description: 'Publish a project to projectname.wyberai.app',
      inputSchema: {
        type: 'object',
        properties: { project_id: { type: 'string' } },
        required: ['project_id'],
      },
    },
  ],
};

export async function GET() {
  return NextResponse.json(MCP_MANIFEST);
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!apiKey) return NextResponse.json({ error: 'API key required. Get yours at wyberai.com/api-keys' }, { status: 401 });

    const supabase = await createClient();
    const { data: keyData } = await supabase.from('api_keys').select('user_id, active').eq('key', apiKey).single();
    if (!keyData?.active) return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });

    const { tool, input } = await req.json();

    switch (tool) {
      case 'list_projects': {
        const { data } = await supabase.from('projects').select('id, name, framework, published_url, deployed_url, updated_at').eq('user_id', keyData.user_id).order('updated_at', { ascending: false }).limit(20);
        return NextResponse.json({ projects: data || [] });
      }
      case 'create_project': {
        const { data } = await supabase.from('projects').insert({ name: input.name, framework: input.framework || 'next', description: input.description, user_id: keyData.user_id }).select('id, name, framework').single();
        return NextResponse.json({ project: data, message: `Project "${input.name}" created. Use send_message to start building.` });
      }
      case 'get_project': {
        const { data } = await supabase.from('projects').select('*').eq('id', input.project_id).eq('user_id', keyData.user_id).single();
        if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        return NextResponse.json({ project: { id: data.id, name: data.name, framework: data.framework, published_url: data.published_url, file_count: Object.keys(data.files || {}).length, updated_at: data.updated_at } });
      }
      case 'send_message': {
        const { data } = await supabase.from('mcp_messages').insert({ project_id: input.project_id, user_id: keyData.user_id, message: input.message, status: 'queued' }).select('id').single();
        return NextResponse.json({ message_id: data?.id, status: 'queued', note: 'Message queued. Open wyberai.com to see the result.' });
      }
      case 'publish_project': {
        const res = await fetch(`${req.nextUrl.origin}/api/publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: input.project_id }) });
        return NextResponse.json(await res.json());
      }
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}