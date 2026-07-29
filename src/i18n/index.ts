import { cookies } from 'next/headers'

import { de } from './dictionaries/de'
import { en } from './dictionaries/en'
import { vi } from './dictionaries/vi'
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config'
import type { Dictionary } from './dictionaries/de'

const dictionaries: Record<Locale, Dictionary> = { de, en, vi }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}

/**
 * Resolves the visitor's locale from the preference cookie. Routes are not
 * locale-prefixed (the spec fixes them at `/menu`, `/reservation`, …), so the
 * cookie is the single source of truth and defaults to German.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}

export type { Dictionary, Locale }
