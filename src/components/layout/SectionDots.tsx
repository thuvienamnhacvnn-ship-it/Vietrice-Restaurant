'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

type Dot = { id: string; label: string; top: number }

/**
 * Section navigator for the snap-scrolled home page.
 *
 * Reads the sections straight out of the DOM on mount so it never drifts out of
 * sync with the page, tracks the active one with an IntersectionObserver, and
 * scrolls to a section on click. Each dot exposes its section name on hover and
 * to screen readers.
 *
 * Renders nothing unless there is more than one full-height section, so it
 * stays out of the way on single-section sub-pages.
 */
export function SectionDots() {
  const { t } = useI18n()
  const [dots, setDots] = useState<Dot[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const LABELS = [
    t.nav.home,
    t.nav.reservation,
    t.nav.menu,
    t.nav.events,
    t.nav.gallery,
    t.assistant.title,
  ]

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section')]
    if (sections.length < 2) return

    setDots(
      sections.map((s, i) => ({
        id: s.id || `section-${i}`,
        label: LABELS[i] ?? `${i + 1}`,
        top: s.offsetTop,
      })),
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const i = sections.indexOf(entry.target as HTMLElement)
          if (i >= 0) setActiveIndex(i)
        })
      },
      // Fire when a section owns the middle band of the viewport.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (dots.length < 2) return null

  return (
    <nav
      aria-label="Sections"
      className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      {dots.map((dot, i) => {
        const active = i === activeIndex
        return (
          <button
            key={dot.id}
            type="button"
            aria-label={dot.label}
            aria-current={active ? 'true' : undefined}
            onClick={() =>
              document
                .querySelectorAll<HTMLElement>('main > section')
                [i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="group/dot relative flex items-center"
          >
            <span
              className={cn(
                'block rounded-full border transition-all duration-400',
                active
                  ? 'h-6 w-[7px] border-gold bg-gold shadow-[0_0_12px_2px_rgb(216_174_99/0.45)]'
                  : 'h-[7px] w-[7px] border-gold/45 bg-transparent group-hover/dot:border-gold group-hover/dot:bg-gold/40',
              )}
            />
            {/* Label slides out on hover */}
            <span className="pointer-events-none absolute left-5 whitespace-nowrap rounded-md border border-gold/25 bg-black/80 px-2.5 py-1 text-[11px] uppercase tracking-luxe text-gold opacity-0 backdrop-blur-md transition-all duration-300 group-hover/dot:translate-x-0 group-hover/dot:opacity-100 motion-safe:-translate-x-1">
              {dot.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
