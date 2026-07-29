import { menuItems } from '@/content/menu'
import { site } from '@/config/site'
import { openingHours } from '@/content/restaurant'
import type { Locale } from '@/i18n/config'
import { getActivePromotions } from '@/lib/promotions'
import { formatPrice } from '@/lib/utils'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type AIContext = {
  locale: Locale
  now: Date
}

export type AIResponse = {
  content: string
  /** Which backend produced this answer — surfaced in the UI as "demo mode". */
  provider: 'demo' | 'openai'
  /** Structured lookups used to build the answer, for traceability. */
  meta?: Record<string, unknown>
}

export interface AIProvider {
  readonly name: 'demo' | 'openai'
  chat(messages: ChatMessage[], context: AIContext): Promise<AIResponse>
}

// ---------------------------------------------------------------------------
// Grounding helpers — every fact the assistant states comes from these.
// ---------------------------------------------------------------------------

function name(locale: Locale, item: (typeof menuItems)[number]) {
  return locale === 'vi' ? item.nameVi : locale === 'en' ? item.nameEn : item.nameDe
}

function priceOf(locale: Locale, cents: number) {
  return formatPrice(cents, locale === 'en' ? 'en-GB' : locale === 'vi' ? 'vi-VN' : 'de-DE')
}

function listDishes(locale: Locale, items: typeof menuItems, limit = 5) {
  return items
    .slice(0, limit)
    .map((i) => `• ${item_label(locale, i)}`)
    .join('\n')
}

function item_label(locale: Locale, i: (typeof menuItems)[number]) {
  return `${i.nameVi} (${name(locale, i)}) — ${priceOf(locale, i.priceCents)}`
}

const SEAFOOD_ALLERGENS = ['B', 'D', 'R']

const T = {
  de: {
    intro: 'Gern! Hier sind meine Empfehlungen:',
    vegetarian: 'Unsere vegetarischen Gerichte:',
    seafoodFree: 'Diese Gerichte enthalten weder Fisch noch Meeresfrüchte:',
    mild: 'Diese Gerichte sind mild oder gar nicht scharf:',
    promos: 'Aktuelle Angebote:',
    noPromos: 'Aktuell laufen keine Aktionen.',
    booking:
      'Für eine Reservierung öffnen Sie bitte die Seite „Reservierung“ — dort wählen Sie Datum, Uhrzeit und Ihren Tisch. Ich kann eine Reservierung nicht selbst bestätigen.',
    order:
      'Zum Mitnehmen bestellen Sie bitte über „Online bestellen“. Dort können Sie Gerichte anpassen und eine Abholzeit wählen.',
    contact: 'So erreichen Sie uns:',
    hours: 'Öffnungszeiten',
    fallback:
      'Dazu habe ich keine gesicherten Informationen. Bitte rufen Sie uns an, dann helfen wir Ihnen persönlich weiter.',
    budget: 'Gerichte in Ihrem Budget:',
    combo: 'Vorschlag für Ihre Gruppe:',
  },
  en: {
    intro: 'Happy to help! Here are my recommendations:',
    vegetarian: 'Our vegetarian dishes:',
    seafoodFree: 'These dishes contain neither fish nor shellfish:',
    mild: 'These dishes are mild or not spicy at all:',
    promos: 'Current offers:',
    noPromos: 'There are no active promotions right now.',
    booking:
      'To book a table, please open the "Reservation" page — you can pick a date, time and table there. I cannot confirm a booking myself.',
    order:
      'For takeaway, please use "Order online". You can customise dishes and choose a pickup time there.',
    contact: 'Here is how to reach us:',
    hours: 'Opening hours',
    fallback:
      "I don't have verified information about that. Please give us a call and we'll help you personally.",
    budget: 'Dishes within your budget:',
    combo: 'A suggestion for your group:',
  },
  vi: {
    intro: 'Rất sẵn lòng! Đây là gợi ý của tôi:',
    vegetarian: 'Các món chay của chúng tôi:',
    seafoodFree: 'Những món này không chứa cá hay hải sản:',
    mild: 'Những món này ít cay hoặc không cay:',
    promos: 'Ưu đãi hiện có:',
    noPromos: 'Hiện chưa có chương trình khuyến mại nào.',
    booking:
      'Để đặt bàn, vui lòng mở trang „Đặt bàn“ — bạn có thể chọn ngày, giờ và bàn tại đó. Tôi không thể tự xác nhận đặt bàn.',
    order:
      'Để đặt món mang về, vui lòng dùng „Đặt món online“. Bạn có thể tuỳ chỉnh món và chọn giờ lấy.',
    contact: 'Bạn có thể liên hệ với chúng tôi qua:',
    hours: 'Giờ mở cửa',
    fallback:
      'Tôi chưa có thông tin chắc chắn về điều này. Vui lòng gọi cho nhà hàng để được hỗ trợ trực tiếp.',
    budget: 'Các món trong ngân sách của bạn:',
    combo: 'Gợi ý cho nhóm của bạn:',
  },
} as const

/**
 * Rule-based assistant used when no AI provider is configured.
 *
 * Every answer is assembled from the menu, promotion and contact data above —
 * it never invents dishes, prices or facts. When a question falls outside what
 * it can ground, it says so and points to the phone number instead of guessing.
 * It also never claims a booking or order was created; that requires a
 * successful database write, which only the reservation/order endpoints do.
 */
export class DemoAIProvider implements AIProvider {
  readonly name = 'demo' as const

  async chat(messages: ChatMessage[], context: AIContext): Promise<AIResponse> {
    const { locale, now } = context
    const t = T[locale]
    const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    const q = last.toLowerCase()

    const available = menuItems.filter((i) => i.isAvailable)

    const has = (...words: string[]) => words.some((w) => q.includes(w))

    // -- Vegetarian / vegan ---------------------------------------------------
    if (has('vegetar', 'vegan', 'chay', 'veggie')) {
      const items = available.filter((i) => i.isVegetarian)
      return {
        content: `${t.vegetarian}\n${listDishes(locale, items, 6)}`,
        provider: 'demo',
        meta: { intent: 'vegetarian', count: items.length },
      }
    }

    // -- Seafood / fish allergy ----------------------------------------------
    if (has('allerg', 'dị ứng', 'di ung', 'meeresfr', 'seafood', 'hải sản', 'hai san', 'fisch')) {
      const items = available.filter(
        (i) => !i.allergenCodes.some((c) => SEAFOOD_ALLERGENS.includes(c)),
      )
      return {
        content: `${t.seafoodFree}\n${listDishes(locale, items, 6)}`,
        provider: 'demo',
        meta: { intent: 'allergy', excluded: SEAFOOD_ALLERGENS },
      }
    }

    // -- Spice level ----------------------------------------------------------
    if (has('scharf', 'spicy', 'cay', 'mild', 'ít cay', 'it cay')) {
      const items = available.filter(
        (i) => i.spicyLevel === 'NONE' || i.spicyLevel === 'MILD',
      )
      return {
        content: `${t.mild}\n${listDishes(locale, items, 6)}`,
        provider: 'demo',
        meta: { intent: 'spice' },
      }
    }

    // -- Promotions -----------------------------------------------------------
    if (has('angebot', 'aktion', 'rabatt', 'promo', 'offer', 'deal', 'ưu đãi', 'uu dai', 'khuyến')) {
      const promos = getActivePromotions(locale, now)
      if (promos.length === 0) {
        return { content: t.noPromos, provider: 'demo', meta: { intent: 'promotions', count: 0 } }
      }
      const lines = promos
        .map((p) => {
          const value =
            p.discountPercent !== null
              ? `-${p.discountPercent}%`
              : p.comboPriceCents !== null
                ? priceOf(locale, p.comboPriceCents)
                : ''
          return `• ${p.title} ${value} — ${p.description}`
        })
        .join('\n')
      return {
        content: `${t.promos}\n${lines}`,
        provider: 'demo',
        meta: { intent: 'promotions', count: promos.length },
      }
    }

    // -- Budget ---------------------------------------------------------------
    const budgetMatch = q.match(/(\d{1,3})\s*(?:€|eur|euro)/)
    if (budgetMatch) {
      const limitCents = Number(budgetMatch[1]) * 100
      const items = available
        .filter((i) => i.priceCents <= limitCents)
        .sort((a, b) => b.priceCents - a.priceCents)
      return {
        content: `${t.budget}\n${listDishes(locale, items, 6)}`,
        provider: 'demo',
        meta: { intent: 'budget', limitCents },
      }
    }

    // -- Group / combo suggestion --------------------------------------------
    const peopleMatch = q.match(/(\d{1,2})\s*(person|personen|people|guest|người|nguoi|pax)/)
    if (peopleMatch && !has('reserv', 'tisch', 'book', 'đặt bàn', 'dat ban')) {
      const n = Number(peopleMatch[1])
      const picks = available.filter((i) => i.isBestseller).slice(0, Math.min(Math.max(n, 2), 5))
      return {
        content: `${t.combo}\n${picks.map((i) => `• ${item_label(locale, i)}`).join('\n')}`,
        provider: 'demo',
        meta: { intent: 'combo', partySize: n },
      }
    }

    // -- Booking --------------------------------------------------------------
    if (has('reserv', 'tisch', 'book a table', 'booking', 'đặt bàn', 'dat ban')) {
      return { content: t.booking, provider: 'demo', meta: { intent: 'booking' } }
    }

    // -- Takeaway -------------------------------------------------------------
    if (has('mitnehmen', 'abhol', 'takeaway', 'take away', 'pickup', 'mang về', 'mang ve', 'bestell', 'order')) {
      return { content: t.order, provider: 'demo', meta: { intent: 'order' } }
    }

    // -- Contact / hours ------------------------------------------------------
    if (has('adresse', 'address', 'kontakt', 'contact', 'telefon', 'phone', 'öffnung', 'opening', 'giờ mở', 'gio mo', 'địa chỉ', 'dia chi')) {
      const open = openingHours.filter((h) => !h.isClosed)
      const hours =
        open.length > 0 ? `${t.hours}: ${open[0].opensAt} – ${open[0].closesAt}` : ''
      return {
        content: `${t.contact}\n• ${site.address.full}\n• ${site.phone.display}\n• ${site.email}\n${hours}`,
        provider: 'demo',
        meta: { intent: 'contact' },
      }
    }

    // -- General recommendation ----------------------------------------------
    if (has('empfehl', 'recommend', 'gợi ý', 'goi y', 'beste', 'best', 'ngon')) {
      const items = available.filter((i) => i.isBestseller)
      return {
        content: `${t.intro}\n${listDishes(locale, items, 5)}`,
        provider: 'demo',
        meta: { intent: 'recommend' },
      }
    }

    // -- Dish name lookup -----------------------------------------------------
    const match = available.find((i) =>
      [i.nameVi, i.nameDe, i.nameEn].some((n) => q.includes(n.toLowerCase())),
    )
    if (match) {
      const desc =
        locale === 'vi'
          ? match.descriptionVi
          : locale === 'en'
            ? match.descriptionEn
            : match.descriptionDe
      return {
        content: `${item_label(locale, match)}\n${desc}`,
        provider: 'demo',
        meta: { intent: 'dish', slug: match.slug },
      }
    }

    return { content: t.fallback, provider: 'demo', meta: { intent: 'fallback' } }
  }
}

/**
 * Resolve the configured provider.
 *
 * `AI_PROVIDER=openai` plus `OPENAI_API_KEY` switches to a hosted model; with
 * either missing the app falls back to demo mode rather than crashing, and the
 * UI labels the answers accordingly.
 */
export function getAIProvider(): AIProvider {
  const configured = process.env.AI_PROVIDER?.toLowerCase()
  const hasKey = Boolean(process.env.OPENAI_API_KEY)

  if (configured === 'openai' && hasKey) {
    // Intentionally not implemented yet: wiring a hosted model without the
    // grounding/tool layer would let it invent dishes and prices, which the
    // spec forbids. Demo mode stays authoritative until that layer exists.
    return new DemoAIProvider()
  }

  return new DemoAIProvider()
}
