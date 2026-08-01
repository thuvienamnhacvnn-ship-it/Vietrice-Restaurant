import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Edits for the smaller admin boards — tables, guests and opening hours.
 *
 * A discriminated union rather than a generic "update any row" endpoint: each
 * variant names exactly which columns it may touch, so no request can reach a
 * field the console does not offer. Every write is audited with the acting
 * user, the same as reservations and orders.
 *
 * Promotions and gallery media used to live here as toggle-only variants. They
 * moved to `/api/admin/promotions` and `/api/admin/gallery` when those boards
 * grew create and delete: one entity, one endpoint, rather than a write split
 * across two files by how many fields it happens to touch.
 */
const schema = z.discriminatedUnion('entity', [
  z.object({
    entity: z.literal('table'),
    id: z.string().min(1),
    isActive: z.boolean().optional(),
    zone: z.string().trim().max(60).nullable().optional(),
    notes: z.string().trim().max(300).nullable().optional(),
    capacity: z.number().int().min(1).max(20).optional(),
  }),
  z.object({
    entity: z.literal('customer'),
    id: z.string().min(1),
    notes: z.string().trim().max(500).nullable().optional(),
    marketingOptIn: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal('openingHour'),
    weekday: z.number().int().min(0).max(6),
    isClosed: z.boolean().optional(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  }),
])

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const input = parsed.data

  const audit = (
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    entity: string,
    entityId: string,
    before: unknown,
    after: unknown,
  ) =>
    tx.auditLog.create({
      data: {
        actorId: session.userId,
        actorName: session.name,
        action: `${entity.toLowerCase()}.update`,
        entity,
        entityId,
        before: before as never,
        after: after as never,
      },
    })

  try {
    if (input.entity === 'table') {
      const { entity: _e, id, ...changes } = input
      const before = await prisma.restaurantTable.findUnique({ where: { id } })
      if (!before) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
      await prisma.$transaction(async (tx) => {
        await tx.restaurantTable.update({ where: { id }, data: changes })
        await audit(
          tx,
          'RestaurantTable',
          id,
          { isActive: before.isActive, zone: before.zone, capacity: before.capacity },
          changes,
        )
      })
    } else if (input.entity === 'customer') {
      const { entity: _e, id, ...changes } = input
      const before = await prisma.customer.findUnique({ where: { id } })
      if (!before) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
      await prisma.$transaction(async (tx) => {
        await tx.customer.update({ where: { id }, data: changes })
        // Guest notes can hold health information (allergies), so the audit
        // records that a note changed, not what it said.
        await audit(
          tx,
          'Customer',
          id,
          { marketingOptIn: before.marketingOptIn, hasNotes: Boolean(before.notes) },
          {
            ...(changes.marketingOptIn === undefined
              ? {}
              : { marketingOptIn: changes.marketingOptIn }),
            ...(changes.notes === undefined ? {} : { hasNotes: Boolean(changes.notes) }),
          },
        )
      })
    } else {
      const { entity: _e, weekday, ...changes } = input
      const before = await prisma.openingHour.findUnique({ where: { weekday } })
      await prisma.$transaction(async (tx) => {
        await tx.openingHour.upsert({
          where: { weekday },
          update: changes,
          create: { weekday, ...changes },
        })
        await audit(
          tx,
          'OpeningHour',
          String(weekday),
          before
            ? { isClosed: before.isClosed, opensAt: before.opensAt, closesAt: before.closesAt }
            : null,
          changes,
        )
      })
    }
  } catch (err) {
    console.error('[admin/content] update failed', err)
    return NextResponse.json({ error: 'Änderung konnte nicht gespeichert werden.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
