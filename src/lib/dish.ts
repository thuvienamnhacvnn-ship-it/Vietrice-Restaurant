import type { Locale } from '@/i18n/config'

/** Any record carrying the standard tri-lingual name/description columns. */
type Localizable = {
  nameVi: string
  nameDe: string
  nameEn: string
}

type LocalizableWithDescription = Localizable & {
  descriptionVi: string
  descriptionDe: string
  descriptionEn: string
}

/**
 * Dish names stay in Vietnamese across every locale — that is how they appear
 * on the printed menu and in the design mockups ("PHỞ BÒ", "BÁNH XÈO"). The
 * German/English columns carry the explanatory subtitle instead.
 */
export function localizedName(item: Localizable, _locale: Locale): string {
  return item.nameVi
}

/** The translated subtitle shown beneath the Vietnamese dish name. */
export function localizedSubtitle(item: Localizable, locale: Locale): string {
  if (locale === 'vi') return item.nameVi
  return locale === 'en' ? item.nameEn : item.nameDe
}

export function localizedDescription(item: LocalizableWithDescription, locale: Locale): string {
  if (locale === 'vi') return item.descriptionVi
  return locale === 'en' ? item.descriptionEn : item.descriptionDe
}
