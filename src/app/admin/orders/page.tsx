import { redirect } from 'next/navigation'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminShell } from '@/components/admin/AdminShell'
import { OrdersBoard } from '@/components/admin/OrdersBoard'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Bestellungen | Admin' }

export default async function AdminOrdersPage() {
  const session = await readSession()
  // Middleware already redirects, but the page must not render order data
  // without a session regardless of how it was reached.
  if (!session) redirect('/admin/login')

  // Closed orders stay visible for the last two days so staff can look up a
  // handover or a refund; older ones are history, not a working queue.
  const since = new Date()
  since.setDate(since.getDate() - 2)

  const [orders, unread, openReservations] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [{ status: { notIn: ['COMPLETED', 'CANCELLED'] } }, { createdAt: { gte: since } }],
      },
      orderBy: { pickupAt: 'asc' },
      take: 200,
      include: {
        items: {
          select: { nameSnapshot: true, quantity: true, unitPriceCents: true, notes: true },
        },
      },
    }),
    prisma.notification.count({ where: { readAt: null } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
  ])

  const openOrders = orders.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
  ).length

  return (
    <AdminShell
      session={{ name: session.name, role: session.role }}
      unread={unread}
      badges={{ '/admin/orders': openOrders, '/admin/reservations': openReservations }}
    >
      <OrdersBoard
        orders={orders.map((o) => ({
          id: o.id,
          code: o.code,
          guestName: o.guestName,
          guestPhone: o.guestPhone,
          guestEmail: o.guestEmail,
          createdAt: o.createdAt.toISOString(),
          pickupAt: o.pickupAt.toISOString(),
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          subtotalCents: o.subtotalCents,
          totalCents: o.totalCents,
          notes: o.notes,
          items: o.items.map((i) => ({
            name: i.nameSnapshot,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            notes: i.notes,
          })),
        }))}
      />
    </AdminShell>
  )
}
