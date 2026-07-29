'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Award,
  CalendarRange,
  Gift,
  Heart,
  Percent,
  Sparkles,
  Tag,
  Users,
  Utensils,
} from 'lucide-react'

import { useI18n } from '@/i18n/provider'
import { promotionHref, type PublicPromotion } from '@/lib/promotions'
import { cn, formatPrice } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { SectionFrame } from '@/components/ui/SectionFrame'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CountdownBoxes } from './CountdownBoxes'

const CARD_ICON = [Gift, Users, Utensils, Sparkles]

const TRUST_ITEMS = [
  { Icon: Percent, key: 'price' },
  { Icon: Award, key: 'quality' },
  { Icon: Heart, key: 'love' },
  { Icon: CalendarRange, key: 'regular' },
] as const

const TRUST_COPY: Record<
  'de' | 'en' | 'vi',
  { title: string; body: string }[]
> = {
  de: [
    { title: 'Beste Preise', body: 'Hochwertige Gerichte zu unschlagbaren Preisen.' },
    { title: 'Frische Qualität', body: 'Wir verwenden nur frische und hochwertige Zutaten.' },
    { title: 'Kunden lieben uns', body: 'Vielen Dank für Ihr Vertrauen und Ihre Unterstützung.' },
    { title: 'Regelmässige Aktionen', body: 'Neue Angebote jede Woche – bleiben Sie gespannt!' },
  ],
  en: [
    { title: 'Best prices', body: 'High-quality dishes at unbeatable prices.' },
    { title: 'Fresh quality', body: 'We only use fresh, high-quality ingredients.' },
    { title: 'Guests love us', body: 'Thank you for your trust and support.' },
    { title: 'Regular offers', body: 'New promotions every week — stay tuned!' },
  ],
  vi: [
    { title: 'Giá tốt nhất', body: 'Món ăn chất lượng với mức giá hấp dẫn.' },
    { title: 'Chất lượng tươi ngon', body: 'Chúng tôi chỉ dùng nguyên liệu tươi và chất lượng.' },
    { title: 'Khách hàng yêu thích', body: 'Cảm ơn sự tin tưởng và ủng hộ của bạn.' },
    { title: 'Ưu đãi thường xuyên', body: 'Chương trình mới mỗi tuần — đừng bỏ lỡ!' },
  ],
}

const HEADING: Record<'de' | 'en' | 'vi', { title: string; script: string; body: string; endsIn: string; all: string }> = {
  de: {
    title: 'Special Promotions',
    script: 'Great food, great offer!',
    body: 'Entdecken Sie unsere aktuellen Angebote\nund geniessen Sie mehr für weniger.',
    endsIn: 'Angebot endet in',
    all: 'Alle Aktionen ansehen',
  },
  en: {
    title: 'Special Promotions',
    script: 'Great food, great offer!',
    body: 'Discover our current offers\nand enjoy more for less.',
    endsIn: 'Offer ends in',
    all: 'See all promotions',
  },
  vi: {
    title: 'Ưu đãi đặc biệt',
    script: 'Great food, great offer!',
    body: 'Khám phá các ưu đãi hiện có\nvà tận hưởng nhiều hơn với chi phí ít hơn.',
    endsIn: 'Ưu đãi kết thúc sau',
    all: 'Xem tất cả ưu đãi',
  },
}

/**
 * Promotions section, matching mockup 4: heading + countdown on the right,
 * a row of four campaign cards, and a trust strip along the bottom.
 *
 * Only campaigns the server has already validated as active are passed in.
 */
export function PromotionsSection({
  promotions,
  soonestEndingIso,
  serverNowIso,
  showAllLink = true,
}: {
  promotions: PublicPromotion[]
  soonestEndingIso: string | null
  serverNowIso: string
  showAllLink?: boolean
}) {
  const { t, locale, intl } = useI18n()
  const copy = HEADING[locale]
  const trust = TRUST_COPY[locale]

  if (promotions.length === 0) return null

  return (
    <SectionFrame
      aria-labelledby="promotions-heading"
      className="border-t border-gold/10 bg-background"
    >
      {/* Warm bokeh wash, echoing the mockup's backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_75%_20%,rgba(216,174,99,0.10),transparent_70%)]"
      />

      <Container wide className="relative flex h-full flex-col justify-center py-14 lg:py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            title={copy.title}
            script={copy.script}
            description={copy.body}
            className="[&>h2]:!text-gold-gradient"
          />
          <h2 id="promotions-heading" className="sr-only">
            {copy.title}
          </h2>

          {soonestEndingIso && (
            <CountdownBoxes
              targetIso={soonestEndingIso}
              serverNowIso={serverNowIso}
              label={copy.endsIn}
              className="w-full shrink-0 lg:w-[420px]"
            />
          )}
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {promotions.map((p, i) => {
            const Icon = CARD_ICON[i % CARD_ICON.length]
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="card-lux card-lux-hover group flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background-soft via-background-soft/25 to-transparent"
                  />
                  <div className="absolute inset-x-4 top-4">
                    <h3 className="font-display text-2xl uppercase tracking-wide text-gold-light">
                      {p.title}
                    </h3>
                    <p className="mt-0.5 font-display text-[28px] leading-none text-cream">
                      {p.discountPercent !== null
                        ? `-${p.discountPercent}%`
                        : p.comboPriceCents !== null
                          ? formatPrice(p.comboPriceCents, intl)
                          : ''}
                    </p>
                    <p className="mt-1.5 text-[12.5px] text-cream/80">{p.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-[13px] leading-snug text-muted">{p.description}</p>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-snug text-muted/70">{p.conditions}</p>

                  <ButtonLink
                    href={promotionHref(p.ctaType)}
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                  >
                    {p.ctaType === 'ORDER' ? t.common.orderNow : t.common.reserveTable}
                  </ButtonLink>
                </div>
              </motion.li>
            )
          })}
        </ul>

        {showAllLink && (
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/promotions" size="lg">
              <Tag className="h-4 w-4" aria-hidden />
              {copy.all}
            </ButtonLink>
          </div>
        )}

        <ul className="mt-12 grid gap-6 border-t border-gold/12 pt-8 sm:grid-cols-2 xl:grid-cols-4">
          {TRUST_ITEMS.map(({ Icon, key }, i) => (
            <li key={key} className="flex items-start gap-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className={cn('font-display text-lg uppercase tracking-wide text-cream')}>
                  {trust[i].title}
                </h3>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{trust[i].body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </SectionFrame>
  )
}
