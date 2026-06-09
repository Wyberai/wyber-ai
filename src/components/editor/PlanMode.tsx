'use client';
import { useState, useEffect } from 'react';

interface Step {
  id: string;
  title: string;
  description: string;
  files: string[];
  type: 'create' | 'modify' | 'delete';
}

interface Plan {
  title: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedCredits: number;
  steps: Step[];
  warnings: string[];
  approach: string;
}

interface Props {
  prompt: string;
  framework: string;
  fileContext: string;
  projectId?: string;
  // Now passes the assembled, possibly-edited plan spec back to the caller
  onApprove: (planSpec: string) => void;
  onCancel: () => void;
}

const TYPE_COLOR = { create: '#22c55e', modify: '#f59e0b', delete: '#ef4444' };
const COMPLEXITY_COLOR = { simple: '#22c55e', medium: '#f59e0b', complex: '#ef4444' };

function uid() { return Math.random().toString(36).slice(2, 9); }

// Turn the (edited) plan into a spec string that gets prepended to the build prompt
function planToSpec(plan: Plan, originalPrompt: string): string {
  const stepLines = plan.steps.map((s, i) => `${i + 1}. ${s.title}${s.description ? ' — ' + s.description : ''}`).join('\n');
  return `Build the following according to this approved plan. Follow the steps in order and implement each fully.

PLAN: ${plan.title}
APPROACH: ${plan.approach}

STEPS:
${stepLines}

ORIGINAL REQUEST: ${originalPrompt}`;
}

export function PlanMode({ prompt, framework, fileContext, projectId, onApprove, onCancel }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const loadPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, framework, fileContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    }
    setLoading(false);
  };

  useEffect(() => { loadPlan(); /* eslint-disable-next-line */ }, []);

  // ---- step editing helpers ----
  const updateStep = (id: string, patch: Partial<Step>) => {
    if (!plan) return;
    setPlan({ ...plan, steps: plan.steps.map(s => s.id === id ? { ...s, ...patch } : s) });
  };
  const deleteStep = (id: string) => {
    if (!plan) return;
    setPlan({ ...plan, steps: plan.steps.filter(s => s.id !== id) });
  };
  const addStep = () => {
    if (!plan) return;
    setPlan({ ...plan, steps: [...plan.steps, { id: uid(), title: 'New step', description: '', files: [], type: 'create' }] });
  };
  const moveStep = (idx: number, dir: -1 | 1) => {
    if (!plan) return;
    const next = [...plan.steps];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPlan({ ...plan, steps: next });
  };

  const approve = () => {
    if (!plan) return;
    const spec = planToSpec(plan, prompt);
    // Persist the plan to the project (best-effort, non-blocking)
    if (projectId) {
      fetch('/api/projects/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, plan }),
      }).catch(() => {});
    }
    onApprove(spec);
  };

  if (loading) return (
    <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Planning your build...</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--red, #ef4444)', marginBottom: 12 }}>{error}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={loadPlan} className="btn" style={{ fontSize: 12 }}>Retry</button>
        <button onClick={() => onApprove(prompt)} className="btn btn-primary" style={{ fontSize: 12 }}>Generate anyway</button>
      </div>
    </div>
  );

  if (!plan) return null;

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
              {plan.estimatedCredits} credit{plan.estimatedCredits !== 1 ? 's' : ''}
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

      {/* Steps */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Build plan ({plan.steps.length} steps)
          </p>
          <button onClick={() => setEditing(v => !v)}
            style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: editing ? 'var(--accent-glow, rgba(14,165,233,0.1))' : 'transparent', color: editing ? 'var(--accent, #0EA5E9)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
            {editing ? '✓ Done editing' : '✎ Edit plan'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 10, padding: '9px 11px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-overlay, rgba(255,255,255,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <>
                    <input value={step.title} onChange={e => updateStep(step.id, { title: e.target.value })}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 7px', marginBottom: 4, outline: 'none', fontFamily: 'inherit' }} />
                    <textarea value={step.description} onChange={e => updateStep(step.id, { description: e.target.value })} rows={2}
                      style={{ fontSize: 11, color: 'var(--text-secondary)', width: '100%', background: 'var(--bg-overlay, rgba(255,255,255,0.05))', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 7px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{step.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>{step.description}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {step.files.map(f => (
                        <span key={f} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${TYPE_COLOR[step.type]}15`, color: TYPE_COLOR[step.type], fontFamily: 'monospace', border: `1px solid ${TYPE_COLOR[step.type]}30` }}>
                          {step.type === 'create' ? '+' : step.type === 'modify' ? '~' : '-'} {f}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {editing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                  <button onClick={() => moveStep(i, -1)} title="Move up" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>↑</button>
                  <button onClick={() => moveStep(i, 1)} title="Move down" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>↓</button>
                  <button onClick={() => deleteStep(step.id)} title="Delete step" style={{ fontSize: 10, width: 22, height: 18, borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>×</button>
                </div>
              )}
            </div>
          ))}
          {editing && (
            <button onClick={addStep} style={{ fontSize: 11, padding: '7px', borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
              + Add step
            </button>
          )}
        </div>
      </div>

      {/* Warnings */}
      {plan.warnings.length > 0 && !editing && (
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber, #f59e0b)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heads up</p>
          {plan.warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>• {w}</p>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={approve} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, background: 'var(--accent, #0EA5E9)', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 700, cursor: 'pointer' }}>
          ⚡ Build this plan ({plan.estimatedCredits} credit{plan.estimatedCredits !== 1 ? 's' : ''})
        </button>
        <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: 13, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
