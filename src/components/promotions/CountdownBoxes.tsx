'use client'

import { useCountdown } from '@/hooks/useCountdown'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

const UNIT_LABELS: Record<'de' | 'en' | 'vi', [string, string, string, string]> = {
  de: ['TAGE', 'STD', 'MIN', 'SEK'],
  en: ['DAYS', 'HRS', 'MIN', 'SEC'],
  vi: ['NGÀY', 'GIỜ', 'PHÚT', 'GIÂY'],
}

/** Below this many days remaining, the signal light turns red. */
const URGENT_DAYS = 3

const REMAINING_LABEL: Record<'de' | 'en' | 'vi', { d: string; h: string; ended: string }> = {
  de: { d: 'T', h: 'Std', ended: 'Beendet' },
  en: { d: 'd', h: 'h', ended: 'Ended' },
  vi: { d: 'ngày', h: 'giờ', ended: 'Đã kết thúc' },
}

/**
 * Per-card remaining time, shown as days + hours with a pulsing signal light:
 * green while there is comfortable time left, red once the campaign drops under
 * three days. Anchored to server time like every other countdown here.
 */
export function PromoTimeBadge({
  endsAtIso,
  serverNowIso,
  className,
}: {
  endsAtIso: string
  serverNowIso: string
  className?: string
}) {
  const { locale } = useI18n()
  const c = useCountdown(endsAtIso, serverNowIso)
  const labels = REMAINING_LABEL[locale]
  const urgent = c.days < URGENT_DAYS

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-black/70 py-1 pl-2 pr-3 backdrop-blur-md',
        urgent ? 'border-danger/55' : 'border-success/45',
        className,
      )}
    >
      {/* Signal light */}
      <span className="relative grid h-3 w-3 place-items-center">
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full motion-safe:animate-ping',
            urgent ? 'bg-danger/70' : 'bg-success/60',
          )}
        />
        <span
          className={cn(
            'relative h-2 w-2 rounded-full',
            urgent
              ? 'bg-danger shadow-[0_0_8px_2px_rgb(239_68_68/0.7)]'
              : 'bg-success shadow-[0_0_8px_2px_rgb(34_197_94/0.6)]',
          )}
        />
      </span>

      <span
        className={cn(
          'font-mono text-[11.5px] font-bold leading-none tabular-nums tracking-[0.05em]',
          urgent ? 'text-danger' : 'text-success',
        )}
      >
        {c.expired
          ? labels.ended
          : `${c.days}${labels.d} ${String(c.hours).padStart(2, '0')}${labels.h}`}
      </span>
    </span>
  )
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
