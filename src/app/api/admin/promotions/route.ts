import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { blobUrl, slugify, uniqueSlug } from '@/lib/admin-content'

export const dynamic = 'force-dynamic'

/**
 * A promotion is either a percentage off or a fixed combo price, never both —
 * the schema says so and the public card can only render one. Enforced here
 * rather than left to the UI, because "the form only offers one" stops being
 * true the moment anyone posts directly.
 */
const shape = {
  titleDe: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().min(1).max(160),
  titleVi: z.string().trim().min(1).max(160),
  subtitleDe: z.string().trim().max(300).default(''),
  subtitleEn: z.string().trim().max(300).default(''),
  subtitleVi: z.string().trim().max(300).default(''),
  descriptionDe: z.string().trim().max(2000).default(''),
  descriptionEn: z.string().trim().max(2000).default(''),
  descriptionVi: z.string().trim().max(2000).default(''),
  discountPercent: z.number().int().min(1).max(100).nullable().default(null),
  comboPriceCents: z.number().int().min(0).max(1_000_00).nullable().default(null),
  image: blobUrl.nullable().default(null),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
}

const createSchema = z.object(shape)
const editSchema = z.object({ id: z.string().min(1), ...shape })
const toggleSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
})
const deleteSchema = z.object({ id: z.string().min(1) })

const invalid = (message = 'Validation failed.') =>
  NextResponse.json({ error: message }, { status: 422 })

/** Both offer types set at once is a contradiction, not a richer promotion. */
function offerConflict(d: { discountPercent: number | null; comboPriceCents: number | null }) {
  return d.discountPercent !== null && d.comboPriceCents !== null
}

/**
 * Create, edit, toggle and retire promotions — the "Events" board.
 *
 * Deletion is soft. A promotion is referenced by every order placed under it,
 * so removing the row would either fail on the foreign key or quietly detach
 * historical orders from the offer that priced them.
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
    if (offerConflict(d)) return invalid('Pick a discount or a combo price, not both.')
    if (new Date(d.endsAt) <= new Date(d.startsAt)) return invalid('End must follow start.')

    const base = slugify(d.titleEn)
    const taken = await prisma.promotion.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    })
    const slug = uniqueSlug(
      d.titleEn,
      taken.map((p) => p.slug),
    )

    const created = await prisma.$transaction(async (tx) => {
      const promo = await tx.promotion.create({
        data: {
          slug,
          titleDe: d.titleDe,
          titleEn: d.titleEn,
          titleVi: d.titleVi,
          subtitleDe: d.subtitleDe,
          subtitleEn: d.subtitleEn,
          subtitleVi: d.subtitleVi,
          descriptionDe: d.descriptionDe,
          descriptionEn: d.descriptionEn,
          descriptionVi: d.descriptionVi,
          discountPercent: d.discountPercent,
          comboPriceCents: d.comboPriceCents,
          image: d.image,
          startsAt: new Date(d.startsAt),
          endsAt: new Date(d.endsAt),
          isActive: d.isActive,
        },
      })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'promotion.create',
          entity: 'Promotion',
          entityId: promo.id,
          after: { slug, titleDe: d.titleDe, startsAt: d.startsAt, endsAt: d.endsAt },
        },
      })
      return promo
    })

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 })
  }

  // ---- delete ----
  if (body.action === 'delete') {
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) return invalid()

    const current = await prisma.promotion.findUnique({ where: { id: parsed.data.id } })
    if (!current || current.deletedAt) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id: current.id },
        data: { deletedAt: new Date(), isActive: false },
      })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'promotion.delete',
          entity: 'Promotion',
          entityId: current.id,
          before: { slug: current.slug, titleDe: current.titleDe },
        },
      })
    })

    return NextResponse.json({ ok: true })
  }

  // ---- edit (full form) ----
  if (body.action === 'edit') {
    const parsed = editSchema.safeParse(body)
    if (!parsed.success) return invalid()
    const { id, ...d } = parsed.data
    if (offerConflict(d)) return invalid('Pick a discount or a combo price, not both.')
    if (new Date(d.endsAt) <= new Date(d.startsAt)) return invalid('End must follow start.')

    const current = await prisma.promotion.findUnique({ where: { id } })
    if (!current || current.deletedAt) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: {
          ...d,
          startsAt: new Date(d.startsAt),
          endsAt: new Date(d.endsAt),
        },
      })
      await tx.auditLog.create({
        data: {
          ...actor,
          action: 'promotion.update',
          entity: 'Promotion',
          entityId: id,
          before: {
            titleDe: current.titleDe,
            discountPercent: current.discountPercent,
            comboPriceCents: current.comboPriceCents,
            startsAt: current.startsAt.toISOString(),
            endsAt: current.endsAt.toISOString(),
          },
          after: { titleDe: d.titleDe, startsAt: d.startsAt, endsAt: d.endsAt },
        },
      })
    })

    return NextResponse.json({ ok: true })
  }

  // ---- toggle (default: the inline controls on the card) ----
  const parsed = toggleSchema.safeParse(body)
  if (!parsed.success) return invalid()
  const { id, ...changes } = parsed.data
  if (Object.keys(changes).length === 0) return invalid('Nothing to change.')

  const current = await prisma.promotion.findUnique({ where: { id } })
  if (!current || current.deletedAt) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.promotion.update({ where: { id }, data: changes })
    await tx.auditLog.create({
      data: {
        ...actor,
        action: 'promotion.update',
        entity: 'Promotion',
        entityId: id,
        before: { isActive: current.isActive, sortOrder: current.sortOrder },
        after: changes,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
