import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    'NEW',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'CANCELLED',
  ]),
  /** Set only when money has actually changed hands at the counter. */
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  reason: z.string().trim().max(500).optional(),
})

/**
 * Move a pickup order through its kitchen lifecycle.
 *
 * Like reservations, the change is audited rather than silently overwritten —
 * "who cancelled this order" has to be answerable. `paymentStatus` is a separate
 * opt-in field: completing an order does not mark it paid, because the two are
 * genuinely different facts and no payment provider is wired up.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const { orderId, status, paymentStatus, reason } = parsed.data

  const current = await prisma.order.findUnique({ where: { id: orderId } })
  if (!current) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const now = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(status === 'CONFIRMED' && !current.confirmedAt ? { confirmedAt: now } : {}),
        ...(status === 'READY_FOR_PICKUP' && !current.readyAt ? { readyAt: now } : {}),
        ...(status === 'COMPLETED' ? { completedAt: now } : {}),
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        action: 'order.status',
        entity: 'Order',
        entityId: orderId,
        before: { status: current.status, paymentStatus: current.paymentStatus },
        after: { status, paymentStatus: paymentStatus ?? current.paymentStatus, reason: reason ?? null },
      },
    })

    return order
  })

  return NextResponse.json({
    ok: true,
    status: updated.status,
    paymentStatus: updated.paymentStatus,
  })
}
