import { NextResponse } from 'next/server'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import { getLocale } from '@/i18n'
import { combineDateTime, endOfSeating } from '@/lib/reservation'
import { reservationSchema } from '@/lib/validation/reservation'
import { createReservation } from '@/server/reservations'

export const dynamic = 'force-dynamic'

const ERRORS: Record<string, { status: number; message: string }> = {
  TABLE_MISSING: { status: 404, message: 'Tisch nicht gefunden.' },
  TOO_LARGE: {
    status: 409,
    message: 'Die Personenzahl überschreitet die Kapazität dieses Tisches.',
  },
  TABLE_BUSY: {
    status: 409,
    message: 'Dieser Tisch ist inzwischen belegt. Bitte wählen Sie einen anderen.',
  },
}

/**
 * Create a reservation.
 *
 * Everything the client sent is re-validated here — the browser's Zod pass is
 * only for fast feedback and is never trusted. In particular the "not in the
 * past" rule is re-checked against *server* time.
 *
 * Whether the table is actually free is decided inside the booking transaction,
 * not here: checking first and inserting afterwards leaves a window in which a
 * second guest can book the same table.
 */
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const parsed = reservationSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed.',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 422 },
    )
  }

  const data = parsed.data
  const now = new Date()
  const startsAt = combineDateTime(data.date, data.time)
  const endsAt = endOfSeating(startsAt, data.durationMinutes)

  // Re-check against server time — the client's clock is not authoritative.
  if (startsAt.getTime() < now.getTime() + RESERVATION_DEFAULTS.minLeadMinutes * 60_000) {
    return NextResponse.json(
      { error: 'Der gewählte Zeitpunkt liegt in der Vergangenheit.' },
      { status: 409 },
    )
  }

  const locale = await getLocale()

  try {
    const result = await createReservation(data, startsAt, endsAt, locale)

    if (!result.ok) {
      const e = ERRORS[result.reason]
      return NextResponse.json({ error: e.message }, { status: e.status })
    }

    return NextResponse.json(
      {
        code: result.code,
        status: 'PENDING',
        persisted: result.persisted,
        startsAt: result.startsAt.toISOString(),
        endsAt: result.endsAt.toISOString(),
        message: result.persisted
          ? undefined
          : 'Demo mode: no DATABASE_URL configured, the reservation was validated but not stored.',
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[reservations] create failed', err)
    return NextResponse.json(
      { error: 'Reservierung konnte nicht gespeichert werden. Bitte rufen Sie uns an.' },
      { status: 500 },
    )
  }
}
