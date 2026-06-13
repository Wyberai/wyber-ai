import { create } from 'zustand'
import {
  Node, Edge, NodeChange, EdgeChange, Connection,
  applyNodeChanges, applyEdgeChanges, addEdge,
} from '@xyflow/react'

export type WyberNodeType = 'trigger' | 'aiagent' | 'tool' | 'condition' | 'output'

export interface WyberNodeData {
  label: string
  subtitle?: string
  config: Record<string, string>
  status?: 'idle' | 'running' | 'success' | 'error'
  toolId?: string
  [key: string]: unknown
}

export interface ExecutionLog {
  nodeId: string
  nodeLabel: string
  status: 'running' | 'success' | 'error'
  message: string
  timestamp: number
  duration?: number
}

interface AgentStore {
  nodes: Node<WyberNodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  executionLogs: ExecutionLog[]
  isRunning: boolean

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  setSelectedNode: (id: string | null) => void
  updateNodeData: (id: string, data: Partial<WyberNodeData>) => void
  addNode: (type: WyberNodeType) => void
  deleteNode: (id: string) => void
  hydrateFromSession: (projectId: string) => void

  runFlow: (opts: { sourceId: string; sourceType: 'project' | 'flow' }) => Promise<void>
  clearLogs: () => void
  resetForProject: () => void
}

function makeId() { return Math.random().toString(36).slice(2, 9) }

const DEFAULT_NODES: Node<WyberNodeData>[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 80, y: 200 },
    data: { label: 'Start Trigger', subtitle: 'How this agent gets triggered', config: { type: 'manual' }, status: 'idle' },
  },
]

export const useAgentStore = create<AgentStore>((set, get) => ({
  nodes: DEFAULT_NODES,
  edges: [],
  selectedNodeId: null,
  executionLogs: [],
  isRunning: false,

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<WyberNodeData>[] })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (connection) =>
    set((s) => ({ edges: addEdge({ ...connection, animated: true, style: { stroke: '#0EA5E9', strokeWidth: 2 } }, s.edges) })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
    })),

  addNode: (type) => {
    const id = `${type}-${makeId()}`
    const labels: Record<WyberNodeType, string> = {
      trigger: 'Trigger', aiagent: 'AI Agent', tool: 'Tool Action', condition: 'Condition', output: 'Output'
    }
    const x = 80 + (get().nodes.length % 3) * 280
    const y = 180 + Math.floor(get().nodes.length / 3) * 180
    set((s) => ({
      nodes: [...s.nodes, { id, type, position: { x, y }, data: { label: labels[type], subtitle: '', config: {}, status: 'idle' } }],
      selectedNodeId: id,
    }))
  },

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter(n => n.id !== id),
      edges: s.edges.filter(e => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),

  hydrateFromSession: (projectId) => {
    try {
      const key = `wyber_canvas_${projectId}`
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null
      if (!raw) return
      const { nodes, edges } = JSON.parse(raw)
      if (nodes?.length) {
        set({ nodes, edges: edges || [] })
        sessionStorage.removeItem(key)
      }
    } catch {}
  },

  runFlow: async ({ sourceId, sourceType }) => {
    set({ isRunning: true, executionLogs: [] })

    // Mark all nodes pending
    set((s) => ({
      nodes: s.nodes.map(n => ({ ...n, data: { ...n.data, status: 'idle' as const } }))
    }))

    try {
      const res = await fetch('/api/canvas/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, sourceType }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        set((s) => ({
          isRunning: false,
          executionLogs: [...s.executionLogs, {
            nodeId: 'system',
            nodeLabel: 'System',
            status: 'error',
            message: data.error || 'Execution failed',
            timestamp: Date.now(),
          }],
        }))
        return
      }

      // Animate each step result in order
      for (const step of (data.steps ?? [])) {
        // Mark as running
        set((s) => ({
          nodes: s.nodes.map(n => n.id === step.nodeId ? { ...n, data: { ...n.data, status: 'running' as const } } : n),
          executionLogs: [...s.executionLogs, {
            nodeId: step.nodeId,
            nodeLabel: step.nodeLabel,
            status: 'running',
            message: `Running ${step.nodeLabel}...`,
            timestamp: Date.now(),
          }],
        }))

        await new Promise(r => setTimeout(r, 120)) // brief visual pause

        // Mark with final status + add log lines
        const finalStatus = step.status === 'success' ? 'success' : 'error'
        const logLines: string[] = step.log ?? []
        set((s) => ({
          nodes: s.nodes.map(n => n.id === step.nodeId
            ? { ...n, data: { ...n.data, status: finalStatus as 'success' | 'error' } }
            : n),
          executionLogs: [
            ...s.executionLogs.filter(l => !(l.nodeId === step.nodeId && l.status === 'running')),
            {
              nodeId: step.nodeId,
              nodeLabel: step.nodeLabel,
              status: finalStatus,
              message: logLines[0] || `${step.nodeLabel} ${finalStatus}`,
              timestamp: Date.now(),
              duration: step.durationMs,
            },
            ...logLines.slice(1).map(msg => ({
              nodeId: step.nodeId,
              nodeLabel: step.nodeLabel,
              status: finalStatus,
              message: `  ${msg}`,
              timestamp: Date.now(),
            })),
          ],
        }))
      }
    } catch (err) {
      set((s) => ({
        executionLogs: [...s.executionLogs, {
          nodeId: 'system',
          nodeLabel: 'System',
          status: 'error',
          message: `Network error: ${String(err)}`,
          timestamp: Date.now(),
        }],
      }))
    } finally {
      set({ isRunning: false })
    }
  },

  clearLogs: () => set({ executionLogs: [] }),

  resetForProject: () => set({
    nodes: DEFAULT_NODES,
    edges: [],
    selectedNodeId: null,
    executionLogs: [],
    isRunning: false,
  }),
}))
