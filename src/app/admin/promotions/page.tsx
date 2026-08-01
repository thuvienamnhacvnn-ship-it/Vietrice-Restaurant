import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { PromotionsBoard } from '@/components/admin/PromotionsBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.promotions} | Admin` }
}

export default async function AdminPromotionsPage() {
  const ctx = await adminContext()
  const { locale } = ctx

  const promotions = await prisma.promotion.findMany({
    where: { deletedAt: null },
    orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
  })

  const pick = (de: string, en: string, vi: string) =>
    locale === 'en' ? en : locale === 'vi' ? vi : de

  return (
    <AdminShell {...ctx}>
      <PromotionsBoard
        promotions={promotions.map((p) => ({
          id: p.id,
          title: pick(p.titleDe, p.titleEn, p.titleVi),
          subtitle: pick(p.subtitleDe, p.subtitleEn, p.subtitleVi),
          titleDe: p.titleDe,
          titleEn: p.titleEn,
          titleVi: p.titleVi,
          subtitleDe: p.subtitleDe,
          subtitleEn: p.subtitleEn,
          subtitleVi: p.subtitleVi,
          descriptionDe: p.descriptionDe,
          descriptionEn: p.descriptionEn,
          descriptionVi: p.descriptionVi,
          image: p.image,
          discountPercent: p.discountPercent,
          comboPriceCents: p.comboPriceCents,
          startsAt: p.startsAt.toISOString(),
          endsAt: p.endsAt.toISOString(),
          isActive: p.isActive,
        }))}
      />
    </AdminShell>
  )
}
