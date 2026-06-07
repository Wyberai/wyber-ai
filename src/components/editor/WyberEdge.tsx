'use client'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

// Custom Wyber-branded edge — sky blue animated bezier with arrow
export function WyberEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  selected, data, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      {/* Glow shadow */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={selected ? 8 : 6}
        stroke="rgba(14,165,233,0.08)"
        strokeLinecap="round"
      />

      {/* Main edge */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={selected ? 2.5 : 2}
        stroke={selected ? '#38bdf8' : '#0EA5E9'}
        strokeLinecap="round"
        strokeDasharray={selected ? 'none' : '8 4'}
        style={{
          animation: 'wyberEdgeFlow 1.5s linear infinite',
          filter: selected ? 'drop-shadow(0 0 4px rgba(14,165,233,0.8))' : 'none',
        }}
        markerEnd={markerEnd}
      />

      {/* Animated data flow dot */}
      <circle r="3" fill="#0EA5E9" opacity="0.9">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* Edge label if present */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'rgba(9,9,11,0.9)',
              border: '1px solid rgba(14,165,233,0.3)',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              color: '#0EA5E9',
              pointerEvents: 'all',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.04em',
            }}
            className="nodrag nopan"
          >
            {data.label as string}
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes wyberEdgeFlow {
          from { stroke-dashoffset: 24; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  )
}

// Custom Wyber arrow marker for SVG defs
export function WyberMarkerDefs() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="wyber-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#0EA5E9" />
        </marker>
        <marker
          id="wyber-arrow-selected"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#38bdf8" />
        </marker>
      </defs>
    </svg>
  )
}
