'use client'

import { useMemo } from 'react'
import type { WorldEntry, Relation, WorldEntryType } from '@/lib/types'
import { layoutForceDirected, type GraphNode } from '@/lib/analysis/force-layout'

const WIDTH = 640
const HEIGHT = 480

const TYPE_COLORS: Record<WorldEntryType, { fill: string; stroke: string; label: string }> = {
  character: { fill: 'hsl(38 92% 58% / 0.16)', stroke: 'hsl(38 92% 58%)', label: '角色' },
  location:  { fill: 'hsl(162 44% 55% / 0.16)', stroke: 'hsl(162 44% 55%)', label: '地点' },
  rule:      { fill: 'hsl(260 42% 70% / 0.18)', stroke: 'hsl(260 42% 70%)', label: '规则' },
  timeline:  { fill: 'hsl(40 14% 92% / 0.12)', stroke: 'hsl(40 14% 92% / 0.8)', label: '时间' },
}

interface RelationGraphProps {
  entries: WorldEntry[]
  relations: Relation[]
}

export function RelationGraph({ entries, relations }: RelationGraphProps) {
  const activeEntries = useMemo(() => entries.filter(e => !e.deletedAt), [entries])

  const layout = useMemo(() => {
    if (activeEntries.length === 0) return { nodes: [] as GraphNode[], byId: new Map<string, GraphNode>() }
    // Seed positions on a circle to give the simulation something stable to start from.
    const centerX = WIDTH / 2
    const centerY = HEIGHT / 2
    const radius = Math.min(WIDTH, HEIGHT) / 3
    const seed: GraphNode[] = activeEntries.map((entry, i) => {
      const angle = (i / activeEntries.length) * Math.PI * 2
      return {
        id: entry.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      }
    })
    const activeIds = new Set(activeEntries.map(e => e.id))
    const edges = relations
      .filter(r => !r.deletedAt && activeIds.has(r.sourceEntryId) && activeIds.has(r.targetEntryId))
      .map(r => ({ source: r.sourceEntryId, target: r.targetEntryId }))
    const positioned = layoutForceDirected(seed, edges, {
      width: WIDTH,
      height: HEIGHT,
    })
    const byId = new Map(positioned.map(n => [n.id, n]))
    return { nodes: positioned, byId }
  }, [activeEntries, relations])

  const activeRelations = useMemo(() => {
    const activeIds = new Set(activeEntries.map(e => e.id))
    return relations.filter(
      r => !r.deletedAt && activeIds.has(r.sourceEntryId) && activeIds.has(r.targetEntryId)
    )
  }, [relations, activeEntries])

  const entryById = useMemo(
    () => new Map(activeEntries.map(e => [e.id, e])),
    [activeEntries]
  )

  if (activeEntries.length === 0) {
    return (
      <EmptyState
        title="暂无世界观条目"
        description="在左侧「世界观」标签页创建角色、地点等条目后，关系图会自动呈现。"
      />
    )
  }

  return (
    <div className="space-y-3">
      <Legend />
      <div className="rounded-[var(--radius-card)] surface-2 film-edge overflow-hidden">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="世界观条目关系图"
        >
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
                  stroke="hsl(var(--accent-amber))"
                  strokeOpacity={0.22}
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
          {layout.nodes.map(node => {
            const entry = entryById.get(node.id)
            if (!entry) return null
            const color = TYPE_COLORS[entry.type]
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={26}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={1.5}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  className="fill-foreground"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  {truncate(entry.name, 4)}
                </text>
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border rounded-md p-8 text-center">
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}
