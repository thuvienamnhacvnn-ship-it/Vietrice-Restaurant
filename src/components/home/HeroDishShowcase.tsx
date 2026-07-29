'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CalendarDays, Pause, Phone, Play, Volume2, VolumeX } from 'lucide-react'

import { site } from '@/config/site'

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

      {/* ---- Copy block ----
          Constrained to the 16:9 width so it lines up with every other
          section; the dish strip below deliberately breaks out to full width. */}
      <Container
        wide
        className="relative z-10 flex flex-1 items-center pb-8 pt-[calc(var(--header-h)+24px)] lg:!px-0 lg:!mx-0 lg:!max-w-none short:pb-4 short:pt-[calc(var(--header-h)+8px)]"
      >
        {/* The reference centres the whole cluster inside the left column
            rather than left-aligning it. */}
        <div className="flex w-full max-w-xl flex-col items-center text-center lg:ml-6 lg:max-w-[560px] xl:ml-10">
          <Logo layout="stacked" size="xl" asLink={false} />

          <div className="divider-lotus my-4 w-full max-w-[360px] lg:my-5 short:my-2">
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
              {/* Warm cream-to-gold wash, as in the reference. */}
              <h1 className="text-shadow-lux bg-[linear-gradient(180deg,#fbf3e2_0%,#f0d9a8_58%,#d8ae63_100%)] bg-clip-text font-display text-[34px] font-light leading-[1.08] text-transparent sm:text-[44px] lg:text-[50px] short:text-[40px]">
                {t.hero.titleLine1}
              </h1>
              <p className="text-shadow-lux mt-1 font-script text-[32px] leading-tight text-gold-light sm:text-[40px] lg:text-[46px] short:text-[36px]">
                {t.hero.titleLine2}
              </p>

              <p className="text-shadow-lux mt-4 whitespace-pre-line text-[15px] leading-relaxed text-cream/90 short:mt-3">
                {t.hero.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* The reference shows only the two CTAs here — the active dish's
              name, price and description live on the carousel card below. */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 short:mt-5">
            <ButtonLink href="/reservation" size="lg" className="min-w-[210px]">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {t.common.reserveTable}
            </ButtonLink>
            <ButtonLink href="/menu" size="lg" variant="outline" className="min-w-[210px]">
              <BookOpen className="h-4 w-4" aria-hidden />
              {t.common.viewMenu}
            </ButtonLink>
          </div>
        </div>
      </Container>

      {/* ---- Playback controls ---- back at the top-right of the banner. */}
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

      {/* ---- Hotline ---- kept at the left, just above the dish strip. */}
      <div className="relative z-20 flex w-full shrink-0 items-center px-4 pb-2 sm:px-6 lg:px-8">
        <a
          href={site.phone.href}
          className="group inline-flex items-center gap-2.5 rounded-full border border-gold/35 bg-black/45 py-1.5 pl-2 pr-4 backdrop-blur-md transition-colors hover:border-gold hover:bg-gold/10"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-gradient text-[#1a1408]">
            <Phone className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[9.5px] uppercase tracking-luxe text-muted">Hotline</span>
            <span className="mt-0.5 text-[13.5px] font-semibold text-cream group-hover:text-gold-light">
              {site.phone.display}
            </span>
          </span>
        </a>

      </div>

      {/* ---- Signature dish strip ----
          Full-bleed on purpose: the eight dishes span the whole screen width
          rather than sitting inside the 16:9 content box. */}
      <div className="relative z-10 w-full shrink-0 px-4 pb-5 sm:px-6 lg:px-8 short:pb-3">
        <SignatureDishCarousel
          dishes={dishes}
          activeSlug={active.slug}
          onSelect={handleSelect}
        />
      </div>
    </section>
  )
}
