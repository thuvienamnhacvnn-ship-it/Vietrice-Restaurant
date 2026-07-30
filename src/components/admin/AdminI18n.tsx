'use client'

import { createContext, useContext } from 'react'

import type { AdminDictionary } from '@/i18n/admin'
import { intlTag, type Locale } from '@/i18n/config'

type Value = { locale: Locale; t: AdminDictionary; intl: string }

const Ctx = createContext<Value | null>(null)

/**
 * The dictionary is resolved on the server and handed down, so admin pages
 * render in the chosen language on first paint — staff never see a flash of
 * German before the switch applies.
 */
export function AdminI18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: AdminDictionary
  children: React.ReactNode
}) {
  return (
    <Ctx.Provider value={{ locale, t: dictionary, intl: intlTag[locale] }}>{children}</Ctx.Provider>
  )
}

export function useAdminI18n(): Value {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAdminI18n must be used inside <AdminI18nProvider>')
  return ctx
}
