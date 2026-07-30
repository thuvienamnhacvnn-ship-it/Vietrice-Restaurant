import { site } from '@/config/site'
import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getDictionary, getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { SettingsBoard } from '@/components/admin/SettingsBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.settings} | Admin` }
}

export default async function AdminSettingsPage() {
  const ctx = await adminContext()

  const stored = await prisma.openingHour.findMany({ orderBy: { weekday: 'asc' } })

  // Monday first: the week as staff read a rota, not as the Date API numbers it.
  const order = [1, 2, 3, 4, 5, 6, 0]
  const hours = order.map((weekday) => {
    const row = stored.find((h) => h.weekday === weekday)
    return {
      weekday,
      isClosed: row?.isClosed ?? false,
      opensAt: row?.opensAt ?? null,
      closesAt: row?.closesAt ?? null,
    }
  })

  const publicDict = getDictionary(ctx.locale)

  return (
    <AdminShell {...ctx}>
      <SettingsBoard
        hours={hours}
        weekdayNames={publicDict.weekdays}
        contact={{
          legalName: site.legalName,
          address: site.address.full,
          phone: site.phone.display,
          email: site.email,
        }}
      />
    </AdminShell>
  )
}
