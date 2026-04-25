'use client'

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import type { WorldEntry, WorldEntryType } from '@/lib/types/world-entry'
import type { Relation } from '@/lib/types/relation'
import type { GraphNode } from '@/lib/analysis/force-layout'
import { layoutForceDirected } from '@/lib/analysis/force-layout'
import { loadLayoutSnapshots, saveLayoutSnapshot } from '@/lib/db/layout-snapshots'
import { getRelationRecommendations, type AIRecommendationTarget } from '@/lib/ai/relation-recommendation'
import { RecommendationPanel } from './recommendation-panel'
import { RelationForm } from './relation-form'

const WIDTH = 640
const HEIGHT = 480
const NODE_RADIUS = 26
const CLICK_THRESHOLD = 5 // pixels

const TYPE_COLORS: Record<WorldEntryType, { fill: string; stroke: string; label: string }> = {
  character: { fill: 'hsl(38 92% 58% / 0.16)', stroke: 'hsl(38 92% 58%)', label: '角色' },
  location:  { fill: 'hsl(162 44% 55% / 0.16)', stroke: 'hsl(162 44% 55%)', label: '地点' },
  rule:      { fill: 'hsl(260 42% 70% / 0.18)', stroke: 'hsl(260 42% 70%)', label: '规则' },
  timeline:  { fill: 'hsl(40 14% 92% / 0.12)', stroke: 'hsl(40 14% 92% / 0.8)', label: '时间' },
}

interface InteractiveRelationGraphProps {
  projectId: string
  entries: WorldEntry[]
  relations: Relation[]
  onEditEntry: (entry: WorldEntry) => void
  onCreateRelation: (sourceId: string, targetId: string, category: string, description: string) => Promise<void>
}

interface DragState {
  nodeId: string
  startX: number
  startY: number
  hasMoved: boolean
}

export function InteractiveRelationGraph({
  projectId,
  entries,
  relations,
  onEditEntry,
  onCreateRelation,
}: InteractiveRelationGraphProps) {
  const activeEntries = useMemo(() => entries.filter(e => !e.deletedAt), [entries])

  // Load saved positions
  const [savedPositions, setSavedPositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [lastAnalyzedNodeId, setLastAnalyzedNodeId] = useState<string | null>(null)

  // AI recommendation state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendationTarget[]>([])
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Relation form state
  const [pendingRelation, setPendingRelation] = useState<{
    sourceNode: WorldEntry
    recommendation: AIRecommendationTarget
  } | null>(null)

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Load saved positions on mount
  useEffect(() => {
    loadLayoutSnapshots(projectId).then(snapshots => {
      const positions = new Map<string, { x: number; y: number }>()
      snapshots.forEach((snap, nodeId) => {
        positions.set(nodeId, { x: snap.x, y: snap.y })
      })
      setSavedPositions(positions)
    })
  }, [projectId])

  // Compute layout with saved positions
  const layout = useMemo(() => {
    if (activeEntries.length === 0) return { nodes: [] as GraphNode[], byId: new Map<string, GraphNode>() }

    const centerX = WIDTH / 2
    const centerY = HEIGHT / 2
    const radius = Math.min(WIDTH, HEIGHT) / 3

    const seed: GraphNode[] = activeEntries.map((entry, i) => {
      const saved = savedPositions.get(entry.id)
      if (saved) {
        return { id: entry.id, x: saved.x, y: saved.y, vx: 0, vy: 0 }
      }
      const angle = (i / activeEntries.length) * Math.PI * 2
      return {
        id: entry.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      }
    })

    // Apply saved fx/fy for fixed nodes during drag
    if (dragState?.hasMoved) {
      const node = seed.find(n => n.id === dragState.nodeId)
      if (node) {
        node.fx = node.x
        node.fy = node.y
      }
    }

    const activeIds = new Set(activeEntries.map(e => e.id))
    const edges = relations
      .filter(r => !r.deletedAt && activeIds.has(r.sourceEntryId) && activeIds.has(r.targetEntryId))
      .map(r => ({ source: r.sourceEntryId, target: r.targetEntryId }))

    const positioned = layoutForceDirected(seed, edges, { width: WIDTH, height: HEIGHT })
    const byId = new Map(positioned.map(n => [n.id, n]))
    return { nodes: positioned, byId }
  }, [activeEntries, relations, savedPositions, dragState])

  const activeRelations = useMemo(() => {
    const activeIds = new Set(activeEntries.map(e => e.id))
    return relations.filter(
      r => !r.deletedAt && activeIds.has(r.sourceEntryId) && activeIds.has(r.targetEntryId)
    )
  }, [relations, activeEntries])

  const entryById = useMemo(() => new Map(activeEntries.map(e => [e.id, e])), [activeEntries])

  // Analyze a node - extracted for reuse in handleNodeClick and onRetry
  const analyzeNode = useCallback(async (nodeId: string) => {
    const entry = entryById.get(nodeId)
    if (!entry) return

    // Set selected node and position
    setSelectedNodeId(nodeId)
    setLastAnalyzedNodeId(nodeId)
    setIsAnalyzing(true)
    setAnalysisError(null)
    setRecommendations([])

    // Get panel position from node
    const nodeLayout = layout.byId.get(nodeId)
    if (nodeLayout && svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect()
      const scaleX = svgRect.width / WIDTH
      const scaleY = svgRect.height / HEIGHT
      setPanelPosition({
        x: svgRect.left + nodeLayout.x * scaleX,
        y: svgRect.top + nodeLayout.y * scaleY,
      })
    }

    try {
      const createdRelations = relations
        .filter(r => !r.deletedAt && r.sourceEntryId === nodeId)
        .map(r => {
          const target = entryById.get(r.targetEntryId)
          return {
            targetId: r.targetEntryId,
            targetName: target?.name ?? '',
            category: r.category,
          }
        })

      const result = await getRelationRecommendations(projectId, {
        sourceNode: {
          id: entry.id,
          name: entry.name,
          type: entry.type,
          description: entry.description || entry.background || '',
          createdRelations,
        },
        allEntries: activeEntries,
      })

      setRecommendations(result.recommendations)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setIsAnalyzing(false)
    }
  }, [entryById, layout, projectId, relations, activeEntries])

  // Handle node click - trigger AI analysis
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNodeClick = useCallback(async (nodeId: string, _event: React.MouseEvent) => {
    if (dragState?.hasMoved) return
    await analyzeNode(nodeId)
  }, [dragState, analyzeNode])

  // Handle mouse down for drag
  const handleMouseDown = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const nodeLayout = layout.byId.get(nodeId)
    if (!nodeLayout) return

    setDragState({
      nodeId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    })
  }, [layout])

  // Handle mouse move
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState || !svgRef.current) return

    const dx = event.clientX - dragState.startX
    const dy = event.clientY - dragState.startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > CLICK_THRESHOLD) {
      setDragState(prev => prev ? { ...prev, hasMoved: true } : null)

      // Update node position directly (not through state to avoid lag)
      const node = layout.nodes.find(n => n.id === dragState.nodeId)
      if (node) {
        const svgRect = svgRef.current!.getBoundingClientRect()
        const scaleX = WIDTH / svgRect.width
        const scaleY = HEIGHT / svgRect.height

        // Calculate new position based on drag delta

        // Get original position to calculate offset
        const saved = savedPositions.get(dragState.nodeId)
        const baseX = saved?.x ?? node.x
        const baseY = saved?.y ?? node.y

        node.x = Math.max(30, Math.min(WIDTH - 30, baseX + dx * scaleX))
        node.y = Math.max(30, Math.min(HEIGHT - 30, baseY + dy * scaleY))

        // Force re-render
        setSavedPositions(prev => new Map(prev))
      }
    }
  }, [dragState, layout, savedPositions])

  // Handle mouse up
  const handleMouseUp = useCallback(async () => {
    if (!dragState || !dragState.hasMoved) {
      setDragState(null)
      return
    }

    // Save the new position
    const nodeLayout = layout.byId.get(dragState.nodeId)
    if (nodeLayout) {
      await saveLayoutSnapshot(projectId, 'default', dragState.nodeId, nodeLayout.x, nodeLayout.y)
    }

    setDragState(null)
  }, [dragState, layout, projectId])

  // Handle recommendation selection
  const handleSelectRecommendation = useCallback((rec: AIRecommendationTarget) => {
    const sourceNode = entryById.get(selectedNodeId!)
    if (!sourceNode) return

    setPendingRelation({ sourceNode, recommendation: rec })
    setSelectedNodeId(null)
  }, [entryById, selectedNodeId])

  // Handle relation creation
  const handleConfirmRelation = useCallback(async (category: string, description: string) => {
    if (!pendingRelation) return

    const targetId = pendingRelation.recommendation.targetNode.id
    if (!targetId) {
      throw new Error('目标节点 ID 不存在')
    }

    await onCreateRelation(
      pendingRelation.sourceNode.id,
      targetId,
      category,
      description
    )

    setPendingRelation(null)
  }, [pendingRelation, onCreateRelation])

  // Handle double-click to edit
  const handleDoubleClick = useCallback((nodeId: string) => {
    const entry = entryById.get(nodeId)
    if (entry) {
      onEditEntry(entry)
    }
  }, [entryById, onEditEntry])

  if (activeEntries.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-sm font-medium mb-1">暂无世界观条目</p>
        <p className="text-xs text-muted-foreground">
          在左侧「世界观」标签页创建角色、地点等条目后，关系图会自动呈现。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Legend />

      {/* AI Recommendation Panel */}
      {selectedNodeId && entryById.get(selectedNodeId) && (
        <RecommendationPanel
          sourceNode={entryById.get(selectedNodeId)!}
          recommendations={recommendations}
          isLoading={isAnalyzing}
          error={analysisError}
          onRetry={() => {
            if (lastAnalyzedNodeId) {
              analyzeNode(lastAnalyzedNodeId)
            }
          }}
          onSelectRecommendation={handleSelectRecommendation}
          onClose={() => setSelectedNodeId(null)}
          position={panelPosition}
        />
      )}

      {/* Relation Confirmation Form */}
      {pendingRelation && (
        <RelationForm
          sourceNode={pendingRelation.sourceNode}
          recommendation={pendingRelation.recommendation}
          onConfirm={handleConfirmRelation}
          onCancel={() => setPendingRelation(null)}
        />
      )}

      <div
        className="rounded-[var(--radius-card)] surface-2 film-edge overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto cursor-grab active:cursor-grabbing"
          role="img"
          aria-label="世界观条目关系图"
        >
          {/* Relations */}
          {activeRelations.map(rel => {
            const s = layout.byId.get(rel.sourceEntryId)
            const t = layout.byId.get(rel.targetEntryId)
            if (!s || !t) return null
            const mx = (s.x + t.x) / 2
            const my = (s.y + t.y) / 2
            return (
              <g key={rel.id}>
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="hsl(237 231 220 / 0.15)"
                  strokeWidth={1}
                />
                {rel.sourceToTargetLabel && (
                  <text
                    x={mx}
                    y={my}
                    className="fill-muted-foreground"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {rel.sourceToTargetLabel}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {layout.nodes.map(node => {
            const entry = entryById.get(node.id)
            if (!entry) return null
            const color = TYPE_COLORS[entry.type]
            const isSelected = selectedNodeId === node.id
            const isDragging = dragState?.nodeId === node.id

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(node.id, e)}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onDoubleClick={() => handleDoubleClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={NODE_RADIUS}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isSelected ? 2.5 : isDragging ? 2 : 1.5}
                  className="transition-all"
                />
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize={12}
                  className="fill-foreground pointer-events-none"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  {truncate(entry.name, 4)}
                </text>
                {/* Fixed node indicator */}
                {node.fx !== undefined && (
                  <text
                    x={-NODE_RADIUS + 4}
                    y={-NODE_RADIUS + 8}
                    fontSize={8}
                    className="fill-muted-foreground"
                  >
                    ✦
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(Object.keys(TYPE_COLORS) as WorldEntryType[]).map(type => (
        <div key={type} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: TYPE_COLORS[type].fill, borderColor: TYPE_COLORS[type].stroke }}
          />
          <span className="text-muted-foreground">{TYPE_COLORS[type].label}</span>
        </div>
      ))}
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}
