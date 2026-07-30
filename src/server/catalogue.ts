import { hasDatabase, prisma } from '@/lib/db'
import {
  menuCategories as seedCategories,
  menuItems as seedItems,
  type MenuCategorySeed,
  type MenuItemSeed,
} from '@/content/menu'
import { galleryItems as seedGallery, type GalleryItemSeed } from '@/content/gallery'
import { getActivePromotions, type PublicPromotion } from '@/lib/promotions'
import type { Locale } from '@/i18n/config'

/**
 * Public reads of the catalogue.
 *
 * These exist so the admin console is not decorative: when a manager marks a
 * dish sold out, deactivates a promotion or hides a photo, guests must see it.
 * The pages used to import the seed files directly, which meant every edit was
 * written to the database and then ignored by the site.
 *
 * The seed data stays as the fallback for when no database is configured (local
 * design work, first boot before `prisma db seed`), so the site still renders.
 */

function pick(locale: Locale, de: string, en: string, vi: string): string {
  if (locale === 'en') return en
  if (locale === 'vi') return vi
  return de
}

export async function getMenuData(): Promise<{
  categories: MenuCategorySeed[]
  items: MenuItemSeed[]
}> {
  if (!hasDatabase) return { categories: seedCategories, items: seedItems }

  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.menuItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: {
        category: { select: { slug: true } },
        ingredients: { orderBy: { sortOrder: 'asc' } },
        allergens: { include: { allergen: { select: { code: true } } } },
      },
    }),
  ])

  // An empty table means the database exists but was never seeded; falling back
  // beats rendering a restaurant with no food on the menu.
  if (items.length === 0 || categories.length === 0) {
    return { categories: seedCategories, items: seedItems }
  }

  return {
    categories: categories.map((c) => ({
      slug: c.slug,
      nameDe: c.nameDe,
      nameEn: c.nameEn,
      nameVi: c.nameVi,
      icon: c.icon,
      sortOrder: c.sortOrder,
    })),
    items: items.map((i) => ({
      slug: i.slug,
      nameVi: i.nameVi,
      nameDe: i.nameDe,
      nameEn: i.nameEn,
      descriptionVi: i.descriptionVi,
      descriptionDe: i.descriptionDe,
      descriptionEn: i.descriptionEn,
      priceCents: i.priceCents,
      thumbnail: i.image ?? '',
      poster: i.poster ?? i.image ?? '',
      video: i.video,
      category: i.category.slug,
      isBestseller: i.isBestseller,
      isVegetarian: i.isVegetarian,
      spicyLevel: i.spicyLevel,
      calories: i.calories,
      preparationMinutes: i.preparationMinutes,
      rating: i.rating,
      ratingCount: i.ratingCount,
      allergenCodes: i.allergens.map((a) => a.allergen.code),
      ingredients: i.ingredients.map((ing) => ({
        nameVi: ing.nameVi,
        nameDe: ing.nameDe,
        nameEn: ing.nameEn,
        asset: ing.asset ?? undefined,
      })),
      isSignature: i.isSignature,
      isAvailable: i.isAvailable,
      sortOrder: i.sortOrder,
    })),
  }
}

export async function getPublicPromotions(
  locale: Locale,
  now: Date,
): Promise<PublicPromotion[]> {
  if (!hasDatabase) return getActivePromotions(locale, now)

  const rows = await prisma.promotion.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      // The window is enforced in the query, not in the browser: an expired
      // campaign is never sent to the client, so no amount of clock tampering
      // can bring it back.
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { sortOrder: 'asc' },
  })

  if (rows.length === 0) return []

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: pick(locale, p.titleDe, p.titleEn, p.titleVi),
    subtitle: pick(locale, p.subtitleDe, p.subtitleEn, p.subtitleVi),
    description: pick(locale, p.descriptionDe, p.descriptionEn, p.descriptionVi),
    conditions: pick(locale, p.conditionsDe, p.conditionsEn, p.conditionsVi),
    discountPercent: p.discountPercent,
    comboPriceCents: p.comboPriceCents,
    image: p.image ?? '',
    ctaType: p.ctaType as PublicPromotion['ctaType'],
    startsAtIso: p.startsAt.toISOString(),
    endsAtIso: p.endsAt.toISOString(),
    weekdays: p.weekdays,
    startTime: p.startTime,
    endTime: p.endTime,
  }))
}

export async function getPublicGallery(): Promise<GalleryItemSeed[]> {
  if (!hasDatabase) return seedGallery

  const rows = await prisma.galleryItem.findMany({
    where: { deletedAt: null, isVisible: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  if (rows.length === 0) return seedGallery

  return rows.map((g) => ({
    // The seed keys items by slug; database rows use their id, which is just as
    // stable and unique for React keys and lightbox navigation.
    slug: g.id,
    url: g.url,
    category: g.category as GalleryItemSeed['category'],
    titleDe: g.titleDe,
    titleEn: g.titleEn,
    titleVi: g.titleVi,
    captionDe: g.captionDe,
    captionEn: g.captionEn,
    captionVi: g.captionVi,
    altText: g.altText,
    width: g.width ?? 1200,
    height: g.height ?? 800,
    isFeatured: g.isFeatured,
    sortOrder: g.sortOrder,
  }))
}
