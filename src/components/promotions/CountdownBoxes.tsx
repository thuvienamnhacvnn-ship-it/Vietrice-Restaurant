'use client'

import { useCountdown } from '@/hooks/useCountdown'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

const UNIT_LABELS: Record<'de' | 'en' | 'vi', [string, string, string, string]> = {
  de: ['TAGE', 'STD', 'MIN', 'SEK'],
  en: ['DAYS', 'HRS', 'MIN', 'SEC'],
  vi: ['NGÀY', 'GIỜ', 'PHÚT', 'GIÂY'],
}

/** Four-cell countdown, matching the "ANGEBOT ENDET IN" panel in the mockup. */
export function CountdownBoxes({
  targetIso,
  serverNowIso,
  label,
  className,
}: {
  targetIso: string
  serverNowIso: string
  label: string
  className?: string
}) {
  const { locale } = useI18n()
  const c = useCountdown(targetIso, serverNowIso)
  const labels = UNIT_LABELS[locale]
  const values = [c.days, c.hours, c.minutes, c.seconds]

  return (
    <div className={cn('card-lux px-4 py-3', className)}>
      <p className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-wide2 text-gold/85">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {values.map((v, i) => (
          <div
            key={labels[i]}
            className="rounded-lg border border-gold/25 bg-black/45 px-2 py-2 text-center"
          >
            <span className="block font-display text-[26px] leading-none text-gold-light tabular-nums sm:text-[30px]">
              {String(v).padStart(2, '0')}
            </span>
            <span className="mt-1 block text-[9.5px] uppercase tracking-wider text-muted">
              {labels[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
