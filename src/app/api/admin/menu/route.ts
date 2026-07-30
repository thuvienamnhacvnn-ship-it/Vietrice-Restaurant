import { NextResponse } from 'next/server'
import { z } from 'zod'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const blobUrl = z
  .string()
  .max(500)
  .refine(
    (v) => v.startsWith('/') || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(v),
    'Must be a site-relative path or a Vercel Blob URL.',
  )

const schema = z.object({
  itemId: z.string().min(1),
  isAvailable: z.boolean().optional(),
  isSignature: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  /** Euro cents. Capped so a slipped decimal cannot list a dish at €10,000. */
  priceCents: z.number().int().min(0).max(1_000_00).optional(),
  /**
   * Media URLs, written after a Vercel Blob upload. Restricted to the Blob
   * host or a site-relative path: an arbitrary URL here would let anyone with
   * a session point the restaurant's banner at a third-party server.
   */
  video: blobUrl.nullable().optional(),
  poster: blobUrl.optional(),
  image: blobUrl.optional(),
})

/**
 * Edit a dish from the admin menu board.
 *
 * Only the fields the console actually exposes can be written — a whitelist,
 * not a spread of the request body, so a crafted payload cannot reach columns
 * like `slug` or `categoryId` that the UI never offers.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

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
        actorId: session.userId,
        actorName: session.name,
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
  })
}
