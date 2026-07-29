import type { Metadata } from 'next'

import { allergens, menuCategories, menuItems } from '@/content/menu'
import { getLocale } from '@/i18n'
import { SmartMenu } from '@/components/menu/SmartMenu'

export const metadata: Metadata = {
  title: 'Smart Menu',
  description:
    'Entdecken Sie die Gerichte des Viet Rice — Pho, Reisgerichte, Sushi, vegetarische Küche und mehr.',
}

export default async function MenuPage() {
  const locale = await getLocale()

  // Allergen labels are resolved server-side so the client bundle carries only
  // the strings for the active locale.
  const allergenLabels = Object.fromEntries(
    allergens.map((a) => [
      a.code,
      locale === 'en' ? a.nameEn : locale === 'vi' ? a.nameVi : a.nameDe,
    ]),
  )

  return (
    <div className="pt-[var(--header-h)]">
      <SmartMenu
        categories={menuCategories}
        items={menuItems}
        allergenLabels={allergenLabels}
      />
    </div>
  )
}
