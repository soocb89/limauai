import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'
  const isApiAuth = pathname.startsWith('/api/auth')

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next()

  const session = request.cookies.get('admin_session')?.value
  const valid = session === process.env.SESSION_SECRET

  if (!valid) {
    if (isLoginPage) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in, don't show login page again
  if (isLoginPage) return NextResponse.redirect(new URL('/dashboard', request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
