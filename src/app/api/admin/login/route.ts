import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createSession, verifyCredentials } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  const parsed = schema.safeParse(payload)
  // Deliberately vague: telling the caller which field was malformed helps
  // nobody but someone probing the form.
  if (!parsed.success) {
    return NextResponse.json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 401 })
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const result = await verifyCredentials(parsed.data.email, parsed.data.password, ip)

  if (!result.ok) {
    if (result.reason === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Zu viele Versuche. Bitte warten Sie 15 Minuten.' },
        { status: 429 },
      )
    }
    return NextResponse.json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 401 })
  }

  await createSession(result.session)
  return NextResponse.json({ ok: true, name: result.session.name, role: result.session.role })
}
