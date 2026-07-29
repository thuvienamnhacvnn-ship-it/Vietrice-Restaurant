/**
 * Database seed.
 *
 * Reads the same content modules the public site falls back to
 * (`src/content/*`), so seeded data and offline data can never drift.
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * running it repeatedly is safe and will not duplicate rows.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { allergens, menuCategories, menuItems } from '../src/content/menu'
import { galleryItems } from '../src/content/gallery'
import { promotions } from '../src/content/promotions'
import { openingHours, reviewSummary, venueStats } from '../src/content/restaurant'
import { restaurantTables } from '../src/content/tables'

const prisma = new PrismaClient()

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  const name = process.env.SEED_ADMIN_NAME ?? 'Viet Rice Admin'

  if (!email || !password) {
    console.warn(
      '  ! Skipping admin: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create one.',
    )
    return
  }
  if (password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters.')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { name, role: 'SUPER_ADMIN', isActive: true },
    create: { email, name, passwordHash, role: 'SUPER_ADMIN' },
  })
  console.log(`  ✓ admin: ${email}`)
}

async function seedTables() {
  for (const table of restaurantTables) {
    await prisma.restaurantTable.upsert({
      where: { number: table.number },
      update: {
        capacity: table.capacity,
        minCapacity: table.minCapacity,
        gridRow: table.gridRow,
        gridCol: table.gridCol,
        shape: table.shape,
        zone: table.zone,
      },
      create: { ...table, status: 'AVAILABLE' },
    })
  }
  console.log(`  ✓ tables: ${restaurantTables.length}`)
}

async function seedMenu() {
  for (const cat of menuCategories) {
    await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: { ...cat },
      create: { ...cat },
    })
  }

  for (const a of allergens) {
    await prisma.allergen.upsert({
      where: { code: a.code },
      update: { nameDe: a.nameDe, nameEn: a.nameEn, nameVi: a.nameVi },
      create: { code: a.code, nameDe: a.nameDe, nameEn: a.nameEn, nameVi: a.nameVi },
    })
  }

  for (const item of menuItems) {
    // "empfehlung" is a virtual UI category backed by `isSignature`; store the
    // dish under its real category instead.
    const category = await prisma.menuCategory.findUnique({ where: { slug: item.category } })
    if (!category) {
      console.warn(`  ! skipping ${item.slug}: unknown category "${item.category}"`)
      continue
    }

    const data = {
      nameVi: item.nameVi,
      nameDe: item.nameDe,
      nameEn: item.nameEn,
      descriptionVi: item.descriptionVi,
      descriptionDe: item.descriptionDe,
      descriptionEn: item.descriptionEn,
      priceCents: item.priceCents,
      categoryId: category.id,
      image: item.thumbnail,
      poster: item.poster,
      video: item.video,
      spicyLevel: item.spicyLevel,
      calories: item.calories,
      preparationMinutes: item.preparationMinutes,
      rating: item.rating,
      ratingCount: item.ratingCount,
      isVegetarian: item.isVegetarian,
      isBestseller: item.isBestseller,
      isAvailable: item.isAvailable,
      isSignature: item.isSignature,
      sortOrder: item.sortOrder,
    }

    const saved = await prisma.menuItem.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    })

    // Replace child rows so repeated seeds stay consistent.
    await prisma.menuItemIngredient.deleteMany({ where: { menuItemId: saved.id } })
    await prisma.menuItemIngredient.createMany({
      data: item.ingredients.map((ing, i) => ({
        menuItemId: saved.id,
        nameVi: ing.nameVi,
        nameDe: ing.nameDe,
        nameEn: ing.nameEn,
        asset: ing.asset ?? null,
        sortOrder: i,
      })),
    })

    await prisma.menuItemAllergen.deleteMany({ where: { menuItemId: saved.id } })
    for (const code of item.allergenCodes) {
      const allergen = await prisma.allergen.findUnique({ where: { code } })
      if (!allergen) continue
      await prisma.menuItemAllergen.create({
        data: { menuItemId: saved.id, allergenId: allergen.id },
      })
    }
  }

  console.log(`  ✓ menu: ${menuCategories.length} categories, ${menuItems.length} dishes`)
}

async function seedPromotions() {
  const now = new Date()
  const startsAt = new Date(now)
  startsAt.setDate(startsAt.getDate() - 7)

  for (const p of promotions) {
    const endsAt = new Date(now)
    endsAt.setDate(endsAt.getDate() + p.endsInDays)

    const data = {
      titleDe: p.titleDe,
      titleEn: p.titleEn,
      titleVi: p.titleVi,
      subtitleDe: p.subtitleDe,
      subtitleEn: p.subtitleEn,
      subtitleVi: p.subtitleVi,
      descriptionDe: p.descriptionDe,
      descriptionEn: p.descriptionEn,
      descriptionVi: p.descriptionVi,
      conditionsDe: p.conditionsDe,
      conditionsEn: p.conditionsEn,
      conditionsVi: p.conditionsVi,
      discountPercent: p.discountPercent,
      comboPriceCents: p.comboPriceCents,
      image: p.image,
      ctaType: p.ctaType,
      startsAt,
      endsAt,
      weekdays: p.weekdays,
      startTime: p.startTime,
      endTime: p.endTime,
      isActive: true,
      sortOrder: p.sortOrder,
    }

    await prisma.promotion.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    })
  }
  console.log(`  ✓ promotions: ${promotions.length}`)
}

async function seedGallery() {
  for (const item of galleryItems) {
    const existing = await prisma.galleryItem.findFirst({ where: { url: item.url } })
    const data = {
      category: item.category,
      type: 'IMAGE' as const,
      url: item.url,
      titleDe: item.titleDe,
      titleEn: item.titleEn,
      titleVi: item.titleVi,
      captionDe: item.captionDe,
      captionEn: item.captionEn,
      captionVi: item.captionVi,
      altText: item.altText,
      width: item.width,
      height: item.height,
      isVisible: true,
      isFeatured: item.isFeatured,
      sortOrder: item.sortOrder,
    }
    if (existing) {
      await prisma.galleryItem.update({ where: { id: existing.id }, data })
    } else {
      await prisma.galleryItem.create({ data })
    }
  }
  console.log(`  ✓ gallery: ${galleryItems.length}`)
}

async function seedSettings() {
  for (const h of openingHours) {
    await prisma.openingHour.upsert({
      where: { weekday: h.weekday },
      update: { isClosed: h.isClosed, opensAt: h.opensAt, closesAt: h.closesAt },
      create: { weekday: h.weekday, isClosed: h.isClosed, opensAt: h.opensAt, closesAt: h.closesAt },
    })
  }

  const settings: { key: string; value: Prisma.InputJsonValue; group: string }[] = [
    { key: 'venue.stats', value: venueStats, group: 'content' },
    { key: 'reviews.summary', value: reviewSummary, group: 'content' },
    { key: 'hero.image', value: '/images/hero/hero-pho-bo.jpg', group: 'content' },
    { key: 'hero.video', value: '', group: 'content' },
  ]

  for (const s of settings) {
    await prisma.restaurantSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    })
  }
  console.log(`  ✓ settings + opening hours`)
}

async function main() {
  console.log('Seeding Viet Rice…')
  await seedAdmin()
  await seedTables()
  await seedMenu()
  await seedPromotions()
  await seedGallery()
  await seedSettings()
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('Seed failed:\n', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
