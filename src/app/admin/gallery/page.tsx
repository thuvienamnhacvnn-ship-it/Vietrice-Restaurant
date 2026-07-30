import { prisma } from '@/lib/db'
import { adminContext } from '@/server/admin'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { GalleryBoard } from '@/components/admin/GalleryBoard'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: `${getAdminDictionary(locale).nav.gallery} | Admin` }
}

export default async function AdminGalleryPage() {
  const ctx = await adminContext()
  const { locale } = ctx

  const items = await prisma.galleryItem.findMany({
    where: { deletedAt: null },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  return (
    <AdminShell {...ctx}>
      <GalleryBoard
        media={items.map((i) => ({
          id: i.id,
          url: i.url,
          title: locale === 'en' ? i.titleEn : locale === 'vi' ? i.titleVi : i.titleDe,
          category: i.category,
          isVisible: i.isVisible,
          isFeatured: i.isFeatured,
        }))}
      />
    </AdminShell>
  )
}
