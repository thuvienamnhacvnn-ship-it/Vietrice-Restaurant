import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  currentPassword: z.string().min(1),
  // Long rather than "complex": length beats character-class rules, and the
  // seeded start password must not be allowed to survive as a 8-char variant.
  newPassword: z.string().min(12).max(200),
})

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Aktuelles Passwort ist falsch.' }, { status: 403 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } })
    // The hash itself is never written to the audit log — only that a change
    // happened, by whom and when.
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        actorName: session.name,
        action: 'user.password',
        entity: 'User',
        entityId: user.id,
        after: { changed: true },
      },
    })
  })

  return NextResponse.json({ ok: true })
}
