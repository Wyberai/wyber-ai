import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { MODEL_IDS, creditCost } from '@/lib/credits';
import { detectDeps } from '@/lib/detect-deps';
import { rateLimit } from '@/lib/rate-limit';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' });

// Shared icon vocabulary for both features and flow screens — a fixed enum
// (not freeform emoji from the model) keeps every plan visually consistent.
const ICONS = ['auth', 'dashboard', 'list', 'board', 'payment', 'settings', 'search', 'chat', 'calendar', 'profile', 'notification', 'upload', 'map', 'analytics', 'landing', 'other'] as const;

const QUESTIONS_SCHEMA = {
  type: 'object' as const,
  properties: {
    clarifyingQuestions: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          question: { type: 'string' as const },
          // 2-4 short, concrete answer options — so the user can pick instead
          // of always typing free text (mirrors how a good AskUserQuestion-
          // style option list is written: mutually distinct, no vague catch-alls).
          // The count itself is enforced only via the prompt below, NOT
          // minItems/maxItems here — Anthropic's structured-output schema
          // validator rejects any array minItems/maxItems other than 0 or 1
          // (confirmed live: "minItems values other than 0 or 1 are not
          // supported (got: [2, 5])"), so a numeric range here 400s every call.
          suggestions: { type: 'array' as const, items: { type: 'string' as const } },
        },
        required: ['question', 'suggestions'],
        additionalProperties: false,
      },
    },
  },
  required: ['clarifyingQuestions'],
  additionalProperties: false,
};

// Deliberately NO file paths / implementation detail anywhere in this schema —
// the plan speaks in features and tools, the way a user actually thinks about
// what they're building. Concrete files are the coding step's job, not the plan's.
const PLAN_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    complexity: { type: 'string' as const, enum: ['simple', 'medium', 'complex'] },
    estimatedCredits: { type: 'integer' as const },
    approach: { type: 'string' as const },
    features: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          title: { type: 'string' as const },
          description: { type: 'string' as const },
          icon: { type: 'string' as const, enum: ICONS },
        },
        required: ['id', 'title', 'description', 'icon'],
        additionalProperties: false,
      },
    },
    flow: {
      type: 'object' as const,
      properties: {
        // Ordered primary path a user takes through the app, entry point first.
        screens: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const },
              name: { type: 'string' as const },
              icon: { type: 'string' as const, enum: ICONS },
            },
            required: ['id', 'name', 'icon'],
            additionalProperties: false,
          },
        },
      },
      required: ['screens'],
      additionalProperties: false,
    },
    integrations: { type: 'array' as const, items: { type: 'string' as const } },
    warnings: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: ['title', 'complexity', 'estimatedCredits', 'approach', 'features', 'flow', 'integrations', 'warnings'],
  additionalProperties: false,
};

function knownDepsFor(prompt: string): string[] {
  const deps = detectDeps(prompt);
  const out: string[] = [];
  if (deps.needsSupabase) out.push('Supabase (auth + database)');
  if (deps.needsStripe) out.push('Stripe (payments)');
  for (const t of deps.composioTools) out.push(t);
  return out;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The clarifying-questions phase stays free (cheap Sonnet pass), but the
  // rate limit still applies to both phases so a scripted loop can't farm
  // unlimited paid AI calls.
  const { allowed } = rateLimit(`plan:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "You've hit the planning limit for this hour — try again shortly, or just describe what to build directly in chat." }, { status: 429 });
  }

  const { prompt, framework, fileContext, phase, answers } = await req.json();

  // The actual plan (phase 2) is a paid action: it's an Opus-tier,
  // thinking-enabled call. Deducted up front, refunded if the call fails —
  // same money invariant as /api/generate: never charge for nothing.
  let deducted = 0;
  const PLAN_COST = creditCost('plan', 'default');
  if (phase !== 'questions') {
    const admin = await createAdminClient();
    const { data: profile } = await admin.from('profiles').select('credits').eq('id', user.id).single();
    const balance = profile?.credits ?? 0;
    if (balance < PLAN_COST) {
      return NextResponse.json({
        error: `Not enough credits. A build plan costs ${PLAN_COST} credits and you have ${balance}.`,
        needed: PLAN_COST, balance,
      }, { status: 402 });
    }
    // Atomic deduct via deduct_credits RPC — SET runs as `credits - PLAN_COST`
    // in Postgres, guarded by `credits >= PLAN_COST`, so two concurrent plan
    // requests with the same stale local balance can't both write balance - PLAN_COST.
    const { data: deductRpc, error: deductErr } = await admin.rpc('deduct_credits', { p_user_id: user.id, p_amount: PLAN_COST });
    if (deductErr || deductRpc?.new_credits === undefined) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }
    deducted = PLAN_COST;
    const newBalance = deductRpc.new_credits;
    admin.from('credit_usage').insert({
      user_id: user.id, amount: PLAN_COST, reason: 'plan',
      credits_before: newBalance + PLAN_COST, credits_after: newBalance,
    }).then(() => {}, () => {});
  }
  const refund = async (reason: string) => {
    if (deducted <= 0) return;
    const amount = deducted;
    deducted = 0;
    try {
      const admin = await createAdminClient();
      const { data: adjusted } = await admin.rpc('adjust_credits', { p_user_id: user.id, p_delta: amount });
      const after = typeof adjusted === 'number' ? adjusted : null;
      admin.from('credit_usage').insert({
        user_id: user.id, amount: -amount, reason: `refund:${reason}`,
        credits_before: after !== null ? after - amount : null, credits_after: after,
      }).then(() => {}, () => {});
    } catch (e) { console.error('[plan-refund] failed', e); }
  };

  try {
    // ── Phase 1: questions only ─────────────────────────────────────────
    // Fast, cheap pass whose only job is deciding whether the request needs
    // clarification before any planning happens — mirrors how a person would
    // actually respond ("what are you building?" then, if needed, "who's it
    // for / what matters most?" — THEN a plan), not one bundled form.
    if (phase === 'questions') {
      const systemPrompt = `You help scope a new app build by asking clarifying questions BEFORE any planning happens. If the request is genuinely ambiguous in a way that would materially change what gets built, ask short, concrete questions — but never ask just to seem thorough, and never for its own sake.

Scale how many questions to the ACTUAL scope of the request, not a fixed number every time:
- A small, already-clear request (e.g. "a habit tracker with streaks"): 0 questions.
- A request with some real ambiguity (e.g. "a CRM"): 1-3 questions covering the dimensions that would most change the build (who it's for, which feature matters most, scale).
- A large or enterprise-scale request (multiple departments/roles, integrations with existing systems, complex workflows): up to 5-6 questions is appropriate — a request this size deserves real discovery, not the same shallow pass as a weekend project. Prioritize the questions that would most reshape the plan (existing systems to integrate with, user roles/permissions, workflow depth, scale/volume) over generic ones.

Never exceed 6. If truly nothing needs clarifying, return an empty array.

For every question, also give EXACTLY 2 to 4 short, concrete, real-world answer options in "suggestions" (never 0, never more than 4) — mutually distinct, no vague catch-alls like "other" or "not sure" (the UI already offers a free-text field alongside your suggestions for anything that doesn't fit). Ground them in what's actually common for that domain, e.g. for "Who is this CRM for?": ["Real estate agents", "Freelance consultants", "B2B sales teams", "Recruiters"].`;
      const msg = await client.messages.create({
        model: MODEL_IDS.fast,
        max_tokens: 1024,
        system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
        output_config: { format: { type: 'json_schema', schema: QUESTIONS_SCHEMA } },
        messages: [{ role: 'user', content: `User wants to build: ${prompt}` }],
      });
      const textBlock = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
      if (!textBlock) throw new Error('Model returned no text output');
      return NextResponse.json(JSON.parse(textBlock.text));
    }

    // ── Phase 2: the actual plan, informed by the answers from phase 1 ──
    const knownDeps = knownDepsFor(String(prompt ?? ''));
    const qaLines = answers && typeof answers === 'object'
      ? Object.entries(answers as Record<string, string>).filter(([, a]) => String(a).trim()).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')
      : '';

    const systemPrompt = `You are an expert product architect describing a plan in terms a non-technical user cares about: WHAT FEATURES it will have and WHAT TOOLS/SERVICES it needs. Never mention file names, code structure, or implementation detail — that's the coding step's job, not the plan's.

Also describe the primary screen-to-screen flow a user would experience, as an ordered list of screens starting from the entry point.

Scale the NUMBER of features to the real scope — do not compress a genuinely large system into the same count as a small one, and do not pad a simple one:
- Simple app: 3-4 features.
- Medium app: 4-6 features.
- Complex/enterprise app (multiple departments, roles, or workflows): 6-10 features — give each distinct part of the system its own entry rather than bundling several into one vague feature just to stay under a low count.

Keep every feature meaningfully distinct either way — more features should mean more real coverage, not filler. estimatedCredits: set to 0 (the server computes the real cost from pricing — never invent a number). Pick the closest "icon" category for each feature/screen from the allowed enum — use "other"/"landing" only if nothing else fits.
${knownDeps.length > 0 ? `\nAlready detected as needed: ${knownDeps.join(', ')}. Include these in "integrations".` : ''}`;

    const userText = `User wants to build: ${prompt}${qaLines ? `\n\nClarifications:\n${qaLines}` : ''}`;

    const msg = await client.messages.create({
      model: MODEL_IDS.default,
      max_tokens: 4096,
      thinking: { type: 'adaptive', display: 'summarized' },
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      output_config: { format: { type: 'json_schema', schema: PLAN_SCHEMA } },
      messages: [{
        role: 'user',
        content: fileContext ? `Current project:\n${fileContext.slice(0, 3000)}\n\n${userText}` : userText,
      }],
    });

    // With thinking enabled, content[0] is the thinking block, not text.
    const textBlock = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('Model returned no text output');
    const plan = JSON.parse(textBlock.text);
    // estimatedCredits comes from OUR price sheet, never the model — the model
    // used to guess "1-3 credits" for a whole app, wildly misquoting the real
    // build cost. Estimate = one from-scratch build + a few expected iterations
    // scaled by complexity.
    // 'fast' = the simple-edit price (2cr). 'default' would quote the 5cr
    // complex-edit rate for every expected iteration and overstate the estimate.
    const iterCost = creditCost('small-edit', 'fast');
    const expectedIters = plan.complexity === 'complex' ? 5 : plan.complexity === 'medium' ? 2 : 0;
    plan.estimatedCredits = creditCost('web-build', 'default') + expectedIters * iterCost;
    return NextResponse.json({ ...plan, creditsCharged: deducted });
  } catch (err) {
    await refund('plan-failed');
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
