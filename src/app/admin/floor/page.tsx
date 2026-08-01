import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getFloorSnapshot } from '@/server/floor'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { FloorConsole } from '@/components/admin/FloorConsole'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).floor.title} | Admin` }
}

/** Bookings a manager still cares about — everything not called off. */
const LIVE_RESERVATION_STATUSES = [
  'PENDING',
  'CALLBACK_REQUIRED',
  'CONFIRMED',
  'SEATED',
  'COMPLETED',
  'NO_SHOW',
] as const

export default async function AdminFloorPage() {
  const ctx = await adminContext()
  const now = new Date()

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [snapshot, orders, month, pending] = await Promise.all([
    getFloorSnapshot(now),
    prisma.order.findMany({
      where: {
        type: 'PICKUP',
        status: { notIn: ['CANCELLED'] },
        pickupAt: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { pickupAt: 'asc' },
      select: {
        id: true,
        code: true,
        guestName: true,
        status: true,
        pickupAt: true,
        totalCents: true,
        paymentStatus: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: [...LIVE_RESERVATION_STATUSES] },
        startsAt: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { startsAt: 'asc' },
      select: {
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
        table: { select: { number: true } },
      },
    }),
    // Everything still waiting on a yes or no, regardless of when it is for —
    // a booking made today for next Saturday needs answering today, so limiting
    // this queue to the current month would quietly hide work.
    prisma.reservation.findMany({
      where: {
        status: { in: ['PENDING', 'CALLBACK_REQUIRED'] },
        endsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
      select: {
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
        table: { select: { number: true } },
      },
    }),
  ])

  /** Both booking lists reach the console in the same shape. */
  const toDated = (r: {
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
    table: { number: number }
  }) => ({
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
    tableNumber: r.table.number,
  })

  return (
    <AdminShell {...ctx}>
      <FloorConsole
        tables={snapshot.tables}
        today={snapshot.today}
        pending={pending.map(toDated)}
        serverNowIso={snapshot.serverNowIso}
        orders={orders.map((o) => ({
          id: o.id,
          code: o.code,
          guestName: o.guestName,
          status: o.status,
          pickupAtIso: o.pickupAt.toISOString(),
          totalCents: o.totalCents,
          paymentStatus: o.paymentStatus,
          itemCount: o._count.items,
        }))}
        month={month.map(toDated)}
      />
    </AdminShell>
  )
}
