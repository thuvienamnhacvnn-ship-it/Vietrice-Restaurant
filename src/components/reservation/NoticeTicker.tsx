'use client'

import { Megaphone } from 'lucide-react'

import { site } from '@/config/site'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

const NOTICES: Record<Locale, string[]> = {
  de: [
    'Reservierungen werden telefonisch bestätigt — bitte halten Sie Ihr Telefon bereit.',
    'Lunch Deal: 20% Rabatt auf alle Pho & Hauptgerichte, Mo–Fr von 11:00 bis 15:00.',
    'Grosse Gruppen ab 8 Personen? Rufen Sie uns an unter ' + site.phone.display + '.',
    'Kostenlose Stornierung bis 4 Stunden vor Ihrer Reservierung.',
    'Sushi Friday: jeden Freitag 15% Rabatt auf alle Sushi Sets.',
  ],
  en: [
    'Reservations are confirmed by phone — please keep your phone to hand.',
    'Lunch Deal: 20% off all pho and main dishes, Mon–Fri from 11:00 to 15:00.',
    'Party of 8 or more? Give us a call on ' + site.phone.display + '.',
    'Free cancellation up to 4 hours before your reservation.',
    'Sushi Friday: 15% off all sushi sets, every Friday.',
  ],
  vi: [
    'Đặt bàn được xác nhận qua điện thoại — vui lòng để ý máy.',
    'Ưu đãi bữa trưa: giảm 20% tất cả món phở và món chính, T2–T6 từ 11:00 đến 15:00.',
    'Nhóm từ 8 người trở lên? Gọi cho chúng tôi: ' + site.phone.display + '.',
    'Huỷ miễn phí trước giờ đặt 4 tiếng.',
    'Thứ sáu Sushi: giảm 15% tất cả set sushi, mỗi thứ sáu.',
  ],
}

/**
 * Scrolling notice bar under the floor plan.
 *
 * The track holds two identical copies of the notice list and translates by
 * exactly -50%, so the loop is seamless without any JavaScript measuring
 * widths. The animation pauses on hover — a moving line of text is unreadable
 * if it never stops — and under `prefers-reduced-motion` it stops entirely and
 * simply wraps, leaving every notice readable.
 */
export function NoticeTicker({ className }: { className?: string }) {
  const { locale } = useI18n()
  const notices = NOTICES[locale]

  return (
    <div
      className={cn(
        'group relative flex h-11 shrink-0 items-stretch overflow-hidden rounded-xl border border-gold/25 bg-black/45 backdrop-blur-md',
        className,
      )}
    >
      {/* Fixed label */}
      <span className="z-10 flex shrink-0 items-center gap-2 rounded-l-xl bg-gold-gradient px-3.5 text-[#1a1408]">
        <Megaphone className="h-4 w-4" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-luxe">Info</span>
      </span>

      {/* Fades at both ends so text slides in and out rather than being cut */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-[92px] z-10 w-10 bg-gradient-to-r from-black/70 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black/70 to-transparent"
      />

      <div className="relative flex-1 overflow-hidden">
        <div
          className={cn(
            'flex w-max items-center gap-10 whitespace-nowrap py-2.5 pl-6',
            'motion-safe:animate-[ticker_38s_linear_infinite] group-hover:[animation-play-state:paused]',
            'motion-reduce:w-full motion-reduce:animate-none motion-reduce:whitespace-normal',
          )}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-10" aria-hidden={copy === 1}>
              {notices.map((notice) => (
                <span
                  key={notice}
                  className="flex items-center gap-2.5 text-[13px] text-cream/85"
                >
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {notice}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
