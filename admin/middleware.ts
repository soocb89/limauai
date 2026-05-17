import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const AGENT_BLOCKED = [
  '/knowledge-base',
  '/webhooks',
  '/broadcast',
  '/scheduler',
  '/settings',
  '/corrections',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  const token = request.cookies.get('admin_session')?.value

  if (!token) {
    if (pathname === '/login') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const role = (payload.role as string) ?? 'agent'

    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (role === 'agent' && AGENT_BLOCKED.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const res = NextResponse.next()
    res.headers.set('x-user-role', role)
    return res
  } catch {
    if (pathname === '/login') return NextResponse.next()
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('admin_session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
