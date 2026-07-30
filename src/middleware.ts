import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

import { SESSION_COOKIE } from '@/lib/auth'

/**
 * Gate every /admin route behind a valid session.
 *
 * This only stops unauthenticated *navigation* — it is a redirect, not the
 * security boundary. Each admin action re-checks the session server-side,
 * because middleware can be bypassed by calling a route handler directly.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const secret = process.env.AUTH_SECRET

  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret))
      return NextResponse.next()
    } catch {
      // Expired or tampered — fall through to the redirect.
    }
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*'] }
