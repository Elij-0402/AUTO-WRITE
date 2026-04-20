import { describe, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { CitationsAnalyticsPanel } from './citations-analytics-panel'

// Mock the DB calls
vi.mock('@/lib/db/project-db', () => ({
  createProjectDB: () => ({
    abTestMetrics: { where: vi.fn().mockReturnValue({ sortBy: vi.fn().mockResolvedValue([]) }) }
  })
}))

describe('CitationsAnalyticsPanel', () => {
  it('renders without crashing', () => {
    render(<CitationsAnalyticsPanel projectId="p1" conversationId="c1" />)
  })
})