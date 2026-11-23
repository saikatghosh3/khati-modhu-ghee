import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, createAdminSession, hasAdminCredentials, validateAdminCredentials } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Enter valid login details.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Enter valid login details.' }, { status: 400 })
  const input = body as Record<string, unknown>
  const username = typeof input.username === 'string' ? input.username : typeof input.email === 'string' ? input.email : ''
  const password = typeof input.password === 'string' ? input.password : ''

  if (!validateAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'The email or password is incorrect.' }, { status: 401 })
  }

  const session = createAdminSession()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: session.maxAge,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
