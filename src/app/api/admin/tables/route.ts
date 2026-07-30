import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  tableId: z.string().min(1),
  status: z.enum(['AVAILABLE', 'PENDING', 'RESERVED', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE']),
  /** Optional manual block window, used by BLOCKED and MAINTENANCE. */
  blockedUntil: z.string().datetime().nullable().optional(),
})

/**
 * Set a table's status from the floor-plan editor.
 *
 * The session is re-checked here rather than relying on middleware, which only
 * guards navigation — a route handler can be called directly.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const { tableId, status, blockedUntil } = parsed.data

  const before = await prisma.restaurantTable.findUnique({ where: { id: tableId } })
  if (!before) return NextResponse.json({ error: 'Table not found.' }, { status: 404 })

  const holdsWindow = status === 'BLOCKED' || status === 'MAINTENANCE'

  const [after] = await prisma.$transaction([
    prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        status,
        blockedFrom: holdsWindow ? new Date() : null,
        blockedTo: holdsWindow && blockedUntil ? new Date(blockedUntil) : null,
      },
    }),
    // Every manual override is logged: a table that silently changed state is
    // impossible to explain to a guest who was turned away.
    prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        action: 'table.status',
        entity: 'RestaurantTable',
        entityId: tableId,
        before: { status: before.status },
        after: { status },
      },
    }),
  ])

  return NextResponse.json({ ok: true, table: { id: after.id, status: after.status } })
}
