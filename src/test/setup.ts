import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock IndexedDB for Dexie.js tests
import 'fake-indexeddb/auto'

// JSDOM missing hasPointerCapture — needed by @radix-ui/react-select
Element.prototype.hasPointerCapture = vi.fn()
// JSDOM missing scrollIntoView — needed by @radix-ui/react-select
Element.prototype.scrollIntoView = vi.fn()

// Mock Supabase client for tests
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))
