import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { localizedName } from '@/lib/dish'
import { AdminShell } from '@/components/admin/AdminShell'
import { MenuBoard } from '@/components/admin/MenuBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.menu} | Admin` }
}

export default async function AdminMenuPage() {
  const ctx = await adminContext()
  const { locale } = ctx

  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { category: true },
    }),
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  const catName = (c: { nameDe: string; nameEn: string; nameVi: string }) =>
    locale === 'en' ? c.nameEn : locale === 'vi' ? c.nameVi : c.nameDe

  return (
    <AdminShell {...ctx}>
      <MenuBoard
        categories={categories.map((c) => ({ slug: c.slug, name: catName(c) }))}
        dishes={items.map((i) => ({
          id: i.id,
          slug: i.slug,
          name: localizedName(i, locale),
          categorySlug: i.category.slug,
          categoryName: catName(i.category),
          image: i.image,
          priceCents: i.priceCents,
          isAvailable: i.isAvailable,
          isSignature: i.isSignature,
          isBestseller: i.isBestseller,
        }))}
      />
    </AdminShell>
  )
}
