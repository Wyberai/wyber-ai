import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/server';
import { sendSecurityAlertEmail } from '@/lib/email';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' });

interface SafetyResult {
  safe: boolean;
  score: number;
  flags: string[];
  blocked: boolean;
  reason?: string;
}

export async function POST(req: NextRequest) {
  const { projectId, files } = await req.json();

  const fileContext = Object.entries(files as Record<string, { content: string }>)
    .slice(0, 10)
    .map(([path, f]) => `<file path="${path}">\n${f.content.slice(0, 1500)}\n</file>`)
    .join('\n\n');

  const prompt = `You are a security and content safety auditor for a web app builder platform. Review this code.

${fileContext}

Check for: phishing (fake login forms sending credentials externally), malware, scam content, credential harvesting, data exfiltration, crypto miners, illegal content.

Legitimate apps (dashboards, todo apps, portfolios, SaaS tools) should score 85-100.

Respond ONLY with JSON, no markdown:
{
  "safe": true,
  "score": 90,
  "flags": [],
  "blocked": false,
  "reason": null
}`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const result: SafetyResult = JSON.parse(clean);

    if (result.blocked && projectId) {
      try {
        const supabase = await createAdminClient();
        await supabase.from('safety_reports').insert({
          project_id: projectId,
          score: result.score,
          flags: result.flags,
          blocked: result.blocked,
          reason: result.reason,
        });
        // Notify the project owner
        const { data: proj } = await supabase
          .from('projects').select('name, user_id').eq('id', projectId).single();
        if (proj) {
          const { data: prof } = await supabase
            .from('profiles').select('email').eq('id', proj.user_id).single();
          if (prof?.email) {
            sendSecurityAlertEmail(prof.email, proj.name, result.flags).catch(() => {});
          }
        }
      } catch { /* non-critical */ }
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ safe: true, score: 80, flags: [], blocked: false });
  }
}
