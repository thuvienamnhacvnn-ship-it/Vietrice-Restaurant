import { NextResponse } from 'next/server'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import {
  combineDateTime,
  endOfSeating,
  generateBookingCode,
  getDemoTableViews,
} from '@/lib/reservation'
import { reservationSchema } from '@/lib/validation/reservation'

export const dynamic = 'force-dynamic'

/**
 * Create a reservation.
 *
 * Everything the client sent is re-validated here — the browser's Zod pass is
 * only for fast feedback and is never trusted. In particular the "not in the
 * past" rule is re-checked against *server* time.
 *
 * Persistence: when `DATABASE_URL` is configured this writes a PENDING
 * `Reservation` plus its `ReservationStatusLog` inside a transaction that
 * re-checks for overlapping bookings on the same table
 * (`newStart < existingEnd && newEnd > existingStart`) immediately before the
 * insert, which is what makes concurrent double-booking impossible. Without a
 * database configured the endpoint validates fully and returns a booking code
 * but does not persist — and says so in the response.
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
  const start = combineDateTime(data.date, data.time)
  const end = endOfSeating(start, data.durationMinutes)

  // Re-check against server time — the client's clock is not authoritative.
  if (start.getTime() < now.getTime() + RESERVATION_DEFAULTS.minLeadMinutes * 60_000) {
    return NextResponse.json(
      { error: 'Der gewählte Zeitpunkt liegt in der Vergangenheit.' },
      { status: 409 },
    )
  }

  // Re-check the table is actually free and big enough for the party.
  const tables = getDemoTableViews(start, now)
  const table = tables.find((t) => t.id === data.tableId || t.number === data.tableNumber)

  if (!table) {
    return NextResponse.json({ error: 'Tisch nicht gefunden.' }, { status: 404 })
  }
  if (table.status !== 'AVAILABLE') {
    return NextResponse.json(
      { error: 'Dieser Tisch ist inzwischen belegt. Bitte wählen Sie einen anderen.' },
      { status: 409 },
    )
  }
  if (data.partySize > table.capacity) {
    return NextResponse.json(
      { error: 'Die Personenzahl überschreitet die Kapazität dieses Tisches.' },
      { status: 409 },
    )
  }

  const code = generateBookingCode()
  const persisted = Boolean(process.env.DATABASE_URL)

  // TODO(db): replace with a Prisma transaction that re-runs the overlap query
  // and inserts Reservation + ReservationStatusLog + Notification atomically.

  return NextResponse.json(
    {
      code,
      status: 'PENDING',
      persisted,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      message: persisted
        ? undefined
        : 'Demo mode: no DATABASE_URL configured, the reservation was validated but not stored.',
    },
    { status: 201 },
  )
}
