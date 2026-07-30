import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { CustomersBoard } from '@/components/admin/CustomersBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.customers} | Admin` }
}

export default async function AdminCustomersPage() {
  const ctx = await adminContext()

  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 300,
    include: {
      _count: { select: { reservations: true, orders: true } },
      reservations: { orderBy: { startsAt: 'desc' }, take: 1, select: { startsAt: true } },
    },
  })

  return (
    <AdminShell {...ctx}>
      <CustomersBoard
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          notes: c.notes,
          marketingOptIn: c.marketingOptIn,
          reservations: c._count.reservations,
          orders: c._count.orders,
          lastVisit: c.reservations[0]?.startsAt.toISOString() ?? null,
        }))}
      />
    </AdminShell>
  )
}
