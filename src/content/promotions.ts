/**
 * Promotion seed data, matching the four cards in the promotions mockup.
 *
 * `startsAt`/`endsAt` are computed relative to the seed run so the demo always
 * shows live campaigns. Validity is evaluated server-side against server time —
 * never against the visitor's clock.
 */
export type PromotionSeed = {
  slug: string
  titleDe: string
  titleEn: string
  titleVi: string
  subtitleDe: string
  subtitleEn: string
  subtitleVi: string
  descriptionDe: string
  descriptionEn: string
  descriptionVi: string
  conditionsDe: string
  conditionsEn: string
  conditionsVi: string
  discountPercent: number | null
  comboPriceCents: number | null
  image: string
  ctaType: 'RESERVATION' | 'ORDER' | 'MENU' | 'CONTACT'
  /** Days from seed time until the campaign ends. */
  endsInDays: number
  /** 0 = Sunday … 6 = Saturday. Empty means every day. */
  weekdays: number[]
  startTime: string | null
  endTime: string | null
  sortOrder: number
}

export const promotions: PromotionSeed[] = [
  {
    slug: 'lunch-deal',
    titleDe: 'Lunch Deal',
    titleEn: 'Lunch Deal',
    titleVi: 'Ưu đãi bữa trưa',
    subtitleDe: 'Mo – Fr, 11:00 – 15:00',
    subtitleEn: 'Mon – Fri, 11:00 – 15:00',
    subtitleVi: 'T2 – T6, 11:00 – 15:00',
    descriptionDe: '20% Rabatt auf alle Pho & Hauptgerichte.',
    descriptionEn: '20% off all pho and main dishes.',
    descriptionVi: 'Giảm 20% cho tất cả món phở và món chính.',
    conditionsDe: 'Nur im Restaurant, Mo–Fr von 11:00 bis 15:00. Nicht mit anderen Aktionen kombinierbar.',
    conditionsEn: 'Dine-in only, Mon–Fri 11:00–15:00. Cannot be combined with other offers.',
    conditionsVi: 'Chỉ áp dụng tại nhà hàng, T2–T6 từ 11:00 đến 15:00. Không cộng dồn ưu đãi.',
    discountPercent: 20,
    comboPriceCents: null,
    image: '/images/promotions/lunch-deal.jpg',
    ctaType: 'RESERVATION',
    endsInDays: 45,
    weekdays: [1, 2, 3, 4, 5],
    startTime: '11:00',
    endTime: '15:00',
    sortOrder: 0,
  },
  {
    slug: 'family-combo',
    titleDe: 'Family Combo',
    titleEn: 'Family Combo',
    titleVi: 'Combo gia đình',
    subtitleDe: 'Für 4 Personen',
    subtitleEn: 'For 4 people',
    subtitleVi: 'Dành cho 4 người',
    descriptionDe: 'Vorspeise + 4 Hauptgerichte + 4 Getränke.',
    descriptionEn: 'Starter + 4 main dishes + 4 drinks.',
    descriptionVi: 'Khai vị + 4 món chính + 4 đồ uống.',
    conditionsDe: 'Gilt für genau 4 Personen. Vorbestellung empfohlen.',
    conditionsEn: 'Valid for exactly 4 guests. Pre-order recommended.',
    conditionsVi: 'Áp dụng cho đúng 4 người. Nên đặt trước.',
    discountPercent: null,
    comboPriceCents: 3990,
    image: '/images/promotions/family-combo.jpg',
    ctaType: 'RESERVATION',
    endsInDays: 60,
    weekdays: [],
    startTime: null,
    endTime: null,
    sortOrder: 1,
  },
  {
    slug: 'sushi-friday',
    titleDe: 'Sushi Friday',
    titleEn: 'Sushi Friday',
    titleVi: 'Thứ sáu Sushi',
    subtitleDe: 'Jeden Freitag',
    subtitleEn: 'Every Friday',
    subtitleVi: 'Mỗi thứ sáu',
    descriptionDe: '15% Rabatt auf alle Sushi Sets.',
    descriptionEn: '15% off all sushi sets.',
    descriptionVi: 'Giảm 15% cho tất cả set sushi.',
    conditionsDe: 'Nur freitags, im Restaurant und für Abholung.',
    conditionsEn: 'Fridays only, dine-in and pickup.',
    conditionsVi: 'Chỉ áp dụng thứ sáu, tại nhà hàng và mang về.',
    discountPercent: 15,
    comboPriceCents: null,
    image: '/images/promotions/sushi-friday.jpg',
    ctaType: 'ORDER',
    endsInDays: 90,
    weekdays: [5],
    startTime: null,
    endTime: null,
    sortOrder: 2,
  },
  {
    slug: 'happy-birthday',
    titleDe: 'Happy Birthday!',
    titleEn: 'Happy Birthday!',
    titleVi: 'Chúc mừng sinh nhật!',
    subtitleDe: 'Für Geburtstagsgäste',
    subtitleEn: 'For birthday guests',
    subtitleVi: 'Dành cho khách sinh nhật',
    descriptionDe: 'Gratis Dessert für das Geburtstagskind.',
    descriptionEn: 'Free dessert for the birthday guest.',
    descriptionVi: 'Tặng món tráng miệng miễn phí cho người có sinh nhật.',
    conditionsDe: 'Bitte bei der Reservierung angeben. Ausweis erforderlich.',
    conditionsEn: 'Please mention when booking. ID required.',
    conditionsVi: 'Vui lòng thông báo khi đặt bàn. Cần xuất trình giấy tờ.',
    discountPercent: null,
    comboPriceCents: null,
    image: '/images/promotions/happy-birthday.jpg',
    ctaType: 'RESERVATION',
    endsInDays: 180,
    weekdays: [],
    startTime: null,
    endTime: null,
    sortOrder: 3,
  },
]
