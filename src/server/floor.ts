import { hasDatabase, prisma } from '@/lib/db'
import type { DatedBooking, FloorBooking, FloorSnapshot, FloorTable } from '@/lib/floor'

/**
 * Floor-console reads.
 *
 * The public floor plan (`getTableViews`) answers one question: is this table
 * bookable for the slot a guest picked. The console needs a different one: what
 * is happening on this table *right now*, and what is booked onto it for the
 * rest of the shift. Same tables, different projection — hence a separate
 * module rather than more flags on the public one.
 */

/** Reservation states that actually hold a table. */
const HOLDING = ['PENDING', 'CALLBACK_REQUIRED', 'CONFIRMED', 'SEATED'] as const

/**
 * Day boundaries in the server's own timezone.
 *
 * This matches what the dashboard and the reservations page already do. Worth
 * knowing: Vercel runs UTC while the restaurant runs Berlin time, so "today"
 * starts an hour or two before local midnight. It has not bitten anyone because
 * the kitchen closes well before then, but a late seating would land on the
 * wrong day and this is the single place to fix it if that changes.
 */
function dayBounds(now: Date): { start: Date; end: Date } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function toBooking(r: {
  id: string
  code: string
  guestName: string
  guestPhone: string
  partySize: number
  status: string
  startsAt: Date
  endsAt: Date
  seatedAt: Date | null
  notes: string | null
}): FloorBooking {
  return {
    id: r.id,
    code: r.code,
    guestName: r.guestName,
    guestPhone: r.guestPhone,
    partySize: r.partySize,
    status: r.status,
    startsAtIso: r.startsAt.toISOString(),
    endsAtIso: r.endsAt.toISOString(),
    seatedAtIso: r.seatedAt?.toISOString() ?? null,
    notes: r.notes,
  }
}

const BOOKING_SELECT = {
  id: true,
  code: true,
  guestName: true,
  guestPhone: true,
  partySize: true,
  status: true,
  startsAt: true,
  endsAt: true,
  seatedAt: true,
  notes: true,
} as const

export async function getFloorSnapshot(now: Date): Promise<FloorSnapshot> {
  if (!hasDatabase) {
    return { tables: [], today: [], serverNowIso: now.toISOString() }
  }

  const { start, end } = dayBounds(now)

  const tables = await prisma.restaurantTable.findMany({
    orderBy: { number: 'asc' },
    include: {
      reservations: {
        where: {
          status: { in: [...HOLDING] },
          startsAt: { lt: end },
          endsAt: { gt: start },
        },
        orderBy: { startsAt: 'asc' },
        select: BOOKING_SELECT,
      },
    },
  })

  const today: DatedBooking[] = []

  const mapped = tables.map((table): FloorTable => {
    const bookings = table.reservations.map(toBooking)
    for (const b of bookings) today.push({ ...b, tableNumber: table.number })

    // "Current" is the booking whose window contains now. Upcoming is anything
    // that has not started yet. A booking whose window has passed but is still
    // CONFIRMED is neither — it is a no-show the staff have not closed off, and
    // showing it as current would make the table look busy when it is empty.
    const current =
      bookings.find((b) => {
        const s = new Date(b.startsAtIso).getTime()
        const e = new Date(b.endsAtIso).getTime()
        return s <= now.getTime() && now.getTime() < e
      }) ?? null

    const upcoming = bookings.filter((b) => new Date(b.startsAtIso).getTime() > now.getTime())

    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      gridRow: table.gridRow,
      gridCol: table.gridCol,
      shape: table.shape === 'round' ? 'round' : 'square',
      zone: table.zone,
      isActive: table.isActive,
      status: table.status,
      blockedToIso: table.blockedTo?.toISOString() ?? null,
      busyUntilIso: table.busyUntil?.toISOString() ?? null,
      freedAtIso: table.freedAt?.toISOString() ?? null,
      current,
      upcoming,
    }
  })

  today.sort((a, b) => a.startsAtIso.localeCompare(b.startsAtIso))

  return { tables: mapped, today, serverNowIso: now.toISOString() }
}

/**
 * A cheap fingerprint of everything the floor plan draws.
 *
 * The stream route polls this rather than the full snapshot: two aggregates
 * beat re-reading every table and booking several times a minute for every
 * connected browser. `updatedAt` is `@updatedAt` on both models, so any write
 * moves the maximum; the counts catch deletes, which leave the maximum alone.
 */
export async function getFloorVersion(): Promise<string> {
  if (!hasDatabase) return 'no-database'

  const [tables, reservations] = await Promise.all([
    prisma.restaurantTable.aggregate({ _max: { updatedAt: true }, _count: true }),
    prisma.reservation.aggregate({ _max: { updatedAt: true }, _count: true }),
  ])

  return [
    tables._max.updatedAt?.getTime() ?? 0,
    tables._count,
    reservations._max.updatedAt?.getTime() ?? 0,
    reservations._count,
  ].join(':')
}
