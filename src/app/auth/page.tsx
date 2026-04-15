'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from './actions'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // D-08: Tab toggle between login/register
  // D-06: Full-screen, clean, focused Notion-style layout

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
      // D-10: Show verification sent message
      setSuccess('验证邮件已发送，请查看邮箱')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 flex-col items-center justify-center text-white p-12">
        <div className="mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">InkForge</h1>
        <p className="text-blue-100 text-lg text-center">AI 驱动的小说创作工作台</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-stone-950 p-8">
        <div className="max-w-md w-full space-y-8">
          {/* Tab toggle */}
          <div className="flex border-b border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={`flex-1 pb-4 text-center font-medium ${
                mode === 'login'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
              className={`flex-1 pb-4 text-center font-medium ${
                mode === 'register'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
              />
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <a href="/auth/forgot-password" className="text-sm text-blue-500 hover:text-blue-600">
                  忘记密码？
                </a>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            {success && (
              <div className="text-green-500 text-sm text-center">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
