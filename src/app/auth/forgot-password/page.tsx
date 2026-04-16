'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '../actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)

    const result = await resetPassword(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>检查邮箱</CardTitle>
            <CardDescription>如果该邮箱已注册，您将收到密码重置链接</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth" className="text-sm text-primary hover:underline">
              返回登录
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-1">
          <p className="text-sm font-bold">InkForge</p>
          <CardTitle>重置密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">注册邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '发送中...' : '发送重置链接'}
            </Button>
            <div className="text-center">
              <Link href="/auth" className="text-sm text-primary hover:underline">
                返回登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
