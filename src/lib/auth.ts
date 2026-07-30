import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db'

export const SESSION_COOKIE = 'vr_admin'
const MAX_AGE_SECONDS = 60 * 60 * 8

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF'
export type Session = { userId: string; email: string; name: string; role: Role }

function secret() {
  const value = process.env.AUTH_SECRET
  // Failing loudly beats signing sessions with a fallback key that anyone
  // reading the source could forge.
  if (!value) throw new Error('AUTH_SECRET is not set — refusing to issue sessions.')
  return new TextEncoder().encode(value)
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret())

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function readSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/** How many failures from one key before it is locked out, and for how long. */
const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

/**
 * Verify credentials, throttled per IP+email.
 *
 * Always runs bcrypt.compare, even when the account does not exist, against a
 * dummy hash. Returning early on an unknown email would make it measurably
 * faster than a wrong password and turn the form into an account enumerator.
 */
const DUMMY_HASH = '$2a$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRS'

export async function verifyCredentials(email: string, password: string, ip: string) {
  const key = `${ip}|${email.toLowerCase()}`
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000)

  const recentFailures = await prisma.loginAttempt.count({
    where: { key, success: false, createdAt: { gte: since } },
  })
  if (recentFailures >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: 'RATE_LIMITED' as const }
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

  if (!user || !user.isActive || !matches) {
    await prisma.loginAttempt.create({ data: { key, ip, email, success: false } })
    return { ok: false as const, reason: 'INVALID' as const }
  }

  await prisma.loginAttempt.create({ data: { key, ip, email, success: true } })
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  return {
    ok: true as const,
    session: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    },
  }
}

/** Guard for server components and route handlers. */
export async function requireSession(): Promise<Session> {
  const session = await readSession()
  if (!session) throw new Error('UNAUTHORISED')
  return session
}
