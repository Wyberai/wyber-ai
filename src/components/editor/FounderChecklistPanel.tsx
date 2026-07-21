'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CONNECTORS_STRINGS } from '@/lib/i18n/dict/editor-connectors';
import { CHECKLIST_ITEMS, checklistProgress, type ChecklistState } from '@/lib/launch-checklist';

// The human-judgment half of launch readiness — pricing, positioning, support
// staffing, marketing channel, success metrics, legal entity. No scanner can
// check these; they're self-certified. See launch-checklist.ts for why.

export function FounderChecklistPanel({ projectId }: { projectId: string }) {
  const t = useT(EDITOR_CONNECTORS_STRINGS);
  const [state, setState] = useState<ChecklistState>({});
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await fetch(`/api/security/launch-checklist?projectId=${encodeURIComponent(projectId)}`);
        const json = await res.json();
        if (json.items) setState(json.items);
      } catch { /* best-effort load */ }
    })();
  }, [projectId]);

  const save = useCallback((next: ChecklistState) => {
    if (!projectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/security/launch-checklist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, items: next }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch { /* best-effort save */ }
    }, 500); // debounced — avoid a request per keystroke on the note fields
  }, [projectId]);

  const toggle = (id: string) => {
    const next = { ...state, [id]: { ...state[id], checked: !state[id]?.checked } };
    setState(next);
    save(next);
  };

  const setNote = (id: string, note: string) => {
    const next = { ...state, [id]: { checked: state[id]?.checked ?? false, note } };
    setState(next);
    save(next);
  };

  const progress = checklistProgress(state);

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--ide-text2, #9aa)', lineHeight: 1.6 }}>
        🎯 <strong>{t('founderChecklistTitle')}</strong> {t('founderChecklistDesc')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: progress.complete ? '#34D399' : 'var(--ide-text2)' }}>
          {t('checklistCompleteTemplate').replace('{done}', String(progress.done)).replace('{total}', String(progress.total))}
        </span>
        {saved && <span style={{ fontSize: 11, color: '#34D399' }}>✓ {t('checklistSavedMsg')}</span>}
      </div>

      {CHECKLIST_ITEMS.map((item) => {
        const itemState = state[item.id];
        return (
          <div key={item.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--ide-border)', background: 'var(--bg-surface, #16181d)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!itemState?.checked} onChange={() => toggle(item.id)}
                style={{ marginTop: 2, accentColor: '#A855F7', width: 15, height: 15, flexShrink: 0 }} />
              <span>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ide-text)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ide-text3)', marginTop: 2, lineHeight: 1.5 }}>{item.helper}</div>
              </span>
            </label>
            {item.notePrompt && (
              <input
                type="text"
                placeholder={item.notePrompt}
                value={itemState?.note ?? ''}
                onChange={(e) => setNote(item.id, e.target.value)}
                style={{ marginTop: 8, width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '7px 9px', borderRadius: 6, border: '1px solid var(--ide-border)', background: 'var(--bg-base, #0d0e12)', color: 'var(--ide-text)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
