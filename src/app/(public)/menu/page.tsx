import type { Metadata } from 'next'

import { allergens } from '@/content/menu'
import { getMenuData } from '@/server/catalogue'
import { getLocale } from '@/i18n'
import { SmartMenu } from '@/components/menu/SmartMenu'

export const metadata: Metadata = {
  title: 'Smart Menu',
  description:
    'Entdecken Sie die Gerichte des Viet Rice — Pho, Reisgerichte, Sushi, vegetarische Küche und mehr.',
}

export default async function MenuPage() {
  const [locale, { categories, items }] = await Promise.all([getLocale(), getMenuData()])

  // Allergen labels are resolved server-side so the client bundle carries only
  // the strings for the active locale.
  const allergenLabels = Object.fromEntries(
    allergens.map((a) => [
      a.code,
      locale === 'en' ? a.nameEn : locale === 'vi' ? a.nameVi : a.nameDe,
    ]),
  )

  return (
      <>
      <SmartMenu
        categories={categories}
        items={items}
        allergenLabels={allergenLabels}
      />
    </>
  )
}
