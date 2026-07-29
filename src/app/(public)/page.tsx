import { galleryItems } from '@/content/gallery'
import { allergens, menuCategories, menuItems } from '@/content/menu'
import { signatureDishes } from '@/content/signature-dishes'
import { getLocale } from '@/i18n'
import { getActivePromotions, nextExpiring } from '@/lib/promotions'
import { combineDateTime, getDemoTableViews, toDateInput } from '@/lib/reservation'
import { HeroDishShowcase } from '@/components/home/HeroDishShowcase'
import { GallerySection } from '@/components/gallery/GallerySection'
import { PromotionsSection } from '@/components/promotions/PromotionsSection'
import { ReservationSection } from '@/components/reservation/ReservationSection'
import { SmartMenu } from '@/components/menu/SmartMenu'

/**
 * Home page — composes every public section in the order of the design mockups:
 * hero, reservation, smart menu, promotions, gallery.
 *
 * All data is resolved on the server and passed down as props, so the section
 * components stay presentational. Table availability and promotion validity are
 * both computed from server time, never from the visitor's clock.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const locale = await getLocale()
  const now = new Date()

  const promotions = getActivePromotions(locale, now)
  const soonest = nextExpiring(promotions)

  const date = toDateInput(now)
  const time = '19:00'
  const tables = getDemoTableViews(combineDateTime(date, time), now)

  const allergenLabels = Object.fromEntries(
    allergens.map((a) => [
      a.code,
      locale === 'en' ? a.nameEn : locale === 'vi' ? a.nameVi : a.nameDe,
    ]),
  )

  return (
    <>
      <HeroDishShowcase dishes={signatureDishes} />

      <ReservationSection
        initialTables={tables}
        serverNowIso={now.toISOString()}
        initialDate={date}
        initialTime={time}
      />

      <SmartMenu categories={menuCategories} items={menuItems} allergenLabels={allergenLabels} />

      <PromotionsSection
        promotions={promotions}
        soonestEndingIso={soonest?.endsAtIso ?? null}
        serverNowIso={now.toISOString()}
      />

      <GallerySection items={galleryItems} />
    </>
  )
}
