import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { TablesBoard } from '@/components/admin/TablesBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.tables} | Admin` }
}

export default async function AdminTablesPage() {
  const ctx = await adminContext()

  const now = new Date()

  const tables = await prisma.restaurantTable.findMany({
    orderBy: { number: 'asc' },
    include: {
      // The booking currently sitting on this table, so staff can see *why* it
      // is blocked before they change its status by hand.
      reservations: {
        where: {
          status: { in: ['CONFIRMED', 'SEATED', 'PENDING'] },
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { startsAt: 'asc' },
        take: 1,
        select: { guestName: true, endsAt: true },
      },
    },
  })

  return (
    <AdminShell {...ctx}>
      <TablesBoard
        tables={tables.map((t) => ({
          id: t.id,
          number: t.number,
          capacity: t.capacity,
          status: t.status,
          zone: t.zone,
          isActive: t.isActive,
          heldBy: t.reservations[0]?.guestName ?? null,
          heldUntil: t.reservations[0]?.endsAt.toISOString() ?? null,
        }))}
      />
    </AdminShell>
  )
}
