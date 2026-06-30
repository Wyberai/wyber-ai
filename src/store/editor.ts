import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type Framework = 'react-vite' | 'next' | 'vue' | 'svelte' | 'astro' | 'vanilla' | 'react-native';

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

export interface Checkpoint {
  id: string;
  files: Record<string, FileNode>;
  label: string;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  framework: Framework;
  createdAt: number;
  is_public?: boolean;
  deployed_url?: string;
  userId?: string;
}

export interface Connector {
  service: string;
  config?: Record<string, unknown>;
  connected_at?: string;
}

interface EditorState {
  project: Project | null;
  framework: Framework;
  files: Record<string, FileNode>;
  activeFile: string | null;
  openTabs: string[];
  messages: ChatMessage[];
  isGenerating: boolean;
  hasGeneratedFiles: boolean;
  streamingContent: string;
  knowledge: string;
  initialPrompt: string; // the prompt the project was created with (durable handoff fallback)
  checkpoints: Checkpoint[];
  connectors: Connector[];
  hydrated: boolean; // true once project data loaded from server

  previewUrl: string | null;
  previewMode: 'preview' | 'console';
  leftPanelWidth: number;
  rightPanelWidth: number;
  showFileTree: boolean;
  credits: number;

  // Project
  setProject: (p: Project) => void;
  setFramework: (f: Framework) => void;
  hydrateProject: (data: { project: Project; files?: Record<string, FileNode>; messages?: ChatMessage[]; knowledge?: string; initialPrompt?: string }) => void;
  resetForProject: () => void;
  setHydrated: (v: boolean) => void;

  // Files
  setFile: (path: string, content: string) => void;
  setFiles: (files: Record<string, FileNode>) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveFile: (path: string) => void;
  markFileDirty: (path: string, dirty: boolean) => void;

  // Chat
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setIsGenerating: (v: boolean) => void;
  setHasGeneratedFiles: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;

  // Knowledge
  setKnowledge: (k: string) => void;

  // Checkpoints
  pushCheckpoint: (label: string) => void;
  restoreCheckpoint: (id: string) => void;
  setCheckpoints: (cps: Checkpoint[]) => void;

  // UI
  setPreviewUrl: (url: string | null) => void;
  setPreviewMode: (mode: 'preview' | 'console') => void;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  toggleFileTree: () => void;
  consumeCredit: () => void;
  setCredits: (n: number) => void;
  setConnectors: (c: Connector[]) => void;
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
    knowledge: '',
    initialPrompt: '',
    checkpoints: [],
    connectors: [],
    hydrated: false,
    previewUrl: null,
    previewMode: 'preview',
    leftPanelWidth: 220,
    rightPanelWidth: 360,
    showFileTree: true,
    credits: 100,

    // IMPORTANT: setProject no longer wipes files/messages — hydration handles that
    setProject: (p) => set((s) => { s.project = p; }),
    resetForProject: () => set((s) => {
      s.project = null;
      s.files = {};
      s.activeFile = null;
      s.openTabs = [];
      s.messages = [];
      s.isGenerating = false;
      s.hasGeneratedFiles = false;
      s.streamingContent = '';
      s.knowledge = '';
      s.initialPrompt = '';
      s.checkpoints = [];
      s.connectors = [];
      s.hydrated = false;
    }),
    setFramework: (f) => set((s) => { s.framework = f; }),

    hydrateProject: (data) => set((s) => {
      s.project = data.project;
      s.framework = data.project.framework ?? 'react-vite';
      if (data.files && Object.keys(data.files).length > 0) {
        s.files = data.files;
        s.hasGeneratedFiles = true;
        const paths = Object.keys(data.files);
        const preferred = paths.find(p => p.includes('App') || p.includes('index') || p.includes('main')) ?? paths[0];
        s.activeFile = preferred;
        s.openTabs = [preferred];
      } else {
        s.files = {};
        s.hasGeneratedFiles = false;
      }
      s.messages = data.messages ?? [];
      s.knowledge = data.knowledge ?? '';
      s.initialPrompt = data.initialPrompt ?? '';
      s.hydrated = true;
    }),

    setHydrated: (v) => set((s) => { s.hydrated = v; }),

    setFile: (path, content) => set((s) => {
      s.files[path] = { path, content, language: inferLanguage(path) };
      if (!s.openTabs.includes(path)) s.openTabs.push(path);
      s.activeFile = path;
    }),

    setFiles: (files) => set((s) => {
      s.files = files ?? {};
      const paths = Object.keys(s.files);
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
      if (s.activeFile === path) s.activeFile = s.openTabs[s.openTabs.length - 1] ?? null;
    }),

    setActiveFile: (path) => set((s) => { s.activeFile = path; }),

    markFileDirty: (path, dirty) => set((s) => {
      if (s.files[path]) s.files[path].isDirty = dirty;
    }),

    setMessages: (msgs) => set((s) => { s.messages = msgs; }),
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

    setKnowledge: (k) => set((s) => { s.knowledge = k; }),

    pushCheckpoint: (label) => set((s) => {
      s.checkpoints.push({
        id: Math.random().toString(36).slice(2, 9),
        files: JSON.parse(JSON.stringify(s.files)),
        label,
        timestamp: Date.now(),
      });
      // Keep only the last 20 checkpoints in memory
      if (s.checkpoints.length > 20) s.checkpoints = s.checkpoints.slice(-20);
    }),

    restoreCheckpoint: (id) => set((s) => {
      const cp = s.checkpoints.find(c => c.id === id);
      if (cp) {
        s.files = JSON.parse(JSON.stringify(cp.files));
        const paths = Object.keys(s.files);
        if (paths.length) {
          const preferred = paths.find(p => p.includes('App') || p.includes('index')) ?? paths[0];
          s.activeFile = preferred;
          s.openTabs = [preferred];
        }
      }
    }),

    setCheckpoints: (cps) => set((s) => { s.checkpoints = cps; }),

    setPreviewUrl: (url) => set((s) => { s.previewUrl = url; }),
    setPreviewMode: (mode) => set((s) => { s.previewMode = mode; }),
    setLeftPanelWidth: (w) => set((s) => { s.leftPanelWidth = w; }),
    setRightPanelWidth: (w) => set((s) => { s.rightPanelWidth = w; }),
    toggleFileTree: () => set((s) => { s.showFileTree = !s.showFileTree; }),
    consumeCredit: () => set((s) => { s.credits = Math.max(0, s.credits - 1); }),
    setCredits: (n) => set((s) => { s.credits = n; }),
    setConnectors: (c) => set((s) => { s.connectors = c; }),
  }))
);
