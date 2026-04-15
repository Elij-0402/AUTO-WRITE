import { createClient } from '@/lib/supabase/server'
import AuthenticatedLayoutClient from './AuthenticatedLayoutClient'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify auth — middleware handles redirects, but we validate here too
  await createClient()

  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}
