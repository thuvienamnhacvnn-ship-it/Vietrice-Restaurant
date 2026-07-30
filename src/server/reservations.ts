import { Prisma } from '@prisma/client'

import { hasDatabase, prisma } from '@/lib/db'
import { generateBookingCode } from '@/lib/reservation'
import type { ReservationParsed } from '@/lib/validation/reservation'
import { toPrismaLocale, type Locale } from '@/i18n/config'

const BLOCKING_STATUSES = ['PENDING', 'CALLBACK_REQUIRED', 'CONFIRMED', 'SEATED'] as const

export type BookingResult =
  | { ok: true; code: string; persisted: boolean; startsAt: Date; endsAt: Date }
  | { ok: false; reason: 'TABLE_BUSY' | 'TABLE_MISSING' | 'TOO_LARGE' }

/**
 * Create a PENDING reservation.
 *
 * The overlap check runs *inside* the transaction, immediately before the
 * insert, rather than being trusted from the earlier availability query. Two
 * guests can load the same free floor plan and submit within milliseconds of
 * each other; only a check that happens after the transaction has begun can
 * catch the second one. `Serializable` is what makes that check binding — under
 * the default isolation level both transactions would read "no conflict" and
 * both would commit.
 *
 * The status log and the admin notification are written in the same
 * transaction: a booking that exists without its audit trail, or that nobody is
 * told about, is worse than one that failed outright.
 */
export async function createReservation(
  data: ReservationParsed,
  startsAt: Date,
  endsAt: Date,
  locale: Locale,
): Promise<BookingResult> {
  const code = generateBookingCode()

  if (!hasDatabase) {
    return { ok: true, code, persisted: false, startsAt, endsAt }
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const table = await tx.restaurantTable.findFirst({
          where: data.tableId.startsWith('demo-table-')
            ? { number: data.tableNumber }
            : { id: data.tableId },
        })

        if (!table) return { ok: false, reason: 'TABLE_MISSING' } as const
        if (data.partySize > table.capacity) {
          return { ok: false, reason: 'TOO_LARGE' } as const
        }

        const clash = await tx.reservation.findFirst({
          where: {
            tableId: table.id,
            status: { in: [...BLOCKING_STATUSES] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        })

        if (clash) return { ok: false, reason: 'TABLE_BUSY' } as const

        // Keep a customer record so repeat guests can be recognised, keyed on
        // the phone number they book with.
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

        const reservation = await tx.reservation.create({
          data: {
            code,
            tableId: table.id,
            customerId: customer.id,
            guestName: data.guestName,
            guestPhone: data.guestPhone,
            guestEmail: data.guestEmail || null,
            partySize: data.partySize,
            startsAt,
            endsAt,
            durationMinutes: data.durationMinutes,
            status: 'PENDING',
            occasion: data.occasion || null,
            isBirthday: data.isBirthday,
            needsHighChair: data.needsHighChair,
            allergyNotes: data.allergyNotes || null,
            notes: data.notes || null,
            policyAcceptedAt: new Date(),
            locale: toPrismaLocale(locale),
            source: 'WEB',
          },
        })

        await tx.reservationStatusLog.create({
          data: {
            reservationId: reservation.id,
            fromStatus: null,
            toStatus: 'PENDING',
            actorName: data.guestName,
            reason: 'Created via website',
          },
        })

        await tx.reservationHistory.create({
          data: {
            reservationId: reservation.id,
            actorName: data.guestName,
            action: 'CREATED',
            note: `Table ${table.number}, ${data.partySize} guests`,
          },
        })

        await tx.notification.create({
          data: {
            type: 'RESERVATION_NEW',
            title: `Neue Reservierung ${code}`,
            body: `${data.guestName} · Tisch ${table.number} · ${data.partySize} Personen`,
            link: `/admin/reservations/${reservation.id}`,
            meta: { reservationId: reservation.id, tableNumber: table.number },
          },
        })

        return { ok: true, code, persisted: true, startsAt, endsAt } as const
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 },
    )
  } catch (err) {
    // A serialization failure means another booking for this table committed
    // first — from the guest's point of view the table is simply taken.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return { ok: false, reason: 'TABLE_BUSY' }
    }
    throw err
  }
}
