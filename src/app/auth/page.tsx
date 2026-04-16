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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center text-foreground p-12 overflow-hidden bg-gradient-to-br from-background via-background to-card bg-grain">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,hsl(var(--primary)/0.18),transparent_70%)]"
        />
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_-8px_hsl(var(--primary)/0.5)]">
            <PenLine className="w-9 h-9 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="relative font-display text-6xl tracking-wide mb-4 text-foreground">
          InkForge
        </h1>
        <p className="relative text-muted-foreground text-base text-center italic tracking-wide">
          AI 驱动的小说创作工作台
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="lg:hidden text-center mb-4">
            <h1 className="font-display text-3xl tracking-wide">InkForge</h1>
            <p className="text-sm text-muted-foreground">AI 驱动的小说创作工作台</p>
          </div>

          <div className="flex border-b">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 pb-3 text-center text-sm font-medium transition-colors',
                mode === 'login'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
              className={cn(
                'flex-1 pb-3 text-center text-sm font-medium transition-colors',
                mode === 'register'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              注册
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
                placeholder="请输入邮箱地址"
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
                <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  忘记密码？
                </a>
              </div>
            )}

            {error && (
              <div className="text-destructive text-sm text-center">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center">{success}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
