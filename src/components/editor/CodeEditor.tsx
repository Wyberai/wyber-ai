'use client';
import { useEditorStore } from '@/store/editor';
import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useT } from '@/lib/i18n/useT';
import { EDITOR_CORE_UI_STRINGS } from '@/lib/i18n/dict/editor-core-ui';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const MONACO_OPTIONS = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line' as const,
  padding: { top: 16, bottom: 16 },
  tabSize: 2,
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 3,
  overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
  smoothScrolling: true,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
};

export function CodeEditor() {
  const { files, activeFile, setFile, markFileDirty } = useEditorStore();
  const t = useT(EDITOR_CORE_UI_STRINGS);
  const file = activeFile ? files[activeFile] : null;

  const handleChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    setFile(activeFile, value);
    markFileDirty(activeFile, true);
  }, [activeFile, setFile, markFileDirty]);

  if (!file) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', gap: 12,
      }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>⚡</div>
        <div style={{ fontSize: 13 }}>{t('codeEditorNoFileOpenTitle')}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
          {t('codeEditorNoFileOpenHint')}
        </div>
      </div>
    );
  }

  return (
    <MonacoEditor
      key={activeFile}
      height="100%"
      language={file.language}
      value={file.content}
      theme="vs-dark"
      options={MONACO_OPTIONS}
      onChange={handleChange}
      beforeMount={(monaco) => {
        // Override theme to match our dark IDE
        monaco.editor.defineTheme('forge-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '4a4a6a', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'c792ea' },
            { token: 'string', foreground: 'c3e88d' },
            { token: 'number', foreground: 'f78c6c' },
            { token: 'type', foreground: '82aaff' },
            { token: 'function', foreground: '82aaff' },
            { token: 'variable', foreground: 'eeffff' },
          ],
          colors: {
            'editor.background': '#141416',
            'editor.foreground': '#eeffff',
            'editor.lineHighlightBackground': '#1a1a22',
            'editorLineNumber.foreground': '#2e2e50',
            'editorLineNumber.activeForeground': '#5555aa',
            'editor.selectionBackground': '#3d3d6680',
            'editorCursor.foreground': '#7c6ef7',
            'editorIndentGuide.background1': '#2a2a3a',
            'editorBracketHighlight.foreground1': '#7c6ef7',
            'editorBracketHighlight.foreground2': '#c3e88d',
            'editorBracketHighlight.foreground3': '#f78c6c',
          },
        });
        monaco.editor.setTheme('forge-dark');
      }}
    />
  );
}
