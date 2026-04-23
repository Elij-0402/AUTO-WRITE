'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine } from 'lucide-react'
import { signIn, signUp } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = mode === 'login'
      ? await signIn(formData)
      : await signUp(formData)

    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success && mode === 'login') {
      router.push('/')
    } else if (result?.success && mode === 'register') {
      setSuccess('验证邮件已发送，请查看邮箱')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex surface-0">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 surface-1 divider-hair-v">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-[var(--radius-dialog)] bg-primary">
          <PenLine className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <h1 className="mb-4 text-[40px] font-semibold tracking-tight text-foreground">
          InkForge
        </h1>
        <p className="text-[14px] text-muted-foreground text-center">
          AI 小说创作工作台
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-[360px] w-full space-y-6">
          <div className="lg:hidden text-center mb-4">
            <h1 className="text-[26px] font-semibold tracking-tight">InkForge</h1>
            <p className="text-[13px] text-muted-foreground">AI 小说创作</p>
          </div>

          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 pb-3 text-center text-[14px] font-medium transition-colors relative',
                mode === 'login'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              登录
              {mode === 'login' && (
                <span aria-hidden className="absolute left-0 right-0 -bottom-px h-[2px] bg-[hsl(var(--accent))]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 pb-3 text-center text-[14px] font-medium transition-colors relative',
                mode === 'register'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              注册
              {mode === 'register' && (
                <span aria-hidden className="absolute left-0 right-0 -bottom-px h-[2px] bg-[hsl(var(--accent))]" />
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <a href="/auth/forgot-password" className="text-[13px] text-[hsl(var(--accent))] hover:underline">
                  忘记密码？
                </a>
              </div>
            )}

            {error && (
              <div className="text-destructive text-[13px] text-center">{error}</div>
            )}

            {success && (
              <div className="text-[hsl(var(--accent-jade))] text-[13px] text-center">{success}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
