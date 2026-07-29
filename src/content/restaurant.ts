/**
 * Editable restaurant facts. Seeded into `RestaurantSetting` / `OpeningHour`
 * and fully manageable from Admin — this module is only the initial value and
 * the offline fallback.
 *
 * Every figure here is taken directly from the supplied design mockups
 * (opening hours and the venue stats appear in the gallery and footer frames).
 * Nothing is invented; adjust in Admin if the real numbers differ.
 */

export type OpeningHourEntry = {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
}

/** Mockup footer states: "Giờ mở cửa: 11:00 – 23:00 (T2 – CN)" — daily. */
export const openingHours: OpeningHourEntry[] = [
  { weekday: 1, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 2, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 3, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 4, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 5, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 6, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
  { weekday: 0, isClosed: false, opensAt: '11:00', closesAt: '23:00' },
]

/** Venue stats shown on the gallery hero. From mockup 5. */
export const venueStats = {
  seats: 120,
  privateRooms: 3,
  hasParking: true,
}

/** Aggregate rating shown in the footer. From mockup 6. */
export const reviewSummary = {
  score: 4.8,
  count: 328,
}

/** Footer "Services" column. */
export const serviceLinks = [
  { key: 'reservation', href: '/reservation' },
  { key: 'order', href: '/order' },
  { key: 'menu', href: '/menu' },
  { key: 'events', href: '/promotions' },
  { key: 'gallery', href: '/gallery' },
  { key: 'contact', href: '/contact' },
] as const

/** The AI Chef Assistant gets its own footer entry so the page is reachable. */
export const assistantLink = { href: '/ai-assistant' } as const

/** Footer "Customer support" column. */
export const supportLinks = [
  { key: 'faq', href: '/faq' },
  { key: 'privacy', href: '/datenschutz' },
  { key: 'terms', href: '/agb' },
  { key: 'cancellation', href: '/stornierung' },
  { key: 'allergens', href: '/allergene' },
  { key: 'impressum', href: '/impressum' },
  { key: 'cookies', href: '/cookies' },
] as const
