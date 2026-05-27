'use client';
import { useState, useEffect } from 'react';

interface Skill { id: string; name: string; description: string; icon: string; content?: string; }
interface Props { onApply: (skillPrompt: string) => void; }

export function SkillsPanel({ onApply }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', icon: '✦', content: '' });
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(d => setSkills(d.skills || []));
  }, []);

  const apply = (skill: Skill) => {
    setApplying(skill.id);
    onApply(`Apply the "${skill.name}" skill to this project: ${skill.content || skill.description}`);
    setTimeout(() => setApplying(null), 2000);
  };

  const createSkill = async () => {
    if (!newSkill.name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSkill),
    });
    const data = await res.json();
    if (data.skill) setSkills(prev => [...prev, data.skill]);
    setCreating(false);
    setNewSkill({ name: '', description: '', icon: '✦', content: '' });
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workspace Skills</div>
        <button onClick={() => setCreating(!creating)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border)', background: 'transparent', color: 'var(--sky)', cursor: 'pointer', fontFamily: 'inherit' }}>
          + New skill
        </button>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Reusable playbooks — click Apply to run on the current project</div>

      {creating && (
        <div style={{ padding: '10px', borderRadius: 10, border: '1px solid var(--sky)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <input value={newSkill.name} onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))} placeholder="Skill name..."
            style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          <input value={newSkill.description} onChange={e => setNewSkill(p => ({ ...p, description: e.target.value }))} placeholder="What does this skill do?"
            style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          <textarea value={newSkill.content} onChange={e => setNewSkill(p => ({ ...p, content: e.target.value }))} placeholder="Instructions for the AI..." rows={3}
            style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 11, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={createSkill} disabled={loading} style={{ flex: 1, padding: '7px', borderRadius: 7, background: 'var(--sky)', color: '#fff', fontWeight: 700, fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Saving...' : 'Save skill'}
            </button>
            <button onClick={() => setCreating(false)} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {skills.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.description}</div>
            </div>
            <button onClick={() => apply(s)} style={{ padding: '5px 10px', borderRadius: 7, background: applying === s.id ? '#34D399' : 'var(--sky)', color: '#fff', fontWeight: 600, fontSize: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {applying === s.id ? '✓ Applied' : 'Apply'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}