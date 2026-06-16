'use client';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { parseGenerationOutput } from '@/lib/file-parser';

interface Step {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'error';
  filesChanged?: string[];
}

export function AgentMode() {
  const [goal, setGoal] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const { files, framework, setFiles, addMessage, updateMessage } = useEditorStore();

  const planAndExecute = async () => {
    if (!goal.trim() || running) return;
    setRunning(true);
    setSteps([]);

    // Step 1: Ask Claude to plan
    const planPrompt = `You are an autonomous app builder. The user wants to: "${goal}"

Analyze the current project and create a step-by-step build plan. Output ONLY a JSON array of steps, no explanation:
[
  { "id": "1", "description": "What this step does", "prompt": "Exact instruction to execute this step" },
  ...
]

Keep it to 3-6 steps maximum. Each step should be a focused, atomic change.`;

    const planRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: planPrompt, framework, fileContext: '', history: [] }),
    });

    let planText = '';
    const reader = planRes.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      planText += decoder.decode(value, { stream: true });
    }

    // Parse the plan
    let plan: { id: string; description: string; prompt: string }[] = [];
    try {
      const jsonMatch = planText.match(/\[[\s\S]*\]/);
      if (jsonMatch) plan = JSON.parse(jsonMatch[0]);
    } catch {
      plan = [{ id: '1', description: goal, prompt: goal }];
    }

    const initialSteps: Step[] = plan.map(p => ({ id: p.id, description: p.description, status: 'pending' }));
    setSteps(initialSteps);

    // Execute each step
    let currentFiles = { ...files };
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      setSteps(s => s.map(st => st.id === step.id ? { ...st, status: 'running' } : st));

      const fileContext = Object.entries(currentFiles).slice(0, 20).map(([path, f]) => `<file path="${path}">\n${(f as { content: string }).content.slice(0, 3000)}\n</file>`).join('\n\n');

      const msgId = Math.random().toString(36).slice(2, 9);
      addMessage({ id: msgId, role: 'assistant', content: `**Agent step ${i + 1}/${plan.length}:** ${step.description}`, timestamp: Date.now(), status: 'streaming' });

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: step.prompt, framework, fileContext, history: [] }),
        });

        let full = '';
        const stepReader = res.body!.getReader();
        while (true) {
          const { done, value } = await stepReader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }

        const { files: newFiles, chatText } = parseGenerationOutput(full);
        if (newFiles.length > 0) {
          for (const { path, content } of newFiles) {
            const ext = path.split('.').pop() ?? '';
            const langMap: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', css: 'css', html: 'html', json: 'json', vue: 'vue' };
            currentFiles[path] = { path, content, language: langMap[ext] ?? 'plaintext' };
          }
          setFiles({ ...currentFiles });
        }

        updateMessage(msgId, { content: chatText || full, status: 'done', filesChanged: newFiles.map(f => f.path) });
        setSteps(s => s.map(st => st.id === step.id ? { ...st, status: 'done', filesChanged: newFiles.map(f => f.path) } : st));
      } catch (err) {
        updateMessage(msgId, { content: `Error in step: ${err}`, status: 'error' });
        setSteps(s => s.map(st => st.id === step.id ? { ...st, status: 'error' } : st));
        break;
      }
    }

    setRunning(false);
  };

  const statusIcon = (s: Step['status']) => ({ pending: '○', running: '⟳', done: '✓', error: '✕' }[s]);
  const statusColor = (s: Step['status']) => ({ pending: 'var(--text-muted)', running: 'var(--accent)', done: 'var(--green)', error: 'var(--red)' }[s]);

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
        ⚡ Agent Mode — describe the full feature and WyberAi will plan and execute it step by step
      </div>

      <textarea
        value={goal}
        onChange={e => setGoal(e.target.value)}
        placeholder="e.g. Build a full user authentication flow with login, signup, and password reset pages"
        disabled={running}
        rows={3}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}
      />

      <button onClick={planAndExecute} disabled={running || !goal.trim()} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}>
        {running ? '⟳ Agent running...' : '⚡ Run Agent'}
      </button>

      {steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Execution plan</p>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: statusColor(step.status), fontWeight: 700, minWidth: 16, animation: step.status === 'running' ? 'spin 1s linear infinite' : 'none' }}>
                {statusIcon(step.status)}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: step.status === 'done' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {i + 1}. {step.description}
                </span>
                {step.filesChanged && step.filesChanged.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {step.filesChanged.map(f => <span key={f} style={{ fontSize: 10, fontFamily: 'monospace', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 3 }}>✎ {f}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
