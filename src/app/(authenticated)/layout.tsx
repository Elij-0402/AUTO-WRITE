import { createClient } from '@/lib/supabase/server'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // This layout is only reached for authenticated users (middleware handles redirects)
  // But we could add a loading state or user context here if needed
  return <>{children}</>
}
