import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'
const API_KEY = process.env.ADMIN_API_KEY ?? ''

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const segment = params.path.join('/')
  const { search } = new URL(req.url)
  const upstream = `${BACKEND_URL}/admin/${segment}${search}`

  const contentType = req.headers.get('Content-Type') ?? ''
  const isMultipart = contentType.includes('multipart/form-data')

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? isMultipart
        ? Buffer.from(await req.arrayBuffer())
        : await req.text()
      : undefined

  const headers: Record<string, string> = { 'x-api-key': API_KEY }
  if (isMultipart) {
    headers['Content-Type'] = contentType
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(upstream, { method: req.method, headers, body })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  })
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
