'use client';
import { useState, useEffect, useRef } from 'react';
import { creditCost } from '@/lib/credits';
import { useEditorStore } from '@/store/editor';
import { getPaletteById, renderDesignBrief } from '@/lib/design-palettes';
import { DirectionCards } from './DirectionCards';

type IconKey = 'auth' | 'dashboard' | 'list' | 'board' | 'payment' | 'settings' | 'search' | 'chat' | 'calendar' | 'profile' | 'notification' | 'upload' | 'map' | 'analytics' | 'landing' | 'other';

const ICON: Record<IconKey, string> = {
  auth: '🔐', dashboard: '📊', list: '📋', board: '🗂️', payment: '💳',
  settings: '⚙️', search: '🔍', chat: '💬', calendar: '📅', profile: '👤',
  notification: '🔔', upload: '📤', map: '🗺️', analytics: '📈', landing: '🚪', other: '✨',
};

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: IconKey;
}

interface FlowScreen {
  id: string;
  name: string;
  icon: IconKey;
}

interface Plan {
  title: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedCredits: number;
  approach: string;
  features: Feature[];
  flow: { screens: FlowScreen[] };
  integrations: string[];
  warnings: string[];
}

interface Props {
  prompt: string;
  framework: string;
  fileContext: string;
  projectId?: string;
  // Passes the assembled, possibly-edited plan spec back to the caller,
  // plus the picked design direction (undefined = server prompt-matches one)
  onApprove: (planSpec: string, paletteId?: string) => void;
  onCancel: () => void;
}

const COMPLEXITY_COLOR = { simple: '#22c55e', medium: '#f59e0b', complex: '#ef4444' };

function uid() { return Math.random().toString(36).slice(2, 9); }

function integrationIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('supabase') || n.includes('database')) return '🗄️';
  if (n.includes('stripe') || n.includes('payment')) return '💳';
  if (n.includes('email')) return '📧';
  if (n.includes('map')) return '🗺️';
  if (n.includes('auth')) return '🔐';
  return '🔌';
}

// Turn the (edited) plan — plus any clarifying-question answers — into a spec
// string prepended to the build prompt. Answers are folded in so asking the
// questions actually changes what gets built, not just UI theater.
function planToSpec(plan: Plan, originalPrompt: string, answers: Record<string, string>): string {
  const featureLines = plan.features.map((f, i) => `${i + 1}. ${f.title}${f.description ? ' — ' + f.description : ''}`).join('\n');
  const flowLine = plan.flow.screens.length > 0 ? plan.flow.screens.map(s => s.name).join(' → ') : '';
  const qaLines = Object.entries(answers)
    .filter(([, a]) => a.trim())
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n');
  return `Build the following according to this approved plan. Implement each feature fully.

PLAN: ${plan.title}
APPROACH: ${plan.approach}
${plan.integrations.length > 0 ? `\nINTEGRATIONS NEEDED: ${plan.integrations.join(', ')}` : ''}
${flowLine ? `\nPRIMARY SCREEN FLOW: ${flowLine}` : ''}

FEATURES:
${featureLines}
${qaLines ? `\nCLARIFICATIONS FROM THE USER:\n${qaLines}` : ''}

ORIGINAL REQUEST: ${originalPrompt}`;
}

export function PlanMode({ prompt, framework, fileContext, projectId, onApprove, onCancel }: Props) {
  // 'questions': loading/showing phase-1 clarifying questions.
  // 'plan-loading': phase-1 done (or skipped), waiting on the actual plan.
  // 'plan': plan loaded and ready to review/approve.
  const [stage, setStage] = useState<'questions' | 'plan-loading' | 'plan'>('questions');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  // Which phase actually failed — so Retry re-runs THAT phase, not always
  // "start over from questions." Losing already-answered questions on a
  // transient network blip during the plan call would be a real loophole,
  // not just a cosmetic one: the more questions a request needed, the more
  // there'd be to lose.
  const [failedPhase, setFailedPhase] = useState<'questions' | 'plan'>('questions');
  // Tool add/search — suggestions come from the app's real, live connector
  // catalog (Composio, hourly-cached server-side), not a hardcoded list, so
  // what's suggested always reflects what's actually connectable right now.
  const [toolQuery, setToolQuery] = useState('');
  const [toolSuggestions, setToolSuggestions] = useState<{ slug: string; name: string }[]>([]);
  const toolSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toolSearchTimer.current) clearTimeout(toolSearchTimer.current);
    const q = toolQuery.trim();
    if (q.length < 2) { setToolSuggestions([]); return; }
    toolSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/composio/toolkits?search=${encodeURIComponent(q)}`);
        const data = await res.json();
        type ToolkitResult = { slug: string; name: string };
        setToolSuggestions(((data.toolkits ?? []) as ToolkitResult[]).slice(0, 6).map(t => ({ slug: t.slug, name: t.name })));
      } catch {
        setToolSuggestions([]);
      }
    }, 300);
    return () => { if (toolSearchTimer.current) clearTimeout(toolSearchTimer.current); };
  }, [toolQuery]);

  const addTool = (name: string) => {
    if (!plan) return;
    const trimmed = name.trim();
    if (!trimmed || plan.integrations.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;
    setPlan({ ...plan, integrations: [...plan.integrations, trimmed] });
    setToolQuery('');
    setToolSuggestions([]);
  };
  const removeTool = (name: string) => {
    if (!plan) return;
    setPlan({ ...plan, integrations: plan.integrations.filter(s => s !== name) });
  };

  const loadQuestions = async () => {
    setError('');
    setFailedPhase('questions');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework, fileContext, phase: 'questions' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const qs: string[] = data.clarifyingQuestions ?? [];
      if (qs.length === 0) {
        setStage('plan-loading');
        await loadPlan({});
      } else {
        setQuestions(qs);
        setStage('questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    }
  };

  const loadPlan = async (finalAnswers: Record<string, string>) => {
    setStage('plan-loading');
    setError('');
    setFailedPhase('plan');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework, fileContext, phase: 'plan', answers: finalAnswers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Mirror the server-side plan charge in the local balance so the credit
      // pill is honest without a page reload.
      if (typeof data.creditsCharged === 'number' && data.creditsCharged > 0) {
        const st = useEditorStore.getState();
        st.setCredits(Math.max(0, st.credits - data.creditsCharged));
      }
      setPlan(data);
      setStage('plan');
    } catch (err) {
      // Answers already live in `answers` state, untouched by this failure —
      // Retry (which calls loadPlan(answers) for this phase) picks them right
      // back up instead of losing them.
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    }
  };

  useEffect(() => { loadQuestions(); /* eslint-disable-next-line */ }, []);

  const allQuestionsAnswered = questions.every(q => (answers[q] ?? '').trim().length > 0);

  // ---- feature editing helpers ----
  const updateFeature = (id: string, patch: Partial<Feature>) => {
    if (!plan) return;
    setPlan({ ...plan, features: plan.features.map(f => f.id === id ? { ...f, ...patch } : f) });
  };
  const deleteFeature = (id: string) => {
    if (!plan) return;
    setPlan({ ...plan, features: plan.features.filter(f => f.id !== id) });
  };
  const addFeature = () => {
    if (!plan) return;
    setPlan({ ...plan, features: [...plan.features, { id: uid(), title: 'New feature', description: '', icon: 'other' }] });
  };
  const moveFeature = (idx: number, dir: -1 | 1) => {
    if (!plan) return;
    const next = [...plan.features];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPlan({ ...plan, features: next });
  };

  // Design direction picked on the cards (null = "surprise me": the server
  // prompt-matches a palette on its own).
  const [paletteId, setPaletteId] = useState<string | null>(null);

  const approve = () => {
    if (!plan || plan.features.length === 0) return;
    let spec = planToSpec(plan, prompt, answers);
    const pal = paletteId ? getPaletteById(paletteId) : undefined;
    if (pal) spec += `\n\n${renderDesignBrief(pal)}`;
    if (projectId) {
      fetch('/api/projects/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, plan, answers }),
      }).catch(() => {});
    }
    onApprove(spec, pal?.id);
  };

  if (error) return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--red, #ef4444)', marginBottom: 12 }}>{error}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => failedPhase === 'plan' ? loadPlan(answers) : loadQuestions()}
          className="btn" style={{ fontSize: 12 }}
        >
          Retry
        </button>
        {/* Always available — Plan Mode is an offer, never a requirement. If
            planning itself is broken, the user can still build directly with
            their original words, same as typing straight into the chat box. */}
        <button onClick={() => onApprove(prompt)} className="btn btn-primary" style={{ fontSize: 12 }}>Generate anyway</button>
      </div>
    </div>
  );

  if (stage === 'questions' && questions.length === 0) return (
    <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Thinking about what to ask…</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (stage === 'questions') return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>What are you looking to build?</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>A couple quick questions before I put together a plan.</p>
      </div>
      {questions.map((q, i) => (
        <div key={i}>
          <label style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{q}</label>
          <input
            value={answers[q] ?? ''}
            onChange={e => setAnswers(a => ({ ...a, [q]: e.target.value }))}
            placeholder="Your answer…"
            style={{ fontSize: 12, width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 9px', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => loadPlan(answers)}
          disabled={!allQuestionsAnswered}
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', fontSize: 13, background: allQuestionsAnswered ? 'var(--accent, #0EA5E9)' : 'var(--bg-overlay, rgba(255,255,255,0.08))', color: allQuestionsAnswered ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 700, cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed' }}
        >
          Continue →
        </button>
        <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: 13, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );

  if (stage === 'plan-loading' || !plan) return (
    <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sketching the plan…</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Plan header */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 9, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {editing ? (
            <input value={plan.title} onChange={e => setPlan({ ...plan, title: e.target.value })}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px', flex: 1, marginRight: 8, outline: 'none', fontFamily: 'inherit' }} />
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{plan.title}</span>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${COMPLEXITY_COLOR[plan.complexity]}22`, color: COMPLEXITY_COLOR[plan.complexity], fontWeight: 600 }}>
              {plan.complexity}
            </span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--accent-glow, rgba(14,165,233,0.1))', color: 'var(--accent, #0EA5E9)', fontWeight: 600 }}>
              ~{plan.estimatedCredits} credits incl. iterations
            </span>
          </div>
        </div>
        {editing ? (
          <textarea value={plan.approach} onChange={e => setPlan({ ...plan, approach: e.target.value })} rows={2}
            style={{ fontSize: 12, color: 'var(--text-secondary)', width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 5, padding: '6px 8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{plan.approach}</p>
        )}
      </div>

      {/* Tools needed — visual, not a plain text line. Editable: remove any
          suggested tool, or add one from the app's real, live connector
          catalog (not a hardcoded/stale list). */}
      {(plan.integrations.length > 0 || editing) && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tools needed
            {/* Always-visible affordance: users who saw "HubSpot" but use
                Salesforce never found the global ✎ Edit plan toggle. */}
            {!editing && (
              <button onClick={() => setEditing(true)}
                style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', padding: '1px 8px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent, #0EA5E9)', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✎ change tools
              </button>
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editing ? 8 : 0 }}>
            {plan.integrations.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--accent, #0EA5E9)', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                <span style={{ fontSize: 13 }}>{integrationIcon(s)}</span>{s}
                {editing && (
                  <button onClick={() => removeTool(s)} title="Remove tool" style={{ background: 'none', border: 'none', color: 'var(--accent, #0EA5E9)', cursor: 'pointer', padding: 0, marginLeft: 2, fontSize: 12, lineHeight: 1, opacity: 0.7 }}>×</button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div style={{ position: 'relative' }}>
              <input
                value={toolQuery}
                onChange={e => setToolQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && toolQuery.trim()) { e.preventDefault(); addTool(toolQuery); } }}
                placeholder="Search tools to add (e.g. Gmail, Slack, Supabase)…"
                style={{ fontSize: 11, width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 9px', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
              />
              {toolSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', zIndex: 5 }}>
                  {toolSuggestions.map(t => (
                    <button key={t.slug} onClick={() => addTool(t.name)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 9px', fontSize: 11, background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-overlay, rgba(255,255,255,0.06))')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Flow — the primary screen-to-screen path, rendered as a connected diagram */}
      {plan.flow.screens.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flow</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {plan.flow.screens.map((s, i) => (
              <div key={s.id} style={{ display: 'contents' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 9, minWidth: 64 }}>
                  <span style={{ fontSize: 17 }}>{ICON[s.icon] ?? '✨'}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)', lineHeight: 1.3 }}>{s.name}</span>
                </div>
                {i < plan.flow.screens.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Features ({plan.features.length})
          </p>
          <button onClick={() => setEditing(v => !v)}
            style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: editing ? 'var(--accent-glow, rgba(14,165,233,0.1))' : 'transparent', color: editing ? 'var(--accent, #0EA5E9)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
            {editing ? '✓ Done editing' : '✎ Edit plan'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {plan.features.map((f, i) => {
            const isLast = i === plan.features.length - 1;
            return (
              <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 26, flexShrink: 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-glow, rgba(14,165,233,0.1))', border: '1.5px solid var(--accent, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                    {ICON[f.icon] ?? '✨'}
                  </div>
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: 10, background: 'linear-gradient(to bottom, var(--border), transparent)', marginTop: 2 }} />}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 8, padding: '9px 11px', marginBottom: isLast ? 0 : 8, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {editing ? (
                      <>
                        <input value={f.title} onChange={e => updateFeature(f.id, { title: e.target.value })}
                          style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 7px', marginBottom: 4, outline: 'none', fontFamily: 'inherit' }} />
                        <textarea value={f.description} onChange={e => updateFeature(f.id, { description: e.target.value })} rows={2}
                          style={{ fontSize: 11, color: 'var(--text-secondary)', width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 7px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.description}</div>
                      </>
                    )}
                  </div>
                  {editing && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                      <button onClick={() => moveFeature(i, -1)} title="Move up" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>↑</button>
                      <button onClick={() => moveFeature(i, 1)} title="Move down" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>↓</button>
                      <button onClick={() => deleteFeature(f.id)} title="Delete feature" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>×</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {editing && (
            <button onClick={addFeature} style={{ fontSize: 11, padding: '7px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
              + Add feature
            </button>
          )}
        </div>
      </div>

      {/* Design direction — pure CSS from the curated palettes, free */}
      <DirectionCards prompt={prompt} selectedId={paletteId} onPick={setPaletteId} />

      {/* Warnings */}
      {plan.warnings.length > 0 && !editing && (
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber, #f59e0b)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heads up</p>
          {plan.warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>• {w}</p>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={approve}
            disabled={plan.features.length === 0}
            className="btn btn-primary"
            title={plan.features.length === 0 ? 'Add at least one feature first' : undefined}
            style={{ flex: 1, justifyContent: 'center', fontSize: 13, background: plan.features.length > 0 ? 'var(--accent, #0EA5E9)' : 'var(--bg-overlay, rgba(255,255,255,0.08))', color: plan.features.length > 0 ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 700, cursor: plan.features.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            ⚡ Build this plan ({creditCost('web-build', 'default')} credits)
          </button>
          <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: 13, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
        </div>
        {plan.features.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>Add at least one feature to build</p>
        )}
      </div>
    </div>
  );
}
