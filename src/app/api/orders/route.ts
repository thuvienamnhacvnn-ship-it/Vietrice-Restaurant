import { NextResponse } from 'next/server'
import { z } from 'zod'

import { hasDatabase, prisma } from '@/lib/db'
import { getLocale } from '@/i18n'
import { toPrismaLocale } from '@/i18n/config'
import { generateBookingCode } from '@/lib/reservation'

export const dynamic = 'force-dynamic'

const phoneRegex = /^[+]?[\d\s()/-]{6,24}$/

const schema = z.object({
  guestName: z.string().trim().min(2).max(120),
  guestPhone: z.string().trim().regex(phoneRegex),
  guestEmail: z.string().trim().email().optional().or(z.literal('')),
  /** `HH:mm` on the current service day. */
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  paymentMethod: z.enum(['PAY_AT_RESTAURANT', 'PAY_ON_PICKUP']),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
        notes: z.string().trim().max(200).optional().or(z.literal('')),
      }),
    )
    .min(1)
    .max(40),
})

/**
 * Create a pickup order.
 *
 * Prices are never taken from the request. The browser sends slugs and
 * quantities only; every unit price is re-read from the database here, so a
 * tampered cart cannot buy a €28 sushi set for €1. The same read also rejects
 * dishes that have been marked unavailable since the cart was filled.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const data = parsed.data
  const code = generateBookingCode().replace('VR-', 'ORD-')

  if (!hasDatabase) {
    return NextResponse.json(
      { code, status: 'NEW', persisted: false, message: 'Demo mode: no database configured.' },
      { status: 201 },
    )
  }

  const [hh, mm] = data.pickupTime.split(':').map(Number)
  const pickupAt = new Date()
  pickupAt.setHours(hh ?? 0, mm ?? 0, 0, 0)
  // A time earlier than now means the guest is picking up tomorrow.
  if (pickupAt.getTime() < Date.now()) pickupAt.setDate(pickupAt.getDate() + 1)

  const dishes = await prisma.menuItem.findMany({
    where: { slug: { in: data.items.map((i) => i.slug) }, deletedAt: null },
  })

  const priced = data.items.map((line) => {
    const dish = dishes.find((d) => d.slug === line.slug)
    return { line, dish }
  })

  const missing = priced.filter((p) => !p.dish || !p.dish.isAvailable)
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Einige Gerichte sind nicht mehr verfügbar.',
        unavailable: missing.map((m) => m.line.slug),
      },
      { status: 409 },
    )
  }

  const subtotal = priced.reduce((sum, p) => sum + p.dish!.priceCents * p.line.quantity, 0)
  const locale = await getLocale()

  try {
    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: data.guestPhone },
        update: {
          name: data.guestName,
          ...(data.guestEmail ? { email: data.guestEmail } : {}),
        },
        create: {
          name: data.guestName,
          phone: data.guestPhone,
          email: data.guestEmail || null,
          locale: toPrismaLocale(locale),
        },
      })

      const created = await tx.order.create({
        data: {
          code,
          customerId: customer.id,
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          guestEmail: data.guestEmail || null,
          type: 'PICKUP',
          status: 'NEW',
          pickupAt,
          subtotalCents: subtotal,
          totalCents: subtotal,
          // Payment stays UNPAID: no provider is wired, and marking an order
          // paid without money actually moving would be a lie in the books.
          paymentMethod: data.paymentMethod,
          paymentStatus: 'UNPAID',
          notes: data.notes || null,
          locale: toPrismaLocale(locale),
          items: {
            create: priced.map(({ line, dish }) => ({
              menuItemId: dish!.id,
              nameSnapshot: dish!.nameVi,
              unitPriceCents: dish!.priceCents,
              quantity: line.quantity,
              lineTotalCents: dish!.priceCents * line.quantity,
              notes: line.notes || null,
            })),
          },
        },
      })

      await tx.notification.create({
        data: {
          type: 'ORDER_NEW',
          title: `Neue Abholbestellung ${code}`,
          body: `${data.guestName} · ${priced.length} Positionen · ${(subtotal / 100).toFixed(2)} €`,
          // The console is one page; there is no per-order route to deep-link to.
          link: '/admin',
          meta: { orderId: created.id },
        },
      })

      return created
    })

    return NextResponse.json(
      {
        code: order.code,
        status: order.status,
        persisted: true,
        totalCents: order.totalCents,
        pickupAt: order.pickupAt.toISOString(),
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[orders] create failed', err)
    return NextResponse.json(
      { error: 'Bestellung konnte nicht gespeichert werden. Bitte rufen Sie uns an.' },
      { status: 500 },
    )
  }
}
