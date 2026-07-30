import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  reservationId: z.string().min(1),
  status: z.enum([
    'PENDING',
    'CALLBACK_REQUIRED',
    'CONFIRMED',
    'SEATED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  /** Outcome of the confirmation call, when the change came from one. */
  callOutcome: z
    .enum(['CONFIRMED', 'NO_ANSWER', 'REJECTED', 'CANCELLED', 'CALLBACK_REQUIRED'])
    .optional(),
  reason: z.string().trim().max(500).optional(),
})

/**
 * Move a reservation through its lifecycle.
 *
 * Status is never simply overwritten: every transition appends a status log and
 * a history entry recording who did it and why. Overwriting alone would leave
 * no way to answer "who cancelled this booking and when", which is the first
 * question asked when a guest turns up to a table that was given away.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const { reservationId, status, callOutcome, reason } = parsed.data

  const current = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!current) return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })

  const now = new Date()
  const releases = status === 'REJECTED' || status === 'CANCELLED' || status === 'NO_SHOW'

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status,
        ...(status === 'SEATED' ? { seatedAt: now } : {}),
        ...(status === 'COMPLETED' ? { completedAt: now } : {}),
        ...(releases ? { cancelledAt: now, cancelReason: reason ?? null } : {}),
        version: { increment: 1 },
      },
    })

    await tx.reservationStatusLog.create({
      data: {
        reservationId,
        fromStatus: current.status,
        toStatus: status,
        actorId: session.userId,
        actorName: session.name,
        reason: reason ?? null,
      },
    })

    await tx.reservationHistory.create({
      data: {
        reservationId,
        actorId: session.userId,
        actorName: session.name,
        action: callOutcome ? 'CALL_PLACED' : 'STATUS_CHANGED',
        callOutcome: callOutcome ?? null,
        calledAt: callOutcome ? now : null,
        callbackAt: callOutcome === 'NO_ANSWER' ? new Date(now.getTime() + 30 * 60_000) : null,
        reason: reason ?? null,
        note: `${current.status} → ${status}`,
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        action: 'reservation.status',
        entity: 'Reservation',
        entityId: reservationId,
        before: { status: current.status },
        after: { status },
      },
    })

    return res
  })

  return NextResponse.json({ ok: true, status: updated.status })
}
