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

  const [reservations, tables, orders, pendingCount, todayCount, openOrders, unread] =
    await Promise.all([
    prisma.reservation.findMany({
      orderBy: { startsAt: 'asc' },
      take: 40,
      where: { startsAt: { gte: startOfToday } },
      include: { table: { select: { number: true } } },
    }),
    prisma.restaurantTable.findMany({ orderBy: { number: 'asc' } }),
    // Completed and cancelled orders drop off the board: this is a working
    // queue for the kitchen, not an archive. History lives in the audit log.
    prisma.order.findMany({
      orderBy: { pickupAt: 'asc' },
      take: 40,
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: { items: { select: { nameSnapshot: true, quantity: true } } },
    }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
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
      orders={orders.map((o) => ({
        id: o.id,
        code: o.code,
        guestName: o.guestName,
        guestPhone: o.guestPhone,
        pickupAt: o.pickupAt.toISOString(),
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalCents: o.totalCents,
        notes: o.notes,
        items: o.items.map((i) => ({ name: i.nameSnapshot, quantity: i.quantity })),
      }))}
    />
  )
}
