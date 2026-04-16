'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ThemeProvider } from '@/components/editor/theme-provider'
import { ProjectDashboard } from '@/components/project/project-dashboard'

export default function Home() {
  // TEMP: Auth check bypassed for visual audit
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const supabase = createClient()
  //     const { data: { user } } = await supabase.auth.getUser()
  //     if (!user) {
  //       redirect('/auth')
  //     }
  //   }
  //   checkAuth()
  // }, [])

  return (
    <ThemeProvider>
      <main className="min-h-screen bg-background">
        <ProjectDashboard />
      </main>
    </ThemeProvider>
  )
}
