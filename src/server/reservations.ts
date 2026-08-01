import { Prisma } from '@prisma/client'

import { hasDatabase, prisma } from '@/lib/db'
import { generateBookingCode } from '@/lib/reservation'
import type { ReservationParsed } from '@/lib/validation/reservation'
import { toPrismaLocale, type Locale } from '@/i18n/config'

const BLOCKING_STATUSES = ['PENDING', 'CALLBACK_REQUIRED', 'CONFIRMED', 'SEATED'] as const

export type BookingResult =
  | { ok: true; code: string; persisted: boolean; startsAt: Date; endsAt: Date }
  | { ok: false; reason: 'TABLE_BUSY' | 'TABLE_MISSING' | 'TOO_LARGE' }

export type AdminBookingInput = {
  tableId: string
  guestName: string
  guestPhone: string
  partySize: number
  notes?: string | null
}

/**
 * Create a booking on behalf of a guest, already confirmed.
 *
 * The difference from the public path is not the checks — those are identical
 * and equally binding — but the starting status. A booking taken over the phone
 * or at the door has already had its confirmation conversation; dropping it in
 * as PENDING would put it in the call-back queue and have staff ring a guest
 * standing in front of them.
 *
 * `actor` is recorded on the status log so the trail names the member of staff
 * who took it, not the guest.
 */
export async function createAdminReservation(
  input: AdminBookingInput,
  startsAt: Date,
  endsAt: Date,
  actor: { userId: string | null; name: string },
): Promise<BookingResult> {
  const code = generateBookingCode()

  if (!hasDatabase) {
    return { ok: true, code, persisted: false, startsAt, endsAt }
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const table = await tx.restaurantTable.findUnique({ where: { id: input.tableId } })
        if (!table) return { ok: false, reason: 'TABLE_MISSING' } as const
        if (input.partySize > table.capacity) return { ok: false, reason: 'TOO_LARGE' } as const

        // Same half-open overlap rule as the public path, run inside the
        // transaction for the same reason: a guest on the website can be
        // committing to this table while this form is open.
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

        const customer = await tx.customer.upsert({
          where: { phone: input.guestPhone },
          update: { name: input.guestName },
          create: { name: input.guestName, phone: input.guestPhone },
        })

        const reservation = await tx.reservation.create({
          data: {
            code,
            tableId: table.id,
            customerId: customer.id,
            guestName: input.guestName,
            guestPhone: input.guestPhone,
            partySize: input.partySize,
            startsAt,
            endsAt,
            durationMinutes: Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000),
            status: 'CONFIRMED',
            notes: input.notes || null,
            // Taken by staff in person, so consent was given in the room.
            policyAcceptedAt: new Date(),
            source: 'ADMIN',
          },
        })

        await tx.reservationStatusLog.create({
          data: {
            reservationId: reservation.id,
            fromStatus: null,
            toStatus: 'CONFIRMED',
            actorId: actor.userId,
            actorName: actor.name,
            reason: 'Created in the floor console',
          },
        })

        await tx.reservationHistory.create({
          data: {
            reservationId: reservation.id,
            actorId: actor.userId,
            actorName: actor.name,
            action: 'CREATED',
            note: `Table ${table.number}, ${input.partySize} guests`,
          },
        })

        await tx.auditLog.create({
          data: {
            actorId: actor.userId,
            actorName: actor.name,
            action: 'reservation.create',
            entity: 'Reservation',
            entityId: reservation.id,
            after: {
              code,
              tableNumber: table.number,
              partySize: input.partySize,
              startsAt: startsAt.toISOString(),
            },
          },
        })

        return { ok: true, code, persisted: true, startsAt, endsAt } as const
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 },
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return { ok: false, reason: 'TABLE_BUSY' }
    }
    throw err
  }
}

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
            // The console is one page; there is no per-reservation route yet.
            link: '/admin',
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
