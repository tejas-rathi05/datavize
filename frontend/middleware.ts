import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for auth routes - they handle auth client-side
  if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup')) {
    return res
  }

  // Skip middleware for dashboard routes - they handle auth client-side
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    return res
  }

  // For other routes, check if user is authenticated via Zustand store
  // Since middleware runs on the server, we'll check the request headers
  // The client-side auth will handle redirects for protected routes
  
  // For now, allow all other routes to pass through
  // The client-side components will handle authentication checks
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
