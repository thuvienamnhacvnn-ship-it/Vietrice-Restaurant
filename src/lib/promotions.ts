import { promotions as promotionSeeds, type PromotionSeed } from '@/content/promotions'
import type { Locale } from '@/i18n/config'

/** Shape the public UI consumes, with concrete ISO dates resolved. */
export type PublicPromotion = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  conditions: string
  discountPercent: number | null
  comboPriceCents: number | null
  image: string
  ctaType: PromotionSeed['ctaType']
  startsAtIso: string
  endsAtIso: string
  weekdays: number[]
  startTime: string | null
  endTime: string | null
}

const CTA_HREF: Record<PromotionSeed['ctaType'], string> = {
  RESERVATION: '/reservation',
  ORDER: '/order',
  MENU: '/menu',
  CONTACT: '/contact',
}

export function promotionHref(type: PromotionSeed['ctaType']): string {
  return CTA_HREF[type]
}

function pick(locale: Locale, de: string, en: string, vi: string): string {
  if (locale === 'en') return en
  if (locale === 'vi') return vi
  return de
}

/**
 * Resolve seed promotions into the public shape.
 *
 * `now` must be the *server's* clock. Only campaigns whose window contains
 * `now` are returned — an expired promotion is never sent to the browser, so
 * the client cannot resurrect one by tampering with its own clock.
 */
export function getActivePromotions(locale: Locale, now: Date): PublicPromotion[] {
  const startsAt = new Date(now)
  startsAt.setDate(startsAt.getDate() - 7)

  return promotionSeeds
    .map<PublicPromotion>((p) => {
      const endsAt = new Date(now)
      endsAt.setDate(endsAt.getDate() + p.endsInDays)
      return {
        id: p.slug,
        slug: p.slug,
        title: pick(locale, p.titleDe, p.titleEn, p.titleVi),
        subtitle: pick(locale, p.subtitleDe, p.subtitleEn, p.subtitleVi),
        description: pick(locale, p.descriptionDe, p.descriptionEn, p.descriptionVi),
        conditions: pick(locale, p.conditionsDe, p.conditionsEn, p.conditionsVi),
        discountPercent: p.discountPercent,
        comboPriceCents: p.comboPriceCents,
        image: p.image,
        ctaType: p.ctaType,
        startsAtIso: startsAt.toISOString(),
        endsAtIso: endsAt.toISOString(),
        weekdays: p.weekdays,
        startTime: p.startTime,
        endTime: p.endTime,
      }
    })
    .filter((p) => {
      const start = new Date(p.startsAtIso).getTime()
      const end = new Date(p.endsAtIso).getTime()
      const t = now.getTime()
      return t >= start && t <= end
    })
}

/** The soonest-ending active campaign — drives the section-level countdown. */
export function nextExpiring(items: PublicPromotion[]): PublicPromotion | null {
  if (items.length === 0) return null
  return [...items].sort(
    (a, b) => new Date(a.endsAtIso).getTime() - new Date(b.endsAtIso).getTime(),
  )[0]
}
