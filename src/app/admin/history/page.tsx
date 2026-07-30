import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { HistoryBoard } from '@/components/admin/HistoryBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.history} | Admin` }
}

export default async function AdminHistoryPage() {
  const ctx = await adminContext()

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
  })

  return (
    <AdminShell {...ctx}>
      <HistoryBoard
        entries={entries.map((e) => ({
          id: e.id,
          actorName: e.actorName,
          action: e.action,
          entity: e.entity,
          entityId: e.entityId,
          before: (e.before ?? null) as Record<string, unknown> | null,
          after: (e.after ?? null) as Record<string, unknown> | null,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </AdminShell>
  )
}
