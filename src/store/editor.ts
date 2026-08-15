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
  // Set on error-status assistant messages so a "Retry" action knows exactly
  // what to resend and through which lane, without re-deriving/guessing either.
  retryPrompt?: string;
  retryLane?: 'build' | 'chat';
  // Real extended-thinking output (opt-in, new-build full generation only —
  // see generate/route.ts's useThinking). Shown collapsed under the message.
  reasoning?: string;
  // Design-quality advisory (heuristic-only, client-side, non-persisted) —
  // see design-quality-check.ts. Renders as a dismissible suggestion chip;
  // clicking only populates the input box, it never auto-sends or
  // auto-regenerates.
  designSuggestion?: { prompt: string; label: string };
  // Agent-team turn receipt (client-session only, same treatment as
  // `reasoning`): what each agent did this turn, the security findings, and
  // the single charge. Built from the turn's [agent:{...}] stream events —
  // see src/lib/agents/events.ts. Renders as TurnReceipt + SecurityReportCard.
  agentReport?: {
    agents: { id: string; summary: string }[];
    findings: {
      findingId?: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      status: 'fixed' | 'flagged' | 'dismissed';
    }[];
    passesUsed?: number;
    credits?: number;
  };
  // Loop-stop card: self-heal hit the same error twice — surface what was
  // tried instead of silently burning more passes (see loop-guard.ts).
  loopStop?: { errorSummary: string; attempts: number; retryPrompt: string };
  // Ask-first autonomy: a free fix pass OFFERED instead of auto-run (see
  // agent-turn store `autonomy`). Fix dispatches the self-heal; Dismiss clears.
  fixOffer?: { prompt: string; error?: string; label: string };
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
  project_type?: string;
  // Tracked for the multi-tab conflict guard (see persist-project.ts):
  // each save sends this as `expectedUpdatedAt` so a save from another tab
  // that's landed in between is detected instead of silently overwritten.
  updated_at?: string;
  first_prompt?: string;
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
  // Bumped once per genuinely fresh user turn (never per staged-build pass —
  // a staged build flips isGenerating true/false once per stage: scaffold,
  // then each fill batch). PreviewPanel keys its self-heal budget reset off
  // this instead of isGenerating, so a multi-stage build doesn't get its
  // 3-attempt heal cap reset up to 8x in one turn.
  generationTurnSeq: number;
  hasGeneratedFiles: boolean;
  streamingContent: string;
  knowledge: string;
  initialPrompt: string; // the prompt the project was created with (durable handoff fallback)
  checkpoints: Checkpoint[];
  connectors: Connector[];
  // Connector ids (see ConnectorsPanel's CONNECTORS catalog) detected as
  // needed by THIS project's files — e.g. after a marketplace purchase or a
  // zip/GitHub import delivers a fully-formed app with no "generation" moment
  // to hook. Empty for normal AI-generated projects, which already get this
  // via ChatPanel's per-message dependency gate instead.
  recommendedConnectorIds: string[];
  hydrated: boolean; // true once project data loaded from server

  previewUrl: string | null;
  previewMode: 'preview' | 'console';
  leftPanelWidth: number;
  rightPanelWidth: number;
  showFileTree: boolean;
  credits: number;

  // Read-only mirror of PreviewPanel's build/heal state, for UI (e.g. Wyberman)
  // that lives outside PreviewPanel and needs to know if the preview is stuck.
  previewError: string | null;
  previewHealFailed: boolean;
  // Which feature currently owns the preview's click-to-select mode, so two
  // features asking for a selection at once don't both react to the same click.
  selectionConsumer: 'visual-edit' | 'wyberman' | null;

  // Surfaces failures from the non-chat save paths (visual edits, self-heal,
  // theme changes, image regen, version restore) — these used to fire-and-forget
  // a PATCH with `.catch(() => {})`, so a network blip silently lost the edit
  // with no sign anything was wrong. 'error' means the persist-project retry
  // loop is still trying in the background; the UI should show that plainly.
  saveStatus: 'idle' | 'error';

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
  bumpGenerationTurn: () => void;
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
  setRecommendedConnectorIds: (ids: string[]) => void;
  setPreviewError: (e: string | null) => void;
  setPreviewHealFailed: (v: boolean) => void;
  setSelectionConsumer: (c: 'visual-edit' | 'wyberman' | null) => void;
  setSaveStatus: (v: 'idle' | 'error') => void;
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
    generationTurnSeq: 0,
    hasGeneratedFiles: false,
    streamingContent: '',
    knowledge: '',
    initialPrompt: '',
    checkpoints: [],
    connectors: [],
    recommendedConnectorIds: [],
    hydrated: false,
    previewUrl: null,
    previewMode: 'preview',
    leftPanelWidth: 220,
    // 460 (was 360): the chat is the primary way users drive the product —
    // at 360 it read as a cramped sidebar next to competitors' ~570px panels.
    // Still user-resizable (320–700) via the divider.
    rightPanelWidth: 460,
    showFileTree: true,
    credits: 100,
    previewError: null,
    previewHealFailed: false,
    selectionConsumer: null,
    saveStatus: 'idle',

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
      s.recommendedConnectorIds = [];
      s.hydrated = false;
    }),
    setFramework: (f) => set((s) => { s.framework = f; }),

    hydrateProject: (data) => set((s) => {
      // Same race as files below: if the caller already set s.project (synchronously,
      // before its own async fetches resolved) and a save has since bumped its
      // updated_at, blindly reapplying data.project here would reset it back to the
      // stale SSR value — causing the NEXT save's conflict-guard to false-positive
      // and get silently rejected by the server (see persist-project.ts).
      if (!s.project || s.project.id !== data.project.id) {
        s.project = data.project;
        s.framework = data.project.framework ?? 'react-vite';
      }
      // This resolves after a few parallel network round-trips (messages/knowledge/
      // connectors), so the user can already have edited files (e.g. a theme change)
      // by the time it lands. If so, `data.files` is just the stale SSR snapshot from
      // page load — applying it would silently revert the edit a few seconds later.
      // Only seed files here if nothing has populated the store yet.
      if (Object.keys(s.files).length === 0) {
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
    bumpGenerationTurn: () => set((s) => { s.generationTurnSeq += 1; }),
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
    setRecommendedConnectorIds: (ids) => set((s) => { s.recommendedConnectorIds = ids; }),
    setPreviewError: (e) => set((s) => { s.previewError = e; }),
    setPreviewHealFailed: (v) => set((s) => { s.previewHealFailed = v; }),
    setSelectionConsumer: (c) => set((s) => { s.selectionConsumer = c; }),
    setSaveStatus: (v) => set((s) => { s.saveStatus = v; }),
  }))
);
