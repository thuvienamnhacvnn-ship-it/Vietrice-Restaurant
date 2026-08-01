import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { blobUrl, slugify, uniqueSlug } from '@/lib/admin-content'

export const dynamic = 'force-dynamic'

/**
 * `action` defaults to `update`, which is the shape the board's inline toggles
 * have always posted. Requiring it would have broken every existing control on
 * the screen for no gain.
 */
const updateSchema = z.object({
  itemId: z.string().min(1),
  nameDe: z.string().trim().min(1).max(160).optional(),
  nameEn: z.string().trim().min(1).max(160).optional(),
  nameVi: z.string().trim().min(1).max(160).optional(),
  descriptionDe: z.string().trim().max(1000).optional(),
  descriptionEn: z.string().trim().max(1000).optional(),
  descriptionVi: z.string().trim().max(1000).optional(),
  categoryId: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
  isSignature: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  /** Euro cents. Capped so a slipped decimal cannot list a dish at €10,000. */
  priceCents: z.number().int().min(0).max(1_000_00).optional(),
  /**
   * Media URLs, written after a Vercel Blob upload. Restricted to the Blob host
   * or a site-relative path: an arbitrary URL here would let anyone with a
   * session point the restaurant's banner at a third-party server.
   */
  video: blobUrl.nullable().optional(),
  poster: blobUrl.optional(),
  image: blobUrl.nullable().optional(),
})

const createSchema = z.object({
  nameDe: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160),
  nameVi: z.string().trim().min(1).max(160),
  descriptionDe: z.string().trim().max(1000).default(''),
  descriptionEn: z.string().trim().max(1000).default(''),
  descriptionVi: z.string().trim().max(1000).default(''),
  categoryId: z.string().min(1),
  priceCents: z.number().int().min(0).max(1_000_00),
  image: blobUrl.nullable().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
})

const deleteSchema = z.object({ itemId: z.string().min(1) })

const invalid = () => NextResponse.json({ error: 'Validation failed.' }, { status: 422 })

/**
 * Create, edit and retire dishes.
 *
 * Only the fields the console exposes can be written — a whitelist, not a
 * spread of the request body, so a crafted payload cannot reach columns the UI
 * never offers.
 *
 * Deletion is a soft delete. A dish that has been ordered is referenced by
 * every order line that contains it, and by the kitchen's history; removing the
 * row would either fail on the foreign key or rewrite what happened last
 * Tuesday. `deletedAt` takes it off the menu, which is what "delete" means to
 * the person clicking it.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { action?: string } | null
  if (!body) return invalid()

  const actor = { actorId: session.userId, actorName: session.name }

  // ---- create ----
  if (body.action === 'create') {
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return invalid()
    const data = parsed.data

    const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } })
    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })

    const taken = await prisma.menuItem.findMany({
      where: { slug: { startsWith: slugify(data.nameEn) } },
      select: { slug: true },
    })
    const slug = uniqueSlug(
      data.nameEn,
      taken.map((t) => t.slug),
    )

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.menuItem.create({
        data: {
          slug,
          nameDe: data.nameDe,
          nameEn: data.nameEn,
          nameVi: data.nameVi,
          descriptionDe: data.descriptionDe,
          descriptionEn: data.descriptionEn,
          descriptionVi: data.descriptionVi,
          categoryId: data.categoryId,
          priceCents: data.priceCents,
          image: data.image ?? null,
          isVegetarian: data.isVegetarian,
          isVegan: data.isVegan,
        },
      })

      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'menu.create',
          entity: 'MenuItem',
          entityId: item.id,
          after: { slug, nameDe: data.nameDe, priceCents: data.priceCents },
        },
      })

      return item
    })

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug }, { status: 201 })
  }

  // ---- delete ----
  if (body.action === 'delete') {
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) return invalid()

    const current = await prisma.menuItem.findUnique({ where: { id: parsed.data.itemId } })
    if (!current || current.deletedAt) {
      return NextResponse.json({ error: 'Dish not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id: current.id },
        // Taken off the menu as well as hidden: a dish left "available" but
        // deleted reads as a bug the day someone restores it.
        data: { deletedAt: new Date(), isAvailable: false },
      })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'menu.delete',
          entity: 'MenuItem',
          entityId: current.id,
          before: { slug: current.slug, nameDe: current.nameDe },
        },
      })
    })

    return NextResponse.json({ ok: true })
  }

  // ---- update (default) ----
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return invalid()

  const { itemId, ...changes } = parsed.data
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 422 })
  }

  const current = await prisma.menuItem.findUnique({ where: { id: itemId } })
  if (!current || current.deletedAt) {
    return NextResponse.json({ error: 'Dish not found.' }, { status: 404 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.update({ where: { id: itemId }, data: changes })

    await tx.auditLog.create({
      data: {
        ...actor,
        action: 'menu.update',
        entity: 'MenuItem',
        entityId: itemId,
        before: {
          isAvailable: current.isAvailable,
          isSignature: current.isSignature,
          isBestseller: current.isBestseller,
          priceCents: current.priceCents,
          video: current.video,
          poster: current.poster,
          image: current.image,
        },
        after: changes,
      },
    })

    return item
  })

  return NextResponse.json({
    ok: true,
    isAvailable: updated.isAvailable,
    isSignature: updated.isSignature,
    isBestseller: updated.isBestseller,
    priceCents: updated.priceCents,
    video: updated.video,
    poster: updated.poster,
    image: updated.image,
  })
}
