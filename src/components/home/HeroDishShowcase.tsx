'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CalendarDays, Pause, Play, Volume2, VolumeX } from 'lucide-react'

import type { SignatureDish } from '@/content/signature-dishes'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { localizedDescription, localizedName, localizedSubtitle } from '@/lib/dish'
import { formatPrice } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { SignatureDishCarousel } from './SignatureDishCarousel'
import { VideoBackground } from './VideoBackground'

/**
 * Full-screen hero, laid out to match the 16:9 desktop mockup: brand block and
 * copy on the left third, cinematic dish photography filling the frame, and the
 * signature-dish strip anchored to the bottom.
 *
 * Selecting a dish in the strip swaps the background media and the headline in
 * place. No route change, no reload — state lives here.
 */
export function HeroDishShowcase({ dishes }: { dishes: SignatureDish[] }) {
  const { t, locale, intl } = useI18n()
  const [activeSlug, setActiveSlug] = useState(dishes[0]?.slug ?? '')
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)

  const active = useMemo(
    () => dishes.find((d) => d.slug === activeSlug) ?? dishes[0],
    [dishes, activeSlug],
  )

  const handleSelect = useCallback((slug: string) => {
    setActiveSlug(slug)
    setPlaying(true)
  }, [])

  if (!active) return null

  const hasVideo = Boolean(active.video)

  return (
    <section
      className="relative flex min-h-[100svh] flex-col overflow-hidden lg:h-[100svh] lg:min-h-0 lg:snap-section"
      aria-label={t.hero.eyebrow}
    >
      {/* ---- Background media ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.slug}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <VideoBackground
            src={active.video}
            poster={active.poster}
            alt={localizedName(active, locale as Locale)}
            playing={playing}
            muted={muted}
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Readability scrims. Explicit stops rather than Tailwind's 0/50/100
          gradient: the hero's height varies a lot between viewports, and the
          default midpoints darkened the food photography far too aggressively
          on short screens. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,6,0.97)_0%,rgba(8,8,6,0.88)_26%,rgba(8,8,6,0.45)_50%,rgba(8,8,6,0.05)_74%,rgba(8,8,6,0)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0)_0%,rgba(8,8,6,0)_42%,rgba(8,8,6,0.72)_78%,rgb(8,8,6)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/75 to-transparent"
      />

      {/* Content sits in the same centred 16:9 box as every other section; the
          background above bleeds the full width behind it. */}
      <div className="relative z-10 mx-auto flex w-full flex-1 flex-col lg:h-full lg:w-auto lg:max-w-full lg:flex-none lg:aspect-[16/9]">
      {/* ---- Copy block ---- */}
      <Container
        wide
        className="relative z-10 flex flex-1 items-center pb-8 pt-[calc(var(--header-h)+24px)] short:pb-4 short:pt-[calc(var(--header-h)+8px)]"
      >
        <div className="w-full max-w-xl lg:max-w-[560px]">
          <Logo layout="stacked" size="xl" asLink={false} className="items-start text-left" />

          <div className="divider-lotus my-4 max-w-[340px] lg:my-5 short:my-2">
            <span aria-hidden className="text-base">
              ❦
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.slug}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-shadow-lux font-display text-[34px] font-light leading-[1.08] text-cream sm:text-[42px] lg:text-[46px] short:text-[38px]">
                {t.hero.titleLine1}
              </h1>
              <p className="text-shadow-lux mt-1 font-script text-[30px] leading-tight text-gold-light sm:text-[36px] lg:text-[40px] short:text-[32px]">
                {t.hero.titleLine2}
              </p>

              <p className="text-shadow-lux mt-3.5 whitespace-pre-line text-[14.5px] leading-relaxed text-cream/85 short:mt-2.5">
                {t.hero.subtitle}
              </p>

              {/* Active dish detail — the part that changes with the carousel. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 short:mt-3">
                <span className="font-display text-xl uppercase tracking-wider text-gold-light lg:text-2xl">
                  {localizedName(active, locale as Locale)}
                </span>
                <span className="text-[13px] text-muted">
                  {localizedSubtitle(active, locale as Locale)}
                </span>
                <span className="rounded-full border border-gold/40 px-2.5 py-0.5 text-[13px] font-medium text-gold">
                  {formatPrice(active.priceCents, intl)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 max-w-md text-[13px] leading-relaxed text-muted">
                {localizedDescription(active, locale as Locale)}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center gap-3 short:mt-4">
            <ButtonLink href="/reservation" size="lg">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {t.common.reserveTable}
            </ButtonLink>
            <ButtonLink href="/menu" size="lg" variant="outline">
              <BookOpen className="h-4 w-4" aria-hidden />
              {t.common.viewMenu}
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* ---- Media controls (only meaningful once real footage exists) ---- */}
      {hasVideo && (
        <div className="absolute right-4 top-[calc(var(--header-h)+20px)] z-20 flex gap-2 sm:right-6 lg:right-20">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t.common.pauseVideo : t.common.playVideo}
            className="grid h-9 w-9 place-items-center rounded-full border border-gold/45 bg-black/55 text-gold backdrop-blur-md transition-colors hover:border-gold hover:bg-gold/15"
          >
            {playing ? (
              <Pause className="h-4 w-4" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? t.common.unmuteVideo : t.common.muteVideo}
            className="grid h-9 w-9 place-items-center rounded-full border border-gold/45 bg-black/55 text-gold backdrop-blur-md transition-colors hover:border-gold hover:bg-gold/15"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      )}

      {/* ---- Signature dish strip ---- */}
      <div className="relative z-10 shrink-0 pb-5 short:pb-3">
        <Container wide>
          <SignatureDishCarousel
            dishes={dishes}
            activeSlug={active.slug}
            onSelect={handleSelect}
          />
        </Container>
      </div>
      </div>
    </section>
  )
}
