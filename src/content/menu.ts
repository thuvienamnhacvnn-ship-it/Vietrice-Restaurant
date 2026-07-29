/**
 * Menu catalogue: categories, allergens and dishes.
 *
 * Shared source of truth for `prisma/seed.ts` and the offline fallback used by
 * the public Smart Menu. Prices are euro cents.
 *
 * Category order and labels follow the Smart Menu mockup's sidebar.
 */
import { signatureDishes, type SignatureDish } from './signature-dishes'

export type MenuCategorySeed = {
  slug: string
  nameDe: string
  nameEn: string
  nameVi: string
  /** Lucide icon name. */
  icon: string
  sortOrder: number
}

export const menuCategories: MenuCategorySeed[] = [
  { slug: 'empfehlung', nameDe: 'Empfehlung', nameEn: 'Recommendations', nameVi: 'Món đề xuất', icon: 'Star', sortOrder: 0 },
  { slug: 'pho-suppen', nameDe: 'Pho & Suppen', nameEn: 'Pho & Soup', nameVi: 'Phở & Súp', icon: 'Soup', sortOrder: 1 },
  { slug: 'reisgerichte', nameDe: 'Reisgerichte', nameEn: 'Rice Dishes', nameVi: 'Món cơm', icon: 'Wheat', sortOrder: 2 },
  { slug: 'nudelgerichte', nameDe: 'Nudelgerichte', nameEn: 'Noodles', nameVi: 'Món bún & mì', icon: 'Utensils', sortOrder: 3 },
  { slug: 'grill-bbq', nameDe: 'Grill & BBQ', nameEn: 'Grill & BBQ', nameVi: 'Nướng & BBQ', icon: 'Flame', sortOrder: 4 },
  { slug: 'sushi-sashimi', nameDe: 'Sushi & Sashimi', nameEn: 'Sushi & Sashimi', nameVi: 'Sushi & Sashimi', icon: 'Fish', sortOrder: 5 },
  { slug: 'vegetarisch', nameDe: 'Vegetarisch', nameEn: 'Vegetarian', nameVi: 'Món chay', icon: 'Leaf', sortOrder: 6 },
  { slug: 'vorspeisen', nameDe: 'Beilagen', nameEn: 'Side Dishes', nameVi: 'Món khai vị', icon: 'Salad', sortOrder: 7 },
  { slug: 'desserts', nameDe: 'Desserts', nameEn: 'Desserts', nameVi: 'Tráng miệng', icon: 'IceCreamCone', sortOrder: 8 },
  { slug: 'getraenke', nameDe: 'Getränke', nameEn: 'Drinks', nameVi: 'Đồ uống', icon: 'CupSoda', sortOrder: 9 },
]

/** EU-standard allergen codes used on German menus. */
export const allergens = [
  { code: 'A', nameDe: 'Glutenhaltiges Getreide', nameEn: 'Cereals containing gluten', nameVi: 'Ngũ cốc chứa gluten' },
  { code: 'B', nameDe: 'Krebstiere', nameEn: 'Crustaceans', nameVi: 'Giáp xác' },
  { code: 'C', nameDe: 'Eier', nameEn: 'Eggs', nameVi: 'Trứng' },
  { code: 'D', nameDe: 'Fisch', nameEn: 'Fish', nameVi: 'Cá' },
  { code: 'E', nameDe: 'Erdnüsse', nameEn: 'Peanuts', nameVi: 'Đậu phộng' },
  { code: 'F', nameDe: 'Soja', nameEn: 'Soybeans', nameVi: 'Đậu nành' },
  { code: 'G', nameDe: 'Milch & Laktose', nameEn: 'Milk & lactose', nameVi: 'Sữa & lactose' },
  { code: 'H', nameDe: 'Schalenfrüchte', nameEn: 'Tree nuts', nameVi: 'Các loại hạt' },
  { code: 'L', nameDe: 'Sellerie', nameEn: 'Celery', nameVi: 'Cần tây' },
  { code: 'M', nameDe: 'Senf', nameEn: 'Mustard', nameVi: 'Mù tạt' },
  { code: 'N', nameDe: 'Sesam', nameEn: 'Sesame', nameVi: 'Vừng' },
  { code: 'R', nameDe: 'Weichtiere', nameEn: 'Molluscs', nameVi: 'Nhuyễn thể' },
] as const

export type MenuItemSeed = SignatureDish & {
  allergenCodes: string[]
  ingredients: { nameVi: string; nameDe: string; nameEn: string; asset?: string }[]
  isSignature: boolean
  /** Manager-controlled "sold out" switch. */
  isAvailable: boolean
  sortOrder: number
}

/**
 * Floating ingredient sprites for the Smart Menu 3D layer. Paths point at the
 * alpha-keyed PNGs produced by `scripts/extract-assets.mjs`.
 */
const PHO_INGREDIENTS: MenuItemSeed['ingredients'] = [
  { nameVi: 'Thịt bò', nameDe: 'Rindfleisch', nameEn: 'Beef', asset: '/images/menu/ingredients/beef-slice-1.png' },
  { nameVi: 'Thịt bò thái', nameDe: 'Rindfleischscheiben', nameEn: 'Sliced beef', asset: '/images/menu/ingredients/beef-slice-2.png' },
  { nameVi: 'Bánh phở', nameDe: 'Reisnudeln', nameEn: 'Rice noodles' },
  { nameVi: 'Hành lá', nameDe: 'Frühlingszwiebeln', nameEn: 'Spring onion', asset: '/images/menu/ingredients/spring-onion.png' },
  { nameVi: 'Hành tây', nameDe: 'Zwiebeln', nameEn: 'Onion', asset: '/images/menu/ingredients/onion-ring-1.png' },
  { nameVi: 'Hành tím', nameDe: 'Rote Zwiebeln', nameEn: 'Red onion', asset: '/images/menu/ingredients/onion-ring-2.png' },
  { nameVi: 'Chanh', nameDe: 'Limette', nameEn: 'Lime', asset: '/images/menu/ingredients/lime.png' },
  { nameVi: 'Rau mùi', nameDe: 'Koriander', nameEn: 'Coriander', asset: '/images/menu/ingredients/coriander.png' },
  { nameVi: 'Hoa hồi', nameDe: 'Sternanis', nameEn: 'Star anise', asset: '/images/menu/ingredients/star-anise-1.png' },
  { nameVi: 'Quế', nameDe: 'Zimt', nameEn: 'Cinnamon', asset: '/images/menu/ingredients/cinnamon.png' },
  { nameVi: 'Ớt', nameDe: 'Chili', nameEn: 'Chili', asset: '/images/menu/ingredients/chili-red-1.png' },
  { nameVi: 'Húng quế', nameDe: 'Basilikum', nameEn: 'Thai basil', asset: '/images/menu/ingredients/chili-red-2.png' },
]

const GENERIC_INGREDIENTS: MenuItemSeed['ingredients'] = [
  { nameVi: 'Rau thơm tươi', nameDe: 'Frische Kräuter', nameEn: 'Fresh herbs', asset: '/images/menu/ingredients/coriander.png' },
  { nameVi: 'Hành lá', nameDe: 'Frühlingszwiebeln', nameEn: 'Spring onion', asset: '/images/menu/ingredients/spring-onion.png' },
  { nameVi: 'Chanh', nameDe: 'Limette', nameEn: 'Lime', asset: '/images/menu/ingredients/lime.png' },
  { nameVi: 'Ớt', nameDe: 'Chili', nameEn: 'Chili', asset: '/images/menu/ingredients/chili-red-1.png' },
]

const ALLERGENS_BY_SLUG: Record<string, string[]> = {
  'pho-bo-dac-biet': ['A', 'F', 'L'],
  'bun-bo-hue': ['A', 'B', 'F'],
  'goi-cuon-tom': ['B', 'D', 'F', 'N'],
  'com-tam-suon': ['C', 'F', 'M'],
  'sushi-set-premium': ['A', 'B', 'D', 'F', 'N', 'R'],
  'banh-xeo': ['A', 'B', 'C', 'F'],
  'bun-cha-ha-noi': ['A', 'D', 'F'],
  'ca-phe-viet': ['G'],
}

/** The eight signature dishes, enriched for the full menu. */
const signatureMenuItems: MenuItemSeed[] = signatureDishes.map((dish, i) => ({
  ...dish,
  allergenCodes: ALLERGENS_BY_SLUG[dish.slug] ?? [],
  ingredients: dish.slug === 'pho-bo-dac-biet' ? PHO_INGREDIENTS : GENERIC_INGREDIENTS,
  isSignature: true,
  isAvailable: true,
  sortOrder: i,
}))

/** Additional catalogue entries so every category has content. */
const extraMenuItems: MenuItemSeed[] = [
  {
    slug: 'pho-ga',
    nameVi: 'Phở Gà',
    nameDe: 'Pho Ga — Hühnernudelsuppe',
    nameEn: 'Chicken Pho',
    descriptionVi: 'Phở gà thanh nhẹ với ức gà và rau thơm.',
    descriptionDe: 'Klare Hühnerbrühe mit zartem Hähnchen, Reisnudeln und Kräutern.',
    descriptionEn: 'Clear chicken broth with tender chicken, rice noodles and herbs.',
    priceCents: 1390,
    thumbnail: '/images/dishes/pho-bo-dac-biet.jpg',
    poster: '/images/dishes/pho-bo-dac-biet.jpg',
    video: null,
    category: 'pho-suppen',
    isBestseller: false,
    isVegetarian: false,
    spicyLevel: 'NONE',
    calories: 410,
    preparationMinutes: 16,
    rating: 4.6,
    ratingCount: 61,
    allergenCodes: ['A', 'F', 'L'],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 10,
  },
  {
    slug: 'pho-chay',
    nameVi: 'Phở Chay',
    nameDe: 'Pho Chay — Vegetarische Nudelsuppe',
    nameEn: 'Vegetarian Pho',
    descriptionVi: 'Phở chay với nấm, đậu hũ và rau củ theo mùa.',
    descriptionDe: 'Vegetarische Nudelsuppe mit Pilzen, Tofu und Saisongemüse.',
    descriptionEn: 'Vegetarian noodle soup with mushrooms, tofu and seasonal vegetables.',
    priceCents: 1290,
    thumbnail: '/images/dishes/pho-bo-dac-biet.jpg',
    poster: '/images/dishes/pho-bo-dac-biet.jpg',
    video: null,
    category: 'vegetarisch',
    isBestseller: false,
    isVegetarian: true,
    spicyLevel: 'NONE',
    calories: 340,
    preparationMinutes: 15,
    rating: 4.7,
    ratingCount: 44,
    allergenCodes: ['A', 'F'],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 11,
  },
  {
    slug: 'goi-cuon-chay',
    nameVi: 'Gỏi Cuốn Chay',
    nameDe: 'Vegetarische Sommerrollen',
    nameEn: 'Vegetarian Summer Rolls',
    descriptionVi: 'Gỏi cuốn chay với đậu hũ, bún và rau tươi.',
    descriptionDe: 'Sommerrollen mit Tofu, Reisnudeln und frischem Gemüse.',
    descriptionEn: 'Summer rolls with tofu, rice noodles and fresh vegetables.',
    priceCents: 690,
    thumbnail: '/images/dishes/goi-cuon-tom.jpg',
    poster: '/images/dishes/goi-cuon-tom.jpg',
    video: null,
    category: 'vegetarisch',
    isBestseller: false,
    isVegetarian: true,
    spicyLevel: 'NONE',
    calories: 190,
    preparationMinutes: 10,
    rating: 4.8,
    ratingCount: 39,
    allergenCodes: ['F', 'N'],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 12,
  },
  {
    slug: 'sashimi-lachs',
    nameVi: 'Sashimi Cá Hồi',
    nameDe: 'Lachs Sashimi',
    nameEn: 'Salmon Sashimi',
    descriptionVi: 'Cá hồi tươi thái lát, phục vụ cùng wasabi và gừng ngâm.',
    descriptionDe: 'Frischer Lachs in Scheiben, serviert mit Wasabi und Ingwer.',
    descriptionEn: 'Freshly sliced salmon served with wasabi and pickled ginger.',
    priceCents: 1690,
    thumbnail: '/images/dishes/sushi-set-premium.jpg',
    poster: '/images/dishes/sushi-set-premium.jpg',
    video: null,
    category: 'sushi-sashimi',
    isBestseller: false,
    isVegetarian: false,
    spicyLevel: 'NONE',
    calories: 280,
    preparationMinutes: 12,
    rating: 4.8,
    ratingCount: 77,
    allergenCodes: ['D', 'F', 'N'],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 13,
  },
  {
    slug: 'che-ba-mau',
    nameVi: 'Chè Ba Màu',
    nameDe: 'Drei-Farben-Dessert',
    nameEn: 'Three-Colour Dessert',
    descriptionVi: 'Chè ba màu với đậu, thạch và nước cốt dừa.',
    descriptionDe: 'Süßspeise mit Bohnen, Gelee und Kokosmilch.',
    descriptionEn: 'Sweet dessert with beans, jelly and coconut milk.',
    priceCents: 590,
    thumbnail: '/images/promotions/happy-birthday.jpg',
    poster: '/images/promotions/happy-birthday.jpg',
    video: null,
    category: 'desserts',
    isBestseller: false,
    isVegetarian: true,
    spicyLevel: 'NONE',
    calories: 260,
    preparationMinutes: 8,
    rating: 4.5,
    ratingCount: 33,
    allergenCodes: ['H'],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 14,
  },
  {
    slug: 'tra-sen',
    nameVi: 'Trà Sen',
    nameDe: 'Lotustee',
    nameEn: 'Lotus Tea',
    descriptionVi: 'Trà sen thơm nhẹ, phục vụ nóng.',
    descriptionDe: 'Aromatischer Lotustee, heiß serviert.',
    descriptionEn: 'Fragrant lotus tea, served hot.',
    priceCents: 390,
    thumbnail: '/images/dishes/ca-phe-viet.jpg',
    poster: '/images/dishes/ca-phe-viet.jpg',
    video: null,
    category: 'getraenke',
    isBestseller: false,
    isVegetarian: true,
    spicyLevel: 'NONE',
    calories: 5,
    preparationMinutes: 5,
    rating: 4.6,
    ratingCount: 28,
    allergenCodes: [],
    ingredients: GENERIC_INGREDIENTS,
    isSignature: false,
    isAvailable: true,
    sortOrder: 15,
  },
]

export const menuItems: MenuItemSeed[] = [...signatureMenuItems, ...extraMenuItems]
