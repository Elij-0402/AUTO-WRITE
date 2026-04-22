'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Simple in-memory rate limiter for Server Actions.
// Tracks attempts by IP + email combination.
// Resets on server restart (appropriate for BYOK self-hosted deployment).

interface RateLimitEntry {
  count: number
  resetAt: number // timestamp in ms
}

// Sliding window: 5 attempts per 60 seconds per IP+email
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5

// Module-level store — persists across action calls in same process
const attempts = new Map<string, RateLimitEntry>()

function rateLimitKey(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`
}

function checkRateLimit(ip: string, email: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const key = rateLimitKey(ip, email)
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    // No record or window expired — allow and record first attempt
    const newEntry = { count: 1, resetAt: now + WINDOW_MS }
    attempts.set(key, newEntry)
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = entry.resetAt - now
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterMs: 0 }
}

async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = headersList.get('x-real-ip')
  if (realIP) return realIP.trim()
  return '127.0.0.1'
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const ip = await getClientIP()
  const rl = checkRateLimit(ip, email)
  if (!rl.allowed) {
    return { error: '请求过于频繁，请稍后再试' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'verification_sent' }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const ip = await getClientIP()
  const rl = checkRateLimit(ip, email)
  if (!rl.allowed) {
    return { error: '请求过于频繁，请稍后再试' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: '邮箱或密码错误' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth')
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const ip = await getClientIP()
  const rl = checkRateLimit(ip, email)
  if (!rl.allowed) {
    return { error: '请求过于频繁，请稍后再试' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}