'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ProjectDashboard } from '@/components/project/project-dashboard'

export default function Home() {
  useEffect(() => {
    // Check auth state and redirect if needed
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/auth')
      }
    }
    checkAuth()
  }, [])

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <ProjectDashboard />
    </main>
  )
}
