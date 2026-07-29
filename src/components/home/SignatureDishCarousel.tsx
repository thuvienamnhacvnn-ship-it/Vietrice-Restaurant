'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { SignatureDish } from '@/content/signature-dishes'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { localizedName, localizedDescription } from '@/lib/dish'

type Props = {
  dishes: SignatureDish[]
  activeSlug: string
  onSelect: (slug: string) => void
}

/**
 * Horizontal strip of signature dishes under the hero.
 *
 * Selecting a card swaps the hero media in place — no navigation, no reload.
 * The strip is a radio group so arrow keys move between dishes natively, and it
 * scrolls/swipes on touch devices.
 */
export function SignatureDishCarousel({ dishes, activeSlug, onSelect }: Props) {
  const { t, locale } = useI18n()
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Keep the active card in view when it changes from outside (e.g. autoplay).
  useEffect(() => {
    const el = itemRefs.current[activeSlug]
    if (!el || !listRef.current) return
    const list = listRef.current
    const outLeft = el.offsetLeft < list.scrollLeft
    const outRight = el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth
    if (outLeft || outRight) {
      list.scrollTo({ left: el.offsetLeft - 24, behavior: 'smooth' })
    }
  }, [activeSlug])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const i = dishes.findIndex((d) => d.slug === activeSlug)
      if (i < 0) return
      let next = i
      if (e.key === 'ArrowRight') next = (i + 1) % dishes.length
      else if (e.key === 'ArrowLeft') next = (i - 1 + dishes.length) % dishes.length
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = dishes.length - 1
      else return
      e.preventDefault()
      const slug = dishes[next].slug
      onSelect(slug)
      itemRefs.current[slug]?.focus()
    },
    [dishes, activeSlug, onSelect],
  )

  const scrollBy = (dir: 1 | -1) => {
    listRef.current?.scrollBy({ left: dir * 420, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <h2 className="mb-3 font-display text-lg tracking-luxe text-gold-light sm:text-xl short:mb-2">
        {t.hero.signatureDishes}
      </h2>

      <div
        ref={listRef}
        role="radiogroup"
        aria-label={t.hero.dishCarouselLabel}
        onKeyDown={onKeyDown}
        // Below lg the strip swipes horizontally; from lg it becomes an
        // eight-column grid. The side padding leaves room for the two arrows
        // that flank the strip, as in the reference.
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-8 lg:gap-2.5 lg:overflow-visible lg:px-11 [&::-webkit-scrollbar]:hidden"
      >
        {dishes.map((dish) => {
          const active = dish.slug === activeSlug
          return (
            <button
              key={dish.slug}
              ref={(el) => {
                itemRefs.current[dish.slug] = el
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(dish.slug)}
              className={cn(
                'fx-press group relative w-[168px] shrink-0 snap-start overflow-hidden rounded-lg border text-left transition-all duration-400 sm:w-[186px] lg:w-full',
                active
                  ? 'border-gold shadow-gold'
                  : 'border-gold/15 hover:border-gold/45 hover:shadow-gold',
              )}
            >
              <span className="relative block aspect-[191/128] overflow-hidden">
                <Image
                  src={dish.thumbnail}
                  alt={localizedName(dish, locale as Locale)}
                  fill
                  sizes="196px"
                  className={cn(
                    'object-cover transition-transform duration-700',
                    active ? 'scale-105' : 'group-hover:scale-105',
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-0 transition-opacity duration-500',
                    active ? 'bg-black/5' : 'bg-black/35 group-hover:bg-black/15',
                  )}
                />
              </span>

              {/* Fixed height keeps every card the same size regardless of how
                  long the translated description is. */}
              <span className="flex h-[92px] flex-col justify-start bg-gradient-to-b from-background-soft/95 to-background px-3 pb-7 pt-2.5 text-center short:h-[80px] short:pb-6 short:pt-2">
                <span
                  className={cn(
                    'block truncate font-display text-[15px] uppercase tracking-wider transition-colors',
                    active ? 'text-gold-light' : 'text-cream/90 group-hover:text-gold',
                  )}
                >
                  {localizedName(dish, locale as Locale)}
                </span>
                {/* `line-clamp-*` sets display:-webkit-box, so no `block` here. */}
                <span className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-muted short:line-clamp-1">
                  {localizedDescription(dish, locale as Locale)}
                </span>
              </span>

              <span
                aria-hidden
                className={cn(
                  'absolute bottom-2 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full border transition-all duration-300',
                  active
                    ? 'border-gold bg-gold text-[#1a1408]'
                    : 'border-gold/45 text-gold group-hover:border-gold group-hover:bg-gold/15',
                )}
              >
                <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          )
        })}
      </div>

      {/* Arrows flanking the strip on both sides, as in the reference. Below lg
          they scroll the swipe strip; from lg they step the active dish, since
          the grid already shows all eight. */}
      {([-1, 1] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          onClick={() => {
            const i = dishes.findIndex((d) => d.slug === activeSlug)
            if (window.matchMedia('(min-width: 1024px)').matches && i >= 0) {
              onSelect(dishes[(i + dir + dishes.length) % dishes.length].slug)
            } else {
              scrollBy(dir)
            }
          }}
          aria-label={dir === 1 ? t.common.next : t.common.previous}
          className={cn(
            'fx-press absolute top-[calc(1.9rem+((100%-1.9rem-92px)/2))] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.75)]',
            'border border-gold/50 bg-black/65 text-gold backdrop-blur-md transition-all duration-300',
            'hover:border-gold hover:bg-gold/15 hover:text-gold-light',
            dir === 1 ? 'right-[22px]' : 'left-[22px]',
          )}
        >
          {dir === 1 ? (
            <ChevronRight className="h-5 w-5" aria-hidden />
          ) : (
            <ChevronLeft className="h-5 w-5" aria-hidden />
          )}
        </button>
      ))}
    </div>
  )
}
