'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
  SquareParking,
  Star,
  Utensils,
  X,
} from 'lucide-react'

import { venueStats } from '@/content/restaurant'
import type { GalleryItemSeed } from '@/content/gallery'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { SectionFrame } from '@/components/ui/SectionFrame'

const COPY: Record<
  'de' | 'en' | 'vi',
  {
    title: string
    script: string
    body: string
    seats: string
    rooms: string
    parking: string
    features: { title: string; body: string }[]
    openLightbox: string
  }
> = {
  de: {
    title: 'Our Restaurant',
    script: 'A place to enjoy and relax',
    body: 'Erleben Sie die authentische vietnamesische Küche in einem stilvollen und einladenden Ambiente im Herzen von Berlin.',
    seats: 'Sitzplätze',
    rooms: 'Private Räume',
    parking: 'Parkplätze vorhanden',
    openLightbox: 'Bild vergrössern',
    features: [
      { title: 'Authentische Küche', body: 'Traditionelle vietnamesische Rezepte mit frischen Zutaten.' },
      { title: 'Erfahrene Köche', body: 'Unsere Köche bringen die Aromen Vietnams nach Berlin.' },
      { title: 'Herzlicher Service', body: 'Wir sorgen dafür, dass Sie sich wie zu Hause fühlen.' },
      { title: 'Beste Qualität', body: 'Höchste Qualität für ein unvergessliches Erlebnis.' },
      { title: 'Zentrale Lage', body: 'Im Herzen von Berlin, leicht zu erreichen.' },
    ],
  },
  en: {
    title: 'Our Restaurant',
    script: 'A place to enjoy and relax',
    body: 'Experience authentic Vietnamese cuisine in a stylish and welcoming setting in the heart of Berlin.',
    seats: 'Seats',
    rooms: 'Private rooms',
    parking: 'Parking available',
    openLightbox: 'Enlarge image',
    features: [
      { title: 'Authentic cuisine', body: 'Traditional Vietnamese recipes with fresh ingredients.' },
      { title: 'Experienced chefs', body: 'Our chefs bring the flavours of Vietnam to Berlin.' },
      { title: 'Warm service', body: 'We make sure you feel right at home.' },
      { title: 'Best quality', body: 'The highest quality for an unforgettable experience.' },
      { title: 'Central location', body: 'In the heart of Berlin, easy to reach.' },
    ],
  },
  vi: {
    title: 'Không gian nhà hàng',
    script: 'A place to enjoy and relax',
    body: 'Trải nghiệm ẩm thực Việt đích thực trong không gian sang trọng và ấm cúng giữa lòng Berlin.',
    seats: 'Chỗ ngồi',
    rooms: 'Phòng riêng',
    parking: 'Có bãi đỗ xe',
    openLightbox: 'Phóng to ảnh',
    features: [
      { title: 'Ẩm thực đích thực', body: 'Công thức truyền thống với nguyên liệu tươi ngon.' },
      { title: 'Đầu bếp giàu kinh nghiệm', body: 'Mang hương vị Việt Nam đến Berlin.' },
      { title: 'Phục vụ tận tâm', body: 'Chúng tôi mang đến cảm giác như ở nhà.' },
      { title: 'Chất lượng hàng đầu', body: 'Chất lượng cao nhất cho trải nghiệm đáng nhớ.' },
      { title: 'Vị trí trung tâm', body: 'Ngay trung tâm Berlin, dễ dàng di chuyển.' },
    ],
  },
}

const FEATURE_ICONS = [Utensils, ChefHat, Heart, Star, MapPin]

function localizedTitle(item: GalleryItemSeed, locale: 'de' | 'en' | 'vi') {
  return locale === 'en' ? item.titleEn : locale === 'vi' ? item.titleVi : item.titleDe
}
function localizedCaption(item: GalleryItemSeed, locale: 'de' | 'en' | 'vi') {
  return locale === 'en' ? item.captionEn : locale === 'vi' ? item.captionVi : item.captionDe
}

/**
 * Restaurant space section, matching mockup 5: a wide panorama with the venue
 * stats overlaid, a row of space tiles, and the feature strip underneath.
 * Tiles open in an accessible lightbox with keyboard navigation.
 */
export function GallerySection({
  items,
  showFeatures = true,
}: {
  items: GalleryItemSeed[]
  showFeatures?: boolean
}) {
  const { t, locale } = useI18n()
  const copy = COPY[locale]

  const featured = items.find((i) => i.isFeatured) ?? items[0]
  const tiles = items.filter((i) => i.slug !== featured?.slug)

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpenIndex((i) => (i === null ? null : (i + dir + tiles.length) % tiles.length)),
    [tiles.length],
  )

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [openIndex, close, step])

  const activeTile = openIndex === null ? null : tiles[openIndex]

  return (
    <SectionFrame aria-labelledby="gallery-heading" className="border-t border-gold/10 bg-background">
      <Container wide className="flex h-full flex-col justify-center py-14 lg:py-8">
        {/* ---- Panorama ---- */}
        {featured && (
          <div className="relative overflow-hidden rounded-2xl border border-gold/20">
            <div className="relative aspect-[21/9] w-full lg:aspect-[24/7]">
              <Image
                src={featured.url}
                alt={featured.altText}
                fill
                priority={false}
                sizes="(max-width: 1280px) 100vw, 1680px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,6,0.94)_0%,rgba(8,8,6,0.72)_34%,rgba(8,8,6,0.15)_62%,rgba(8,8,6,0)_100%)]"
              />
            </div>

            <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center p-6 sm:p-10">
              <h2
                id="gallery-heading"
                className="font-display text-[30px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[40px]"
              >
                {copy.title}
              </h2>
              <p className="mt-1 font-script text-[24px] text-cream/90 sm:text-[30px]">
                {copy.script}
              </p>
              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-cream/80 sm:text-[14.5px]">
                {copy.body}
              </p>

              <ul className="mt-6 flex flex-wrap gap-5">
                <li className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold">
                    <Utensils className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-xl text-cream">
                      {venueStats.seats}+
                    </span>
                    <span className="block text-[11.5px] text-muted">{copy.seats}</span>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-xl text-cream">
                      {venueStats.privateRooms}
                    </span>
                    <span className="block text-[11.5px] text-muted">{copy.rooms}</span>
                  </span>
                </li>
                {venueStats.hasParking && (
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold">
                      <SquareParking className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="max-w-[110px] text-[11.5px] leading-snug text-muted">
                      {copy.parking}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* ---- Tiles ---- */}
        <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {tiles.map((item, i) => (
            <motion.li
              key={item.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`${localizedTitle(item, locale)} — ${copy.openLightbox}`}
                className="card-lux card-lux-hover group block w-full overflow-hidden text-left"
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.url}
                    alt={item.altText}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background-soft/90 via-transparent to-transparent"
                  />
                </span>
                <span className="block px-3.5 py-3">
                  <span className="block font-display text-[15px] uppercase tracking-wide text-gold-light">
                    {localizedTitle(item, locale)}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
                    {localizedCaption(item, locale)}
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>

        {/* ---- Feature strip ---- */}
        {showFeatures && (
          <ul className="mt-12 grid gap-6 border-t border-gold/12 pt-8 sm:grid-cols-2 xl:grid-cols-5">
            {copy.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <li key={f.title} className="flex items-start gap-3.5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] uppercase tracking-wide text-cream">
                      {f.title}
                    </h3>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{f.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Container>

      {/* ---- Lightbox ---- */}
      <AnimatePresence>
        {activeTile && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={localizedTitle(activeTile, locale)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label={t.common.close}
              onClick={close}
              className="absolute inset-0 h-full w-full cursor-default"
            />

            <motion.figure
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-4xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gold/30">
                <Image
                  src={activeTile.url}
                  alt={activeTile.altText}
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-center">
                <span className="block font-display text-xl uppercase tracking-wide text-gold-light">
                  {localizedTitle(activeTile, locale)}
                </span>
                <span className="mt-0.5 block text-[13px] text-muted">
                  {localizedCaption(activeTile, locale)}
                </span>
              </figcaption>
            </motion.figure>

            <button
              type="button"
              onClick={close}
              aria-label={t.common.close}
              className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-gold/45 bg-black/60 text-gold hover:bg-gold/15"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t.common.previous}
              className="absolute left-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-gold/45 bg-black/60 text-gold hover:bg-gold/15 sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t.common.next}
              className="absolute right-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-gold/45 bg-black/60 text-gold hover:bg-gold/15 sm:right-6"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionFrame>
  )
}
