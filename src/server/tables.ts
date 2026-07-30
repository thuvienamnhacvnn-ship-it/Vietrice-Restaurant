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

    if (holding) {
      // PENDING means the guest has asked but the restaurant has not called
      // back yet, so the table is held rather than occupied.
      status = holding.status === 'PENDING' ? 'PENDING' : 'OCCUPIED'
      busyUntilIso = holding.endsAt.toISOString()
    } else if (
      table.blockedFrom &&
      table.blockedTo &&
      table.blockedFrom < slotEnd &&
      table.blockedTo > slotStart
    ) {
      status = 'BLOCKED'
      busyUntilIso = table.blockedTo.toISOString()
    } else if (table.status === 'MAINTENANCE') {
      status = 'MAINTENANCE'
    } else {
      status = 'AVAILABLE'
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
    }
  })
}
