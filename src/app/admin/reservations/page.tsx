import { redirect } from 'next/navigation'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminShell } from '@/components/admin/AdminShell'
import { ReservationsBoard } from '@/components/admin/ReservationsBoard'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Reservierungen | Admin' }

export default async function AdminReservationsPage() {
  const session = await readSession()
  if (!session) redirect('/admin/login')

  // Yesterday onwards: last night's bookings still get looked up the next
  // morning (no-shows, complaints), but the list stays a working queue.
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - 1)

  const [reservations, unread, openOrders] = await Promise.all([
    prisma.reservation.findMany({
      where: { startsAt: { gte: since } },
      orderBy: { startsAt: 'asc' },
      take: 200,
      include: { table: { select: { number: true } } },
    }),
    prisma.notification.count({ where: { readAt: null } }),
    prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
  ])

  const openReservations = reservations.filter(
    (r) => r.status === 'PENDING' || r.status === 'CALLBACK_REQUIRED',
  ).length

  return (
    <AdminShell
      session={{ name: session.name, role: session.role }}
      unread={unread}
      badges={{ '/admin/orders': openOrders, '/admin/reservations': openReservations }}
    >
      <ReservationsBoard
        reservations={reservations.map((r) => ({
          id: r.id,
          code: r.code,
          guestName: r.guestName,
          guestPhone: r.guestPhone,
          guestEmail: r.guestEmail,
          partySize: r.partySize,
          tableNumber: r.table.number,
          startsAt: r.startsAt.toISOString(),
          endsAt: r.endsAt.toISOString(),
          status: r.status,
          notes: r.notes,
        }))}
      />
    </AdminShell>
  )
}
