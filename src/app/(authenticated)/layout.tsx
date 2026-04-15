import { createClient } from '@/lib/supabase/server'
import AuthenticatedLayoutClient from './AuthenticatedLayoutClient'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // This layout is only reached for authenticated users (middleware handles redirects)
  return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}
