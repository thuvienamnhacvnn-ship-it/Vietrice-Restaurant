import type { Metadata } from 'next'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import { combineDateTime, nextBookableSlot, toDateInput } from '@/lib/reservation'
import { getTableViews } from '@/server/tables'
import { ReservationSection } from '@/components/reservation/ReservationSection'

export const metadata: Metadata = {
  title: 'Online Reservation',
  description: 'Reservieren Sie Ihren Tisch im Viet Rice Berlin — schnell, einfach und kostenlos.',
}

/** Availability depends on the current time, so this page is never cached. */
export const dynamic = 'force-dynamic'

/**
 * The first paint has to be the real floor.
 *
 * This used to call `getDemoTableViews` unconditionally, so the page opened on
 * invented occupancy — plausible-looking tables with plausible-looking
 * countdowns — and only became true once the client re-queried `/api/tables`.
 * Anyone comparing it against the admin console saw two different rooms, and
 * the guest saw fictional tables until something prompted a refresh.
 *
 * `getTableViews` still falls back to the demo plan when no database is
 * configured, so the no-DB case keeps working; the difference is that the
 * fallback is now a fallback rather than the only path.
 */
export default async function ReservationPage() {
  const now = new Date()
  const date = toDateInput(now)
  const time = nextBookableSlot(now)
  const tables = await getTableViews(
    combineDateTime(date, time),
    RESERVATION_DEFAULTS.durationMinutes,
    now,
  )

  return (
      <>
      <ReservationSection
        initialTables={tables}
        serverNowIso={now.toISOString()}
        initialDate={date}
        initialTime={time}
        showNotice
      />
    </>
  )
}
