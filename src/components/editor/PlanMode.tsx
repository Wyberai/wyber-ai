'use client';
import { useState } from 'react';

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
  onApprove: () => void;
  onCancel: () => void;
}

const TYPE_COLOR = { create: '#22c55e', modify: '#f59e0b', delete: '#ef4444' };
const COMPLEXITY_COLOR = { simple: '#22c55e', medium: '#f59e0b', complex: '#ef4444' };

export function PlanMode({ prompt, framework, fileContext, onApprove, onCancel }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // Auto-load on mount
  useState(() => { loadPlan(); });

  if (loading) return (
    <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Planning your build...</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={loadPlan} className="btn" style={{ fontSize: 12 }}>Retry</button>
        <button onClick={onApprove} className="btn btn-primary" style={{ fontSize: 12 }}>Generate anyway</button>
      </div>
    </div>
  );

  if (!plan) return null;

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Plan header */}
      <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 9, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{plan.title}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${COMPLEXITY_COLOR[plan.complexity]}22`, color: COMPLEXITY_COLOR[plan.complexity], fontWeight: 600 }}>
              {plan.complexity}
            </span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', fontWeight: 600 }}>
              {plan.estimatedCredits} credit{plan.estimatedCredits !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{plan.approach}</p>
      </div>

      {/* Steps */}
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Build plan ({plan.steps.length} steps)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 10, padding: '9px 11px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{step.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>{step.description}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {step.files.map(f => (
                    <span key={f} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: `${TYPE_COLOR[step.type]}15`, color: TYPE_COLOR[step.type], fontFamily: 'monospace', border: `1px solid ${TYPE_COLOR[step.type]}30` }}>
                      {step.type === 'create' ? '+' : step.type === 'modify' ? '~' : '-'} {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heads up</p>
          {plan.warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0' }}>• {w}</p>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onApprove} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
          ⚡ Build it ({plan.estimatedCredits} credit{plan.estimatedCredits !== 1 ? 's' : ''})
        </button>
        <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}
