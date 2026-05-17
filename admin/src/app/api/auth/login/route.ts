import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const backendUrl = process.env.BACKEND_URL
  const backendRes = await fetch(`${backendUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!backendRes.ok) {
    const body = await backendRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: body.error ?? 'Invalid credentials' },
      { status: 401 }
    )
  }

  const { token } = await backendRes.json()

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
