import type { Metadata } from 'next'

import { combineDateTime, getDemoTableViews, toDateInput } from '@/lib/reservation'
import { ReservationSection } from '@/components/reservation/ReservationSection'

export const metadata: Metadata = {
  title: 'Online Reservation',
  description: 'Reservieren Sie Ihren Tisch im Viet Rice Berlin — schnell, einfach und kostenlos.',
}

/** Availability depends on the current time, so this page is never cached. */
export const dynamic = 'force-dynamic'

export default function ReservationPage() {
  const now = new Date()
  const date = toDateInput(now)
  const time = '19:00'
  const tables = getDemoTableViews(combineDateTime(date, time), now)

  return (
      <>
      <ReservationSection
        initialTables={tables}
        serverNowIso={now.toISOString()}
        initialDate={date}
        initialTime={time}
      />
    </>
  )
}
