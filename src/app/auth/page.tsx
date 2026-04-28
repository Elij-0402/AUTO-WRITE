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
    <div className="min-h-screen surface-0 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,460px)]">
      <div className="hidden lg:flex flex-col justify-between border-r border-[hsl(var(--line))] px-16 py-14 surface-1">
        <div className="space-y-12">
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[hsl(var(--accent))]/40 bg-[hsl(var(--surface-2))]">
              <PenLine className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </div>
            <span className="font-display text-[22px] leading-none text-foreground">InkForge</span>
          </div>

          <div className="max-w-[28rem] space-y-6">
            <p className="text-[12px] text-muted-foreground">三更书房</p>
            <h1 className="font-display text-[48px] leading-[1.2] text-foreground">
              在夜里，继续把故事写深一点。
            </h1>
            <p className="font-body text-[17px] leading-[1.9] text-muted-foreground">
              这里不是通用协作面板。它更像一张安静展开的书桌，人物、章节与世界观都在同一盏灯下。
            </p>
          </div>
        </div>

        <p className="font-numeric text-[13px] text-muted-foreground">Study at Third Watch</p>
      </div>

      <div className="flex items-center justify-center px-6 py-10 sm:px-8">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="lg:hidden text-center">
            <div className="mb-5 flex items-center justify-center gap-3 text-[13px] text-muted-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[hsl(var(--accent))]/40 bg-[hsl(var(--surface-2))]">
                <PenLine className="h-4 w-4 text-primary" strokeWidth={1.8} />
              </div>
              <span className="font-display text-[22px] leading-none text-foreground">InkForge</span>
            </div>
            <p className="text-[13px] text-muted-foreground">三更书房</p>
          </div>

          <div className="border-b border-[hsl(var(--line))]">
            <div className="mb-2">
              <h2 className="font-display text-[28px] leading-[1.3] text-foreground">
                {mode === 'login' ? '回到书桌' : '开一间新书房'}
              </h2>
            </div>
            <div className="flex">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={cn(
                'relative flex-1 pb-3 text-left text-[14px] font-medium transition-colors',
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
                'relative flex-1 pb-3 text-left text-[14px] font-medium transition-colors',
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
                <a href="/auth/forgot-password" className="text-[13px] text-primary hover:underline">
                  忘记密码？
                </a>
              </div>
            )}

            {error && (
              <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{error}</div>
            )}

            {success && (
              <div className="border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 px-3 py-2 text-[13px] text-[hsl(var(--success))]">{success}</div>
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
