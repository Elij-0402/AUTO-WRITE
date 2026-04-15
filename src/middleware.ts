import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  
  const pathname = request.nextUrl.pathname
  
  // D-49: Unauthenticated access to protected routes → redirect to /auth with return URL
  if (!user && !pathname.startsWith('/auth')) {
    const returnUrl = encodeURIComponent(pathname + request.nextUrl.search)
    return NextResponse.redirect(new URL(`/auth?returnUrl=${returnUrl}`, request.url))
  }
  
  // D-50: After login → redirect to original requested page
  if (user && pathname === '/auth') {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl')
    if (returnUrl) {
      return NextResponse.redirect(new URL(decodeURIComponent(returnUrl), request.url))
    }
    return NextResponse.redirect(new URL('/projects', request.url))
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
