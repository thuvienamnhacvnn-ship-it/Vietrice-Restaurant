import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { ReservationsBoard } from '@/components/admin/ReservationsBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.reservations} | Admin` }
}

export default async function AdminReservationsPage() {
  const ctx = await adminContext()

  // Yesterday onwards: last night's bookings still get looked up the next
  // morning (no-shows, complaints), but the list stays a working queue.
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - 1)

  const reservations = await prisma.reservation.findMany({
      where: { startsAt: { gte: since } },
      orderBy: { startsAt: 'asc' },
      take: 200,
      include: { table: { select: { number: true } } },
  })

  return (
    <AdminShell {...ctx}>
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
