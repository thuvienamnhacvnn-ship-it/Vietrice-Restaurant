import type { TableStatus, TableView } from '@/lib/reservation'
import { endOfSeating, getDemoTableViews } from '@/lib/reservation'
import { hasDatabase, prisma } from '@/lib/db'

/** Reservation states that actually hold a table. */
const BLOCKING_STATUSES = ['PENDING', 'CALLBACK_REQUIRED', 'CONFIRMED', 'SEATED'] as const

/**
 * Floor-plan availability for one seating window, read from the database.
 *
 * A table is busy when a live reservation overlaps the requested window using
 * the half-open rule `newStart < existingEnd && newEnd > existingStart`, so
 * back-to-back seatings are allowed but genuine overlaps are not. The same rule
 * runs again inside the booking transaction, which is what actually prevents
 * double-booking — this query only decides what to draw.
 *
 * Falls back to the deterministic demo floor plan when no database is
 * configured, so the public site still renders.
 */
export async function getTableViews(
  slotStart: Date,
  durationMinutes: number,
  serverNow: Date,
): Promise<TableView[]> {
  if (!hasDatabase) return getDemoTableViews(slotStart, serverNow)

  const slotEnd = endOfSeating(slotStart, durationMinutes)

  const tables = await prisma.restaurantTable.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
    include: {
      reservations: {
        where: {
          status: { in: [...BLOCKING_STATUSES] },
          startsAt: { lt: slotEnd },
          endsAt: { gt: slotStart },
        },
        orderBy: { endsAt: 'desc' },
        take: 1,
      },
    },
  })

  return tables.map((table) => {
    const holding = table.reservations[0]

    let status: TableStatus = table.status
    let busyUntilIso: string | null = null

    const manuallyLocked = table.status === 'BLOCKED' || table.status === 'MAINTENANCE'

    /**
     * Does the lock actually reach this slot?
     *
     * A lock with no end is open-ended and covers everything. A lock with one
     * covers only the window it was given — which is the whole point of the
     * countdown on the floor console. Reading the stored status alone would let
     * a fifteen-minute lock taken at lunchtime keep the table off the booking
     * form all evening, and nothing would ever clear it: there is no scheduler
     * here, so an expired lock has to stop applying by being derived rather
     * than by being written back.
     */
    const lockCoversSlot = manuallyLocked
      ? table.blockedTo
        ? (table.blockedFrom ?? new Date(0)) < slotEnd && table.blockedTo > slotStart
        : true
      : false

    if (holding) {
      // PENDING means the guest has asked but the restaurant has not called
      // back yet, so the table is held rather than occupied.
      status = holding.status === 'PENDING' ? 'PENDING' : 'OCCUPIED'
      busyUntilIso = holding.endsAt.toISOString()
    } else if (lockCoversSlot) {
      status = 'BLOCKED'
      busyUntilIso = table.blockedTo?.toISOString() ?? null
    } else if (manuallyLocked) {
      // Locked, but not for this slot. The lock has expired or has not started.
      status = 'AVAILABLE'
    } else {
      // No reservation holds this slot, so the table's own stored status wins.
      // This must NOT collapse to AVAILABLE: staff set OCCUPIED and RESERVED by
      // hand from the floor console, and defaulting here would silently hand a
      // walk-in's table back to the booking form.
      status = table.status

      /**
       * A walk-in's countdown, shown to guests the same way a booking's is.
       *
       * Note what does NOT happen here: an elapsed `busyUntil` does not free
       * the table. Unlike a lock, which is a decision about the future and can
       * safely expire, this is a guess about a party that is physically sitting
       * there. Three hours passing is not evidence they left, and reopening the
       * table on that guess would sell a seat with someone already in it. The
       * console flags it as overdue instead, and a human ends it.
       */
      if (status === 'OCCUPIED' && table.busyUntil) {
        busyUntilIso = table.busyUntil.toISOString()
      }
    }

    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      minCapacity: table.minCapacity,
      gridRow: table.gridRow,
      gridCol: table.gridCol,
      shape: table.shape === 'round' ? 'round' : 'square',
      zone: table.zone ?? '',
      status,
      busyUntilIso,
      // Only news while the table is actually free — a table freed and then
      // immediately re-seated has nothing to announce.
      freedAtIso: status === 'AVAILABLE' ? (table.freedAt?.toISOString() ?? null) : null,
    }
  })
}
