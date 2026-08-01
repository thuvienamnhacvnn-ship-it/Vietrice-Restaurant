import { NextResponse } from 'next/server'
import { z } from 'zod'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import { readSession } from '@/lib/auth'
import { combineDateTime, endOfSeating } from '@/lib/reservation'
import { createAdminReservation } from '@/server/reservations'

export const dynamic = 'force-dynamic'

const schema = z.object({
  tableId: z.string().min(1),
  guestName: z.string().trim().min(2).max(120),
  guestPhone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()/-]{6,24}$/, 'Invalid phone number.'),
  partySize: z.number().int().min(1).max(RESERVATION_DEFAULTS.maxPartySize),
  /** `yyyy-mm-dd` */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** `HH:mm` */
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(30).max(240),
  notes: z.string().trim().max(500).optional(),
})

const ERRORS: Record<string, { status: number; message: string }> = {
  TABLE_MISSING: { status: 404, message: 'Tisch nicht gefunden.' },
  TOO_LARGE: { status: 409, message: 'Zu viele Personen für diesen Tisch.' },
  TABLE_BUSY: { status: 409, message: 'Dieser Tisch ist zu dieser Zeit belegt.' },
}

/**
 * Book a table for a guest from the floor console.
 *
 * Two differences from the public endpoint, both deliberate. It lands as
 * CONFIRMED, because staff taking a booking in person have already had the
 * conversation the call-back queue exists to have. And it allows a start time
 * in the past — not an oversight: a walk-in being written up at 19:05 sat down
 * at 19:00, and refusing to record what already happened would push staff back
 * to paper.
 *
 * What is *not* relaxed is the overlap check. That runs inside a serializable
 * transaction exactly as it does for a guest booking online, because the two
 * can happen in the same second.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const data = parsed.data
  const startsAt = combineDateTime(data.date, data.time)
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }
  const endsAt = endOfSeating(startsAt, data.durationMinutes)

  try {
    const result = await createAdminReservation(
      {
        tableId: data.tableId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        partySize: data.partySize,
        notes: data.notes,
      },
      startsAt,
      endsAt,
      { userId: session.userId, name: session.name },
    )

    if (!result.ok) {
      const e = ERRORS[result.reason]
      return NextResponse.json({ error: e.message }, { status: e.status })
    }

    return NextResponse.json(
      { ok: true, code: result.code, startsAt: startsAt.toISOString() },
      { status: 201 },
    )
  } catch (err) {
    console.error('[admin/termin] create failed', err)
    return NextResponse.json({ error: 'Termin konnte nicht angelegt werden.' }, { status: 500 })
  }
}
