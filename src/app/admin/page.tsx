import { redirect } from 'next/navigation'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminConsole } from '@/components/admin/AdminConsole'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const session = await readSession()
  // Middleware already redirects, but a route handler or a stale build could
  // reach this without one; the page must not render admin data regardless.
  if (!session) redirect('/admin/login')

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  const [reservations, tables, pendingCount, todayCount, unread] = await Promise.all([
    prisma.reservation.findMany({
      orderBy: { startsAt: 'asc' },
      take: 40,
      where: { startsAt: { gte: startOfToday } },
      include: { table: { select: { number: true } } },
    }),
    prisma.restaurantTable.findMany({ orderBy: { number: 'asc' } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { startsAt: { gte: startOfToday, lt: endOfToday } } }),
    prisma.notification.count({ where: { readAt: null } }),
  ])

  return (
    <AdminConsole
      session={{ name: session.name, role: session.role }}
      stats={{ pending: pendingCount, today: todayCount, unread, tables: tables.length }}
      reservations={reservations.map((r) => ({
        id: r.id,
        code: r.code,
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        partySize: r.partySize,
        tableNumber: r.table.number,
        startsAt: r.startsAt.toISOString(),
        status: r.status,
        notes: r.notes,
      }))}
      tables={tables.map((t) => ({
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
      }))}
    />
  )
}
