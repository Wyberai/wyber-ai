import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' });

export async function POST(req: NextRequest) {
  const { prompt, framework, fileContext } = await req.json();

  const systemPrompt = `You are an expert software architect. Analyze the user's request and create a concise implementation plan BEFORE writing any code.

Output ONLY a JSON object, no markdown:
{
  "title": "Brief title of what's being built",
  "complexity": "simple|medium|complex",
  "estimatedCredits": 1,
  "steps": [
    {
      "id": "1",
      "title": "Step title",
      "description": "What this step does",
      "files": ["files that will be created/modified"],
      "type": "create|modify|delete"
    }
  ],
  "warnings": ["any potential issues or things to be aware of"],
  "approach": "Brief sentence on the technical approach"
}

Keep steps to 3-6 maximum. Be specific about file names. estimatedCredits is 1 for simple, 2 for medium, 3 for complex.`;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: fileContext
          ? `Current project:\n${fileContext.slice(0, 3000)}\n\nUser wants to: ${prompt}`
          : `User wants to: ${prompt}`
      }]
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(clean);
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
