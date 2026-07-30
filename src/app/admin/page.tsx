import { redirect } from 'next/navigation'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminConsole } from '@/components/admin/AdminConsole'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin' }

/**
 * Shift dashboard: what is coming next and the floor plan. Full management of
 * reservations and orders lives on their own pages — this one stays a glance,
 * so it deliberately shows only the next few of each.
 */
export default async function AdminPage() {
  const session = await readSession()
  // Middleware already redirects, but a route handler or a stale build could
  // reach this without one; the page must not render admin data regardless.
  if (!session) redirect('/admin/login')

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  const [reservations, tables, orders, pendingCount, todayCount, openOrders, unread] =
    await Promise.all([
      prisma.reservation.findMany({
        orderBy: { startsAt: 'asc' },
        take: 8,
        where: {
          startsAt: { gte: startOfToday },
          status: { notIn: ['CANCELLED', 'REJECTED', 'COMPLETED'] },
        },
        include: { table: { select: { number: true } } },
      }),
      prisma.restaurantTable.findMany({ orderBy: { number: 'asc' } }),
      prisma.order.findMany({
        orderBy: { pickupAt: 'asc' },
        take: 8,
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      prisma.reservation.count({
        where: { status: { in: ['PENDING', 'CALLBACK_REQUIRED'] } },
      }),
      prisma.reservation.count({ where: { startsAt: { gte: startOfToday, lt: endOfToday } } }),
      prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      prisma.notification.count({ where: { readAt: null } }),
    ])

  return (
    <AdminConsole
      session={{ name: session.name, role: session.role }}
      stats={{
        pending: pendingCount,
        today: todayCount,
        unread,
        tables: tables.length,
        openOrders,
      }}
      reservations={reservations.map((r) => ({
        id: r.id,
        code: r.code,
        guestName: r.guestName,
        partySize: r.partySize,
        tableNumber: r.table.number,
        startsAt: r.startsAt.toISOString(),
        status: r.status,
      }))}
      tables={tables.map((t) => ({
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
      }))}
      orders={orders.map((o) => ({
        id: o.id,
        code: o.code,
        guestName: o.guestName,
        pickupAt: o.pickupAt.toISOString(),
        status: o.status,
        totalCents: o.totalCents,
      }))}
    />
  )
}
