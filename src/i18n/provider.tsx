'use client'

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { LOCALE_COOKIE, intlTag, type Locale } from './config'
import type { Dictionary } from './dictionaries/de'

type I18nValue = {
  locale: Locale
  t: Dictionary
  intl: string
  setLocale: (next: Locale) => void
  isSwitching: boolean
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: Dictionary
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isSwitching, startTransition] = useTransition()

  const setLocale = useCallback(
    (next: Locale) => {
      // One year, lax, non-sensitive UI preference — no consent required.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      startTransition(() => router.refresh())
    },
    [router],
  )

  const value = useMemo<I18nValue>(
    () => ({ locale, t: dictionary, intl: intlTag[locale], setLocale, isSwitching }),
    [locale, dictionary, setLocale, isSwitching],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Shorthand for components that only need the dictionary. */
export function useT(): Dictionary {
  return useI18n().t
}
