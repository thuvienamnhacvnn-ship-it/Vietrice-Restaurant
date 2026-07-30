import { NextResponse } from 'next/server'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import { combineDateTime } from '@/lib/reservation'
import { getTableViews } from '@/server/tables'

export const dynamic = 'force-dynamic'

/**
 * Floor-plan availability for a given slot.
 *
 * Availability and the countdown anchor are both computed from server time, so
 * a client with a skewed clock cannot make a busy table look free.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const time = searchParams.get('time')

  const now = new Date()

  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: 'Invalid date or time.' }, { status: 400 })
  }

  const slotStart = combineDateTime(date, time)
  if (Number.isNaN(slotStart.getTime())) {
    return NextResponse.json({ error: 'Invalid date or time.' }, { status: 400 })
  }

  const tables = await getTableViews(slotStart, RESERVATION_DEFAULTS.durationMinutes, now)

  return NextResponse.json(
    { tables, serverNow: now.toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
