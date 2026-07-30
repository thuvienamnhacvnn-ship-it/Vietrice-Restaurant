import { de, type AdminDictionary } from './de'
import { en } from './en'
import { vi } from './vi'
import { defaultLocale, type Locale } from '../config'

const dictionaries: Record<Locale, AdminDictionary> = { de, en, vi }

export function getAdminDictionary(locale: Locale): AdminDictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale]
}

/** `fill('{open} offen', { open: 3 })` → `'3 offen'`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}

export type { AdminDictionary }
