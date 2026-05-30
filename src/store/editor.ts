import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type Framework = 'react-vite' | 'next' | 'vue' | 'vanilla';

export interface FileNode {
  path: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'streaming' | 'done' | 'error';
  filesChanged?: string[];
}

export interface Project {
  id: string;
  name: string;
  framework: Framework;
  createdAt: number;
  is_public?: boolean;
  deployed_url?: string;
}

interface EditorState {
  // Project
  project: Project | null;
  framework: Framework;

  // Files
  files: Record<string, FileNode>;
  activeFile: string | null;
  openTabs: string[];

  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;
  hasGeneratedFiles: boolean;
  streamingContent: string;

  // UI
  previewUrl: string | null;
  previewMode: 'preview' | 'console';
  leftPanelWidth: number;   // px
  rightPanelWidth: number;  // px
  showFileTree: boolean;
  credits: number;

  // Actions
  setProject: (p: Project) => void;
  setFramework: (f: Framework) => void;

  // File actions
  setFile: (path: string, content: string) => void;
  setFiles: (files: Record<string, FileNode>) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveFile: (path: string) => void;
  markFileDirty: (path: string, dirty: boolean) => void;

  // Chat actions
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setIsGenerating: (v: boolean) => void;
  setHasGeneratedFiles: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;

  // UI actions
  setPreviewUrl: (url: string | null) => void;
  setPreviewMode: (mode: 'preview' | 'console') => void;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  toggleFileTree: () => void;
  consumeCredit: () => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  css: 'css', html: 'html', json: 'json', md: 'markdown',
  vue: 'vue', svelte: 'svelte', py: 'python', sh: 'shell',
};

function inferLanguage(path: string): string {
  const ext = path.split('.').pop() ?? '';
  return LANGUAGE_MAP[ext] ?? 'plaintext';
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    project: null,
    framework: 'react-vite',
    files: {},
    activeFile: null,
    openTabs: [],
    messages: [],
    isGenerating: false,
    hasGeneratedFiles: false,
    streamingContent: '',
    previewUrl: null,
    previewMode: 'preview',
    leftPanelWidth: 260,
    rightPanelWidth: 420,
    showFileTree: true,
    credits: 100,

    setProject: (p) => set((s) => { s.project = p; }),
    setFramework: (f) => set((s) => { s.framework = f; }),

    setFile: (path, content) => set((s) => {
      s.files[path] = { path, content, language: inferLanguage(path) };
      if (!s.openTabs.includes(path)) s.openTabs.push(path);
      s.activeFile = path;
    }),

    setFiles: (files) => set((s) => {
      s.files = files;
      const paths = Object.keys(files);
      if (paths.length && !s.activeFile) {
        const preferred = paths.find(p => p.includes('App') || p.includes('index') || p.includes('main')) ?? paths[0];
        s.activeFile = preferred;
        s.openTabs = [preferred];
      }
    }),

    openFile: (path) => set((s) => {
      if (!s.openTabs.includes(path)) s.openTabs.push(path);
      s.activeFile = path;
    }),

    closeTab: (path) => set((s) => {
      s.openTabs = s.openTabs.filter(t => t !== path);
      if (s.activeFile === path) {
        s.activeFile = s.openTabs[s.openTabs.length - 1] ?? null;
      }
    }),

    setActiveFile: (path) => set((s) => { s.activeFile = path; }),

    markFileDirty: (path, dirty) => set((s) => {
      if (s.files[path]) s.files[path].isDirty = dirty;
    }),

    addMessage: (msg) => set((s) => { s.messages.push(msg); }),

    updateMessage: (id, updates) => set((s) => {
      const idx = s.messages.findIndex(m => m.id === id);
      if (idx !== -1) Object.assign(s.messages[idx], updates);
    }),

    setIsGenerating: (v) => set((s) => { s.isGenerating = v; }),
    setHasGeneratedFiles: (v) => set((s) => { s.hasGeneratedFiles = v; }),
    setStreamingContent: (v) => set((s) => { s.streamingContent = v; }),
    appendStreamingContent: (chunk) => set((s) => { s.streamingContent += chunk; }),
    clearStreamingContent: () => set((s) => { s.streamingContent = ''; }),

    setPreviewUrl: (url) => set((s) => { s.previewUrl = url; }),
    setPreviewMode: (mode) => set((s) => { s.previewMode = mode; }),
    setLeftPanelWidth: (w) => set((s) => { s.leftPanelWidth = w; }),
    setRightPanelWidth: (w) => set((s) => { s.rightPanelWidth = w; }),
    toggleFileTree: () => set((s) => { s.showFileTree = !s.showFileTree; }),
    consumeCredit: () => set((s) => { s.credits = Math.max(0, s.credits - 1); }),
  }))
);
