'use client'

import { useState } from 'react'
import { signIn, signUp } from './actions'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    } else if (result?.success && mode === 'register') {
      // D-10: Show verification sent message
      setSuccess('验证邮件已发送，请查看邮箱')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm">
        {/* Tab toggle */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
            className={`flex-1 pb-4 text-center font-medium ${
              mode === 'login' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
            className={`flex-1 pb-4 text-center font-medium ${
              mode === 'register' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* D-14: Forgot password link on login page */}
          {mode === 'login' && (
            <div className="text-right">
              <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                忘记密码？
              </a>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">
              {/* D-20: Generic error message */}
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
