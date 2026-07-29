/**
 * The eight signature dishes shown in the home hero carousel.
 *
 * This module is the single source of truth consumed by BOTH `prisma/seed.ts`
 * and the public site's fallback path (used when no database is reachable yet),
 * so the two can never drift. Components receive this data as props — they
 * never import it directly.
 *
 * `video` is intentionally null: no video files were supplied with the design
 * assets. `VideoBackground` falls back to `poster` whenever `video` is missing
 * or fails to load. Fill the field in via Admin once real footage exists.
 *
 * Only Pho Bo has a full-resolution photograph in the source mockups. The other
 * seven posters are upscaled, softened derivatives of their carousel thumbnails
 * (see `scripts/extract-assets.mjs`) — swap them for real photography via Admin.
 */
export type SignatureDish = {
  slug: string
  nameVi: string
  nameDe: string
  nameEn: string
  descriptionVi: string
  descriptionDe: string
  descriptionEn: string
  priceCents: number
  /** Carousel thumbnail. */
  thumbnail: string
  /** Full-bleed banner image; doubles as the video poster. */
  poster: string
  /** Absolute or public-relative video URL, or null when none exists. */
  video: string | null
  category: string
  isBestseller: boolean
  isVegetarian: boolean
  spicyLevel: 'NONE' | 'MILD' | 'MEDIUM' | 'HOT' | 'VERY_HOT'
  calories: number | null
  preparationMinutes: number | null
  rating: number
  ratingCount: number
}

export const signatureDishes: SignatureDish[] = [
  {
    slug: 'pho-bo-dac-biet',
    nameVi: 'Phở Bò Đặc Biệt',
    nameDe: 'Pho Bo Spezial',
    nameEn: 'Special Beef Pho',
    descriptionVi: 'Phở bò truyền thống với rau thơm tươi, bánh phở và nước dùng nhà nấu.',
    descriptionDe:
      'Traditionelle vietnamesische Rindfleischnudelsuppe mit frischen Kräutern, Reisnudeln und hausgemachter Brühe.',
    descriptionEn:
      'Traditional Vietnamese beef noodle soup with fresh herbs, rice noodles and house-made broth.',
    priceCents: 1490,
    thumbnail: '/images/dishes/pho-bo-dac-biet.jpg',
    poster: '/images/hero/hero-pho-bo.jpg',
    video: null,
    category: 'pho-suppen',
    isBestseller: true,
    isVegetarian: false,
    spicyLevel: 'MILD',
    calories: 450,
    preparationMinutes: 18,
    rating: 4.8,
    ratingCount: 128,
  },
  {
    slug: 'bun-bo-hue',
    nameVi: 'Bún Bò Huế',
    nameDe: 'Bun Bo Hue',
    nameEn: 'Bun Bo Hue',
    descriptionVi: 'Bún bò cay đậm đà theo phong cách xứ Huế.',
    descriptionDe: 'Pikante Rindfleischsuppe nach Hue-Art.',
    descriptionEn: 'Spicy beef noodle soup, Hue style.',
    priceCents: 1550,
    thumbnail: '/images/dishes/bun-bo-hue.jpg',
    poster: '/images/hero/dishes/bun-bo-hue.jpg',
    video: null,
    category: 'pho-suppen',
    isBestseller: true,
    isVegetarian: false,
    spicyLevel: 'HOT',
    calories: 520,
    preparationMinutes: 20,
    rating: 4.7,
    ratingCount: 96,
  },
  {
    slug: 'goi-cuon-tom',
    nameVi: 'Gỏi Cuốn Tôm',
    nameDe: 'Sommerrollen mit Garnelen',
    nameEn: 'Fresh Summer Rolls with Prawns',
    descriptionVi: 'Gỏi cuốn tươi với tôm, rau thơm và nước chấm đặc biệt.',
    descriptionDe: 'Frische Sommerrollen mit Garnelen, Kräutern und hausgemachtem Dip.',
    descriptionEn: 'Fresh summer rolls with prawns, herbs and a house-made dipping sauce.',
    priceCents: 790,
    thumbnail: '/images/dishes/goi-cuon-tom.jpg',
    poster: '/images/hero/dishes/goi-cuon-tom.jpg',
    video: null,
    category: 'vorspeisen',
    isBestseller: false,
    isVegetarian: false,
    spicyLevel: 'NONE',
    calories: 220,
    preparationMinutes: 10,
    rating: 4.9,
    ratingCount: 74,
  },
  {
    slug: 'com-tam-suon',
    nameVi: 'Cơm Tấm Sườn',
    nameDe: 'Gebratenes Schweinekotelett mit Reis',
    nameEn: 'Grilled Pork Chop with Broken Rice',
    descriptionVi: 'Cơm tấm sườn nướng kiểu Sài Gòn, ăn kèm đồ chua.',
    descriptionDe: 'Gebratenes Schweinekotelett mit Reis nach Saigon-Art.',
    descriptionEn: 'Saigon-style grilled pork chop served with broken rice and pickles.',
    priceCents: 1650,
    thumbnail: '/images/dishes/com-tam-suon.jpg',
    poster: '/images/hero/dishes/com-tam-suon.jpg',
    video: null,
    category: 'reisgerichte',
    isBestseller: true,
    isVegetarian: false,
    spicyLevel: 'MILD',
    calories: 680,
    preparationMinutes: 22,
    rating: 4.6,
    ratingCount: 112,
  },
  {
    slug: 'sushi-set-premium',
    nameVi: 'Sushi Set Cao Cấp',
    nameDe: 'Sushi Set Premium',
    nameEn: 'Premium Sushi Set',
    descriptionVi: 'Tuyển chọn sushi cao cấp do đầu bếp chuẩn bị.',
    descriptionDe: 'Ausgewählte Sushi-Kreationen, frisch von unseren Sushi-Meistern.',
    descriptionEn: 'A curated premium sushi selection, prepared fresh by our sushi chefs.',
    priceCents: 2890,
    thumbnail: '/images/dishes/sushi-set-premium.jpg',
    poster: '/images/hero/dishes/sushi-set-premium.jpg',
    video: null,
    category: 'sushi-sashimi',
    isBestseller: true,
    isVegetarian: false,
    spicyLevel: 'NONE',
    calories: 610,
    preparationMinutes: 25,
    rating: 4.9,
    ratingCount: 203,
  },
  {
    slug: 'banh-xeo',
    nameVi: 'Bánh Xèo',
    nameDe: 'Knuspriger Reispfannkuchen',
    nameEn: 'Crispy Rice Pancake',
    descriptionVi: 'Bánh xèo giòn với tôm và thịt heo, cuốn cùng rau sống.',
    descriptionDe: 'Knuspriger Reispfannkuchen mit Garnelen & Schweinefleisch.',
    descriptionEn: 'Crispy rice pancake with prawns and pork, wrapped in fresh herbs.',
    priceCents: 1390,
    thumbnail: '/images/dishes/banh-xeo.jpg',
    poster: '/images/hero/dishes/banh-xeo.jpg',
    video: null,
    category: 'grill-bbq',
    isBestseller: false,
    isVegetarian: false,
    spicyLevel: 'MILD',
    calories: 540,
    preparationMinutes: 20,
    rating: 4.7,
    ratingCount: 68,
  },
  {
    slug: 'bun-cha-ha-noi',
    nameVi: 'Bún Chả Hà Nội',
    nameDe: 'Gegrilltes Schweinefleisch mit Reisnudeln',
    nameEn: 'Hanoi Grilled Pork with Rice Noodles',
    descriptionVi: 'Bún chả Hà Nội với thịt nướng than hoa và nước chấm chua ngọt.',
    descriptionDe: 'Gegrilltes Schweinefleisch mit Reisnudeln nach Hanoi-Art.',
    descriptionEn: 'Charcoal-grilled pork with rice noodles and sweet-sour dipping sauce.',
    priceCents: 1590,
    thumbnail: '/images/dishes/bun-cha-ha-noi.jpg',
    poster: '/images/hero/dishes/bun-cha-ha-noi.jpg',
    video: null,
    category: 'nudelgerichte',
    isBestseller: false,
    isVegetarian: false,
    spicyLevel: 'MILD',
    calories: 590,
    preparationMinutes: 20,
    rating: 4.8,
    ratingCount: 87,
  },
  {
    slug: 'ca-phe-viet',
    nameVi: 'Cà Phê Việt',
    nameDe: 'Traditioneller vietnamesischer Kaffee',
    nameEn: 'Traditional Vietnamese Coffee',
    descriptionVi: 'Cà phê phin truyền thống với sữa đặc.',
    descriptionDe: 'Traditioneller vietnamesischer Filterkaffee mit Kondensmilch.',
    descriptionEn: 'Traditional Vietnamese drip coffee with condensed milk.',
    priceCents: 450,
    thumbnail: '/images/dishes/ca-phe-viet.jpg',
    poster: '/images/hero/dishes/ca-phe-viet.jpg',
    video: null,
    category: 'getraenke',
    isBestseller: false,
    isVegetarian: true,
    spicyLevel: 'NONE',
    calories: 120,
    preparationMinutes: 6,
    rating: 4.9,
    ratingCount: 154,
  },
]
