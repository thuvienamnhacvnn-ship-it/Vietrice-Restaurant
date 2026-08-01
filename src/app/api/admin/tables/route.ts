import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_BUSY_MINUTES } from '@/lib/floor'

export const dynamic = 'force-dynamic'

const TABLE_STATUS = [
  'AVAILABLE',
  'PENDING',
  'RESERVED',
  'OCCUPIED',
  'BLOCKED',
  'MAINTENANCE',
] as const

/**
 * `action` is optional and defaults to `status`, which is the shape the older
 * card-list board still posts. Dropping that would have broken a screen that
 * works, for no reason other than tidiness.
 */
const schema = z.object({
  tableId: z.string().min(1),
  action: z.enum(['status', 'seat', 'free', 'lock', 'unlock']).default('status'),
  status: z.enum(TABLE_STATUS).optional(),
  /**
   * Duration in minutes. For `lock`, omitting it means an open-ended lock with
   * no countdown; for `seat` it falls back to the house default, because a
   * walk-in always gets a countdown — that is the whole point of the button.
   */
  minutes: z.number().int().min(1).max(600).optional(),
  /** Explicit end for a lock, when the caller has one. Wins over `minutes`. */
  blockedUntil: z.string().datetime().nullable().optional(),
})

/** Reservation states that actually hold a table. */
const HOLDING = ['PENDING', 'CALLBACK_REQUIRED', 'CONFIRMED', 'SEATED'] as const

/**
 * Floor-console writes.
 *
 * Every action here changes two things that must agree: the table's own status,
 * which is what the public floor plan draws, and the booking sitting on it,
 * which is what the guest list shows. Seating a party without moving its
 * booking to SEATED would leave the reservations screen claiming the guest had
 * not turned up. Both move together, inside one transaction, with a trail.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const { tableId, action, status, minutes, blockedUntil } = parsed.data

  if (action === 'status' && !status) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const before = await prisma.restaurantTable.findUnique({ where: { id: tableId } })
  if (!before) return NextResponse.json({ error: 'Table not found.' }, { status: 404 })

  const now = new Date()

  /** The booking whose seating window contains now, if any. */
  const held = await prisma.reservation.findFirst({
    where: {
      tableId,
      status: { in: [...HOLDING] },
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { startsAt: 'asc' },
  })

  const lockEnd = blockedUntil
    ? new Date(blockedUntil)
    : minutes
      ? new Date(now.getTime() + minutes * 60_000)
      : null

  let nextStatus: (typeof TABLE_STATUS)[number]
  let blockedFrom: Date | null = null
  let blockedTo: Date | null = null
  /** End of the walk-in countdown. Null on every action that is not seating. */
  let busyUntil: Date | null = null
  /**
   * When the table became bookable again.
   *
   * Set by everything that opens a table up, not only by `free`: from the
   * guest's side, a table released from a lock is exactly as newly-available as
   * one a party just walked away from, and the map has the same news to tell.
   */
  let freedAt: Date | null = null

  switch (action) {
    case 'seat':
      nextStatus = 'OCCUPIED'
      // A booking on the table already carries its own end time, which the
      // guest agreed to; overriding it with a generic three hours would move
      // the countdown the guest was quoted. Only a walk-in gets the default.
      busyUntil = held
        ? held.endsAt
        : new Date(now.getTime() + (minutes ?? DEFAULT_BUSY_MINUTES) * 60_000)
      break
    case 'free':
      nextStatus = 'AVAILABLE'
      freedAt = now
      break
    case 'lock':
      nextStatus = 'BLOCKED'
      blockedFrom = now
      blockedTo = lockEnd
      break
    case 'unlock':
      nextStatus = 'AVAILABLE'
      freedAt = now
      break
    default:
      nextStatus = status!
      // A hand-set BLOCKED or MAINTENANCE may still carry a window.
      if (nextStatus === 'BLOCKED' || nextStatus === 'MAINTENANCE') {
        blockedFrom = now
        blockedTo = lockEnd
      }
      if (nextStatus === 'OCCUPIED') {
        busyUntil = held ? held.endsAt : new Date(now.getTime() + (minutes ?? DEFAULT_BUSY_MINUTES) * 60_000)
      }
      if (nextStatus === 'AVAILABLE') freedAt = now
  }

  const result = await prisma.$transaction(async (tx) => {
    const table = await tx.restaurantTable.update({
      where: { id: tableId },
      data: { status: nextStatus, blockedFrom, blockedTo, busyUntil, freedAt },
    })

    // Keep the booking in step with the table.
    let bookingFrom: string | null = null
    let bookingTo: string | null = null

    if (held) {
      if (action === 'seat' && held.status !== 'SEATED') {
        bookingFrom = held.status
        bookingTo = 'SEATED'
      } else if (action === 'free' && held.status === 'SEATED') {
        bookingFrom = held.status
        bookingTo = 'COMPLETED'
      }
    }

    if (bookingFrom && bookingTo) {
      const data: Prisma.ReservationUpdateInput = {
        status: bookingTo as Prisma.ReservationUpdateInput['status'],
        version: { increment: 1 },
        ...(bookingTo === 'SEATED' ? { seatedAt: now } : { completedAt: now }),
      }

      await tx.reservation.update({ where: { id: held!.id }, data })

      await tx.reservationStatusLog.create({
        data: {
          reservationId: held!.id,
          fromStatus: bookingFrom as never,
          toStatus: bookingTo as never,
          actorId: session.userId,
          actorName: session.name,
          reason: `floor.${action}`,
        },
      })

      await tx.reservationHistory.create({
        data: {
          reservationId: held!.id,
          actorId: session.userId,
          actorName: session.name,
          action: 'STATUS_CHANGED',
          note: `${bookingFrom} → ${bookingTo} (floor plan)`,
        },
      })
    }

    // Every manual override is logged: a table that silently changed state is
    // impossible to explain to a guest who was turned away.
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        action: `table.${action}`,
        entity: 'RestaurantTable',
        entityId: tableId,
        before: {
          status: before.status,
          blockedTo: before.blockedTo?.toISOString() ?? null,
          busyUntil: before.busyUntil?.toISOString() ?? null,
        },
        after: {
          status: nextStatus,
          blockedTo: blockedTo?.toISOString() ?? null,
          busyUntil: busyUntil?.toISOString() ?? null,
          booking: bookingTo ? { id: held?.id, from: bookingFrom, to: bookingTo } : null,
        },
      },
    })

    return table
  })

  return NextResponse.json({
    ok: true,
    table: {
      id: result.id,
      status: result.status,
      blockedTo: result.blockedTo?.toISOString() ?? null,
      busyUntil: result.busyUntil?.toISOString() ?? null,
      freedAt: result.freedAt?.toISOString() ?? null,
    },
  })
}
