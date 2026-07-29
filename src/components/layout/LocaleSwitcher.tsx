'use client'

import { locales, localeLabels } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

/** DE / EN / VI switch. Writes a preference cookie and refreshes the tree. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, isSwitching } = useI18n()

  return (
    <div
      className={cn('flex items-center gap-1 text-[12.5px]', isSwitching && 'opacity-60', className)}
      role="group"
      aria-label="Sprache / Language"
    >
      {locales.map((code, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && (
            <span aria-hidden className="mx-1 text-gold/35">
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => setLocale(code)}
            aria-current={locale === code ? 'true' : undefined}
            className={cn(
              'rounded px-1 py-0.5 font-medium tracking-wider transition-colors',
              locale === code ? 'text-gold-light' : 'text-cream/60 hover:text-gold',
            )}
          >
            {localeLabels[code]}
          </button>
        </span>
      ))}
    </div>
  )
}
