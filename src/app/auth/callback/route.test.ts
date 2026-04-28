import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn()
const exchangeCodeForSessionMock = vi.fn()
const createClientMock = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}))

describe('auth callback route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    exchangeCodeForSessionMock.mockResolvedValue({ error: null })
    createClientMock.mockReturnValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
      },
    })
  })

  it('exchanges the code and redirects home on success', async () => {
    const { GET } = await import('./route')

    await GET(new Request('https://example.com/auth/callback?code=good-code'))

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('good-code')
    expect(redirectMock).toHaveBeenCalledWith('/')
  })

  it('redirects back to auth when the code is missing', async () => {
    const { GET } = await import('./route')

    await GET(new Request('https://example.com/auth/callback'))

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/auth?error=missing_code')
  })

  it('redirects back to auth when the exchange fails', async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: { message: 'boom' },
    })
    const { GET } = await import('./route')

    await GET(new Request('https://example.com/auth/callback?code=bad-code'))

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('bad-code')
    expect(redirectMock).toHaveBeenCalledWith('/auth?error=callback_failed')
  })
})
