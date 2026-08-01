/**
 * Shapes and constants shared by the floor console's server queries and its
 * client components.
 *
 * This file exists so the client half never imports `@/server/floor`. Types
 * alone would be erased at compile time, but the arrival window is a runtime
 * value, and importing it from the server module would drag Prisma into the
 * browser bundle — a mistake that typechecks cleanly and only shows up as a
 * "PrismaClient cannot run in the browser" error in front of a user.
 */

/**
 * How long a seated party still reads as "just arrived".
 *
 * The client re-derives this against the ticking clock: the badge has to stop
 * being true while the page sits open, not only when someone reloads it.
 */
export const JUST_ARRIVED_MINUTES = 15

/**
 * How long a table that was just handed back keeps announcing itself.
 *
 * Short on purpose. The point is to catch the eye of whoever is working the
 * room in the moment it happens; a notice that lingers for half an hour stops
 * meaning "now" and starts being scenery staff read past.
 */
export const JUST_FREED_MINUTES = 5

/**
 * Default seating length for a walk-in seated by hand, in minutes.
 *
 * Three hours is deliberately generous — it is the countdown staff watch, not a
 * timer that frees the table. Erring long means the number on screen stays
 * plausible for a long dinner; erring short would have every table on the map
 * showing overdue by nine in the evening, which trains people to ignore it.
 */
export const DEFAULT_BUSY_MINUTES = 180

export type FloorBooking = {
  id: string
  code: string
  guestName: string
  guestPhone: string
  partySize: number
  status: string
  startsAtIso: string
  endsAtIso: string
  seatedAtIso: string | null
  notes: string | null
}

export type FloorTable = {
  id: string
  number: number
  capacity: number
  gridRow: number
  gridCol: number
  shape: 'square' | 'round'
  zone: string | null
  isActive: boolean
  /** The table's own stored status — what staff set by hand. */
  status: string
  /** End of a manual lock window, when one is running. */
  blockedToIso: string | null
  /** When a party seated by hand is due to leave, if staff set a window. */
  busyUntilIso: string | null
  /** When the table was last handed back. */
  freedAtIso: string | null
  /** The booking sitting on this table at `now`, if any. */
  current: FloorBooking | null
  /** Bookings for this table later today, earliest first. */
  upcoming: FloorBooking[]
}

export type DatedBooking = FloorBooking & { tableNumber: number }

export type FloorSnapshot = {
  tables: FloorTable[]
  /** Every booking for today, across all tables, earliest first. */
  today: DatedBooking[]
  serverNowIso: string
}
