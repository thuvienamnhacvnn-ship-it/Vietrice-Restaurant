import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { OrdersBoard } from '@/components/admin/OrdersBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.orders} | Admin` }
}

export default async function AdminOrdersPage() {
  const ctx = await adminContext()

  // Closed orders stay visible for the last two days so staff can look up a
  // handover or a refund; older ones are history, not a working queue.
  const since = new Date()
  since.setDate(since.getDate() - 2)

  const orders = await prisma.order.findMany({
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
  })

  return (
    <AdminShell {...ctx}>
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
