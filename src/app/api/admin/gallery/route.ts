import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { blobUrl } from '@/lib/admin-content'

export const dynamic = 'force-dynamic'

const CATEGORIES = [
  'RESTAURANT',
  'SUSHI_BAR',
  'PRIVATE_ROOM',
  'OUTDOOR_AREA',
  'ATMOSPHERE',
  'FOOD_PRESENTATION',
] as const

const createSchema = z.object({
  url: blobUrl,
  category: z.enum(CATEGORIES).default('RESTAURANT'),
  titleDe: z.string().trim().max(160).default(''),
  titleEn: z.string().trim().max(160).default(''),
  titleVi: z.string().trim().max(160).default(''),
  altText: z.string().trim().max(300).default(''),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
})

const editSchema = z.object({
  id: z.string().min(1),
  url: blobUrl.optional(),
  category: z.enum(CATEGORIES).optional(),
  titleDe: z.string().trim().max(160).optional(),
  titleEn: z.string().trim().max(160).optional(),
  titleVi: z.string().trim().max(160).optional(),
  altText: z.string().trim().max(300).optional(),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

const deleteSchema = z.object({ id: z.string().min(1) })

const invalid = () => NextResponse.json({ error: 'Validation failed.' }, { status: 422 })

/**
 * Upload, edit and remove gallery media.
 *
 * `altText` is a field rather than an afterthought: every one of these images
 * ends up on a public page, and an image with no alternative text is invisible
 * to a screen reader and to search. It is allowed to be empty — a purely
 * decorative shot should have empty alt, not invented prose — but it has to be
 * a decision someone made.
 *
 * Deletion is soft here too. The blob itself is deliberately left in place: the
 * same URL may be referenced by a promotion or a cached page, and orphaning
 * those to reclaim a few kilobytes is a poor trade.
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
    const d = parsed.data

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.galleryItem.create({ data: d })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'gallery.create',
          entity: 'GalleryItem',
          entityId: item.id,
          after: { url: d.url, category: d.category },
        },
      })
      return item
    })

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  }

  // ---- delete ----
  if (body.action === 'delete') {
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) return invalid()

    const current = await prisma.galleryItem.findUnique({ where: { id: parsed.data.id } })
    if (!current || current.deletedAt) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.galleryItem.update({
        where: { id: current.id },
        data: { deletedAt: new Date(), isVisible: false, isFeatured: false },
      })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'gallery.delete',
          entity: 'GalleryItem',
          entityId: current.id,
          before: { url: current.url, category: current.category },
        },
      })
    })

    return NextResponse.json({ ok: true })
  }

  // ---- edit (also serves the inline show/feature toggles) ----
  const parsed = editSchema.safeParse(body)
  if (!parsed.success) return invalid()
  const { id, ...changes } = parsed.data
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 422 })
  }

  const current = await prisma.galleryItem.findUnique({ where: { id } })
  if (!current || current.deletedAt) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.galleryItem.update({ where: { id }, data: changes })
    await tx.auditLog.create({
      data: {
        ...actor,
        action: 'gallery.update',
        entity: 'GalleryItem',
        entityId: id,
        before: {
          isVisible: current.isVisible,
          isFeatured: current.isFeatured,
          category: current.category,
          sortOrder: current.sortOrder,
        },
        after: changes,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
