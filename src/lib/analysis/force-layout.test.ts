import { describe, it, expect } from 'vitest'
import { layoutForceDirected, type GraphNode } from './force-layout'

describe('force-layout', () => {
  it('should keep fixed nodes at their fx/fy position', () => {
    const nodes: GraphNode[] = [
      { id: 'a', x: 100, y: 100, vx: 0, vy: 0, fx: 100, fy: 100 },
      { id: 'b', x: 200, y: 200, vx: 0, vy: 0 },
    ]
    const edges: { source: string; target: string }[] = [
      { source: 'a', target: 'b' },
    ]

    const result = layoutForceDirected(nodes, edges, {
      width: 640,
      height: 480,
      iterations: 50,
    })

    const nodeA = result.find(n => n.id === 'a')!
    const nodeB = result.find(n => n.id === 'b')!

    // Node A should stay fixed
    expect(nodeA.x).toBe(100)
    expect(nodeA.y).toBe(100)

    // Node B may move due to simulation
    expect(nodeB).toBeDefined()
  })

  it('should apply centering force to unfixed nodes', () => {
    const nodes: GraphNode[] = [
      { id: 'a', x: 10, y: 10, vx: 0, vy: 0 }, // Far from center
    ]
    const edges: { source: string; target: string }[] = []

    const result = layoutForceDirected(nodes, edges, {
      width: 640,
      height: 480,
      iterations: 100,
    })

    const nodeA = result[0]

    // Node should be pulled toward center (320, 240)
    expect(nodeA.x).toBeGreaterThan(10)
    expect(nodeA.y).toBeGreaterThan(10)
  })
})