/**
 * Force-directed graph layout using a tiny DIY simulation.
 * 200 iterations, O(n²) Coulomb repulsion + Hooke attraction on edges.
 * Fine for up to ~80 nodes which covers realistic novel casts; beyond that
 * we'd swap in d3-force or a quadtree-based Barnes-Hut.
 */

export interface GraphNode {
  id: string
  /** Position — mutated in place during simulation. */
  x: number
  y: number
  vx: number
  vy: number
}

export interface GraphEdge {
  source: string
  target: string
}

export interface LayoutOptions {
  width: number
  height: number
  iterations?: number
  /** Coulomb constant — higher = stronger repulsion. */
  repulsion?: number
  /** Hooke constant — higher = stiffer edges. */
  attraction?: number
  /** Ideal edge length. */
  linkDistance?: number
  /** Center attraction strength. */
  centerStrength?: number
}

export function layoutForceDirected(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: LayoutOptions
): GraphNode[] {
  const {
    width,
    height,
    iterations = 200,
    repulsion = 3500,
    attraction = 0.04,
    linkDistance = 100,
    centerStrength = 0.01,
  } = options

  const cx = width / 2
  const cy = height / 2
  const nodeById = new Map(nodes.map(n => [n.id, n]))

  for (let iter = 0; iter < iterations; iter++) {
    // Pairwise repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let distSq = dx * dx + dy * dy
        if (distSq < 0.01) {
          dx = Math.random() - 0.5
          dy = Math.random() - 0.5
          distSq = dx * dx + dy * dy
        }
        const dist = Math.sqrt(distSq)
        const force = repulsion / distSq
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
    }

    // Edge attraction
    for (const edge of edges) {
      const a = nodeById.get(edge.source)
      const b = nodeById.get(edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const delta = dist - linkDistance
      const fx = attraction * delta * (dx / dist)
      const fy = attraction * delta * (dy / dist)
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // Center bias + damping + integration
    const damping = 0.85
    for (const n of nodes) {
      n.vx += (cx - n.x) * centerStrength
      n.vy += (cy - n.y) * centerStrength
      n.vx *= damping
      n.vy *= damping
      n.x += n.vx
      n.y += n.vy
      // Clamp inside bounds (padding 30)
      n.x = Math.max(30, Math.min(width - 30, n.x))
      n.y = Math.max(30, Math.min(height - 30, n.y))
    }
  }

  return nodes
}
