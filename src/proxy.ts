import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/auth'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Rate limiting (basic via IP, handled per endpoint in API if strict SQLite tracking is needed)
  // This middleware handles route protection
  
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin')
  const isAdminRoute = path.startsWith('/admin')
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  
  const sessionCookie = request.cookies.get('session')?.value

  // Verify session
  let session = null
  if (sessionCookie) {
    session = await decrypt(sessionCookie)
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth route with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Basic Admin check
  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
