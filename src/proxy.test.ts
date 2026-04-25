import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock updateSession from supabase middleware so we can control the
// authenticated user without touching real Supabase.
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))

import { proxy } from './proxy'
import { updateSession } from '@/lib/supabase/middleware'

const mockedUpdateSession = vi.mocked(updateSession)

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url))
}

function setUser(user: unknown) {
  // updateSession returns supabaseResponse + user. The proxy only reads `user`
  // and forwards `supabaseResponse` when no redirect is needed.
  const supabaseResponse = NextResponse.next()
  mockedUpdateSession.mockResolvedValue({
    supabaseResponse,
    user,
    // supabase client is unused by proxy; cast to satisfy the return shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
  return supabaseResponse
}

describe('proxy', () => {
  beforeEach(() => {
    mockedUpdateSession.mockReset()
  })

  describe('anonymous users (offline-first contract)', () => {
    it('does NOT redirect anonymous request to / away to /auth', async () => {
      const supabaseResponse = setUser(null)
      const req = makeRequest('http://localhost:3000/')

      const res = await proxy(req)

      // Should return the original supabaseResponse — no redirect
      expect(res).toBe(supabaseResponse)
      // No redirect Location pointing to /auth
      const location = res.headers.get('location')
      expect(location).toBeNull()
    })

    it('does NOT redirect anonymous request to /projects/abc', async () => {
      const supabaseResponse = setUser(null)
      const req = makeRequest('http://localhost:3000/projects/abc')

      const res = await proxy(req)

      expect(res).toBe(supabaseResponse)
      const location = res.headers.get('location')
      expect(location).toBeNull()
    })

    it('passes /api/foo through for anonymous user', async () => {
      const supabaseResponse = setUser(null)
      const req = makeRequest('http://localhost:3000/api/foo')

      const res = await proxy(req)

      expect(res).toBe(supabaseResponse)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('logged-in users (post-login bounce away from /auth)', () => {
    it('redirects logged-in user from /auth?returnUrl=/projects/x back to /projects/x', async () => {
      setUser({ id: 'user-1' })
      const req = makeRequest(
        'http://localhost:3000/auth?returnUrl=' + encodeURIComponent('/projects/x')
      )

      const res = await proxy(req)

      // 307 / 308 redirect from NextResponse.redirect
      expect([307, 308]).toContain(res.status)
      const location = res.headers.get('location')
      expect(location).not.toBeNull()
      expect(new URL(location!).pathname).toBe('/projects/x')
    })

    it('redirects logged-in user from /auth (no returnUrl) to /', async () => {
      setUser({ id: 'user-1' })
      const req = makeRequest('http://localhost:3000/auth')

      const res = await proxy(req)

      expect([307, 308]).toContain(res.status)
      const location = res.headers.get('location')
      expect(location).not.toBeNull()
      expect(new URL(location!).pathname).toBe('/')
    })
  })
})
