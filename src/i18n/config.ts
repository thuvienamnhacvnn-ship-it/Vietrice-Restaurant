export const locales = ['de', 'en', 'vi'] as const

export type Locale = (typeof locales)[number]

/** German is the restaurant's primary market and the default. */
export const defaultLocale: Locale = 'de'

export const LOCALE_COOKIE = 'vr_locale'

export const localeLabels: Record<Locale, string> = {
  de: 'DE',
  en: 'EN',
  vi: 'VI',
}

/** Intl tag used for number/date formatting per locale. */
export const intlTag: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-GB',
  vi: 'vi-VN',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/** Maps the app locale onto the Prisma `Locale` enum. */
export function toPrismaLocale(locale: Locale): 'DE' | 'EN' | 'VI' {
  return locale.toUpperCase() as 'DE' | 'EN' | 'VI'
}
