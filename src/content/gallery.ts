/**
 * Gallery seed data. Images are the tiles cut out of the gallery mockup.
 * Admin can add, reorder, hide and caption entries; this is the initial set.
 */
export type GalleryCategoryKey =
  | 'RESTAURANT'
  | 'SUSHI_BAR'
  | 'PRIVATE_ROOM'
  | 'OUTDOOR_AREA'
  | 'ATMOSPHERE'
  | 'FOOD_PRESENTATION'

export type GalleryItemSeed = {
  slug: string
  category: GalleryCategoryKey
  url: string
  titleDe: string
  titleEn: string
  titleVi: string
  captionDe: string
  captionEn: string
  captionVi: string
  altText: string
  width: number
  height: number
  isFeatured: boolean
  sortOrder: number
}

export const galleryItems: GalleryItemSeed[] = [
  {
    slug: 'panorama',
    category: 'RESTAURANT',
    url: '/images/gallery/panorama.jpg',
    titleDe: 'Unser Restaurant',
    titleEn: 'Our Restaurant',
    titleVi: 'Nhà hàng của chúng tôi',
    captionDe: 'Ein Ort zum Genießen und Entspannen.',
    captionEn: 'A place to enjoy and relax.',
    captionVi: 'Nơi để thưởng thức và thư giãn.',
    altText: 'Panoramablick in den Gastraum von Viet Rice mit warmer Beleuchtung',
    width: 1060,
    height: 345,
    isFeatured: true,
    sortOrder: 0,
  },
  {
    slug: 'restaurant',
    category: 'RESTAURANT',
    url: '/images/gallery/restaurant.jpg',
    titleDe: 'Restaurant',
    titleEn: 'Restaurant',
    titleVi: 'Nhà hàng',
    captionDe: 'Gemütlich. Modern. Authentisch.',
    captionEn: 'Cosy. Modern. Authentic.',
    captionVi: 'Ấm cúng. Hiện đại. Đích thực.',
    altText: 'Gastraum mit gedeckten Tischen und Pflanzen',
    width: 310,
    height: 232,
    isFeatured: false,
    sortOrder: 1,
  },
  {
    slug: 'sushi-bar',
    category: 'SUSHI_BAR',
    url: '/images/gallery/sushi-bar.jpg',
    titleDe: 'Sushi Bar',
    titleEn: 'Sushi Bar',
    titleVi: 'Quầy Sushi',
    captionDe: 'Frisch zubereitet von unseren Sushi-Meistern.',
    captionEn: 'Freshly prepared by our sushi masters.',
    captionVi: 'Được chuẩn bị tươi bởi các đầu bếp sushi.',
    altText: 'Sushi-Bar mit Köchen bei der Zubereitung',
    width: 297,
    height: 232,
    isFeatured: false,
    sortOrder: 2,
  },
  {
    slug: 'private-room',
    category: 'PRIVATE_ROOM',
    url: '/images/gallery/private-room.jpg',
    titleDe: 'Private Room',
    titleEn: 'Private Room',
    titleVi: 'Phòng riêng',
    captionDe: 'Perfekt für besondere Anlässe.',
    captionEn: 'Perfect for special occasions.',
    captionVi: 'Hoàn hảo cho những dịp đặc biệt.',
    altText: 'Privater Speiseraum mit goldenem Wandmotiv',
    width: 292,
    height: 232,
    isFeatured: false,
    sortOrder: 3,
  },
  {
    slug: 'outdoor-area',
    category: 'OUTDOOR_AREA',
    url: '/images/gallery/outdoor-area.jpg',
    titleDe: 'Outdoor Area',
    titleEn: 'Outdoor Area',
    titleVi: 'Khu ngoài trời',
    captionDe: 'Entspannen im Freien genießen.',
    captionEn: 'Relax and enjoy the open air.',
    captionVi: 'Thư giãn tận hưởng không gian ngoài trời.',
    altText: 'Außenterrasse mit Sitzplätzen und Pflanzen',
    width: 290,
    height: 232,
    isFeatured: false,
    sortOrder: 4,
  },
  {
    slug: 'atmosphere',
    category: 'ATMOSPHERE',
    url: '/images/gallery/atmosphere.jpg',
    titleDe: 'Atmosphäre',
    titleEn: 'Atmosphere',
    titleVi: 'Không gian',
    captionDe: 'Genuss, der in Erinnerung bleibt.',
    captionEn: 'A taste worth remembering.',
    captionVi: 'Hương vị đáng nhớ.',
    altText: 'Gedeckter Tisch mit Cocktail und Speisen',
    width: 240,
    height: 232,
    isFeatured: false,
    sortOrder: 5,
  },
  {
    slug: 'food-presentation',
    category: 'FOOD_PRESENTATION',
    url: '/images/menu/pho-bo-bowl.jpg',
    titleDe: 'Food Presentation',
    titleEn: 'Food Presentation',
    titleVi: 'Trình bày món ăn',
    captionDe: 'Jedes Gericht mit Sorgfalt angerichtet.',
    captionEn: 'Every dish plated with care.',
    captionVi: 'Mỗi món ăn được trình bày tỉ mỉ.',
    altText: 'Schale Pho Bo mit frischen Kräutern',
    width: 620,
    height: 336,
    isFeatured: false,
    sortOrder: 6,
  },
]
