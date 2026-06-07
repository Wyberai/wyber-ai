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

  runFlow: () => Promise<void>
  clearLogs: () => void
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

  runFlow: async () => {
    const { nodes } = get()
    set({ isRunning: true, executionLogs: [] })
    for (const node of nodes) {
      set((s) => ({
        nodes: s.nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n),
        executionLogs: [...s.executionLogs, { nodeId: node.id, nodeLabel: node.data.label, status: 'running', message: `Executing ${node.data.label}...`, timestamp: Date.now() }]
      }))
      await new Promise(r => setTimeout(r, 900))
      set((s) => ({
        nodes: s.nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'success' } } : n),
        executionLogs: s.executionLogs.map(l =>
          l.nodeId === node.id && l.status === 'running'
            ? { ...l, status: 'success', message: `✓ ${node.data.label} completed`, duration: 900 }
            : l
        )
      }))
    }
    set({ isRunning: false })
  },

  clearLogs: () => set({ executionLogs: [] }),
}))
