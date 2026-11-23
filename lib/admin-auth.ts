import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE = 'gawa_admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 8

type SessionPayload = { username: string; expiresAt: number }

function configuredCredentials() {
  return {
    username: (process.env.ADMIN_EMAIL ?? process.env.ADMIN_USERNAME ?? '').trim(),
    password: process.env.ADMIN_PASSWORD ?? '',
  }
}

function sign(value: string) {
  const secret = configuredCredentials().password
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function hasAdminCredentials() {
  const credentials = configuredCredentials()
  return Boolean(credentials.username && credentials.password)
}

export function validateAdminCredentials(username: string, password: string) {
  const credentials = configuredCredentials()
  return Boolean(
    credentials.username &&
      credentials.password &&
      safeCompare(username.trim(), credentials.username) &&
      safeCompare(password, credentials.password),
  )
}

export function createAdminSession() {
  const credentials = configuredCredentials()
  const payload: SessionPayload = {
    username: credentials.username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return { value: `${encoded}.${sign(encoded)}`, maxAge: SESSION_DURATION_SECONDS }
}

export function verifyAdminSession(value?: string) {
  if (!value || !hasAdminCredentials()) return false

  const [encoded, signature, extra] = value.split('.')
  if (!encoded || !signature || extra) return false

  try {
    if (!safeCompare(signature, sign(encoded))) return false
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    const credentials = configuredCredentials()
    return payload.username === credentials.username && payload.expiresAt > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  return verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)
}
