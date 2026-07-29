import { restaurantTables, RESERVATION_DEFAULTS } from '@/content/tables'

export type TableStatus =
  | 'AVAILABLE'
  | 'PENDING'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'BLOCKED'
  | 'MAINTENANCE'

export type TableView = {
  id: string
  number: number
  capacity: number
  minCapacity: number
  gridRow: number
  gridCol: number
  shape: 'square' | 'round'
  zone: string
  status: TableStatus
  /** ISO timestamp the table frees up, for OCCUPIED/PENDING tables. */
  busyUntilIso: string | null
}

/**
 * Half-open interval overlap: `newStart < existingEnd && newEnd > existingStart`.
 *
 * Half-open on purpose — a booking that ends exactly when the next one starts
 * is NOT a conflict, so back-to-back seatings are allowed.
 */
export function overlaps(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return newStart.getTime() < existingEnd.getTime() && newEnd.getTime() > existingStart.getTime()
}

export function endOfSeating(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000)
}

/** Combine a `yyyy-mm-dd` date and `HH:mm` time into a Date in local server time. */
export function combineDateTime(dateIso: string, time: string): Date {
  const [y, m, d] = dateIso.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0)
}

/** Bookable times between the first and last seating, at the configured step. */
export function buildTimeSlots(): string[] {
  const slots: string[] = []
  const [fh, fm] = RESERVATION_DEFAULTS.firstSeating.split(':').map(Number)
  const [lh, lm] = RESERVATION_DEFAULTS.lastSeating.split(':').map(Number)
  let minutes = fh * 60 + fm
  const last = lh * 60 + lm
  while (minutes <= last) {
    slots.push(
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    )
    minutes += RESERVATION_DEFAULTS.slotMinutes
  }
  return slots
}

/** `yyyy-mm-dd` for a Date, in local time (not UTC — avoids off-by-one days). */
export function toDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Deterministic demo occupancy used until a database is connected.
 *
 * Derived from the requested slot so the floor plan is stable across renders
 * and identical for every visitor, rather than flickering randomly. Once
 * `DATABASE_URL` is configured this is replaced by a real query over the
 * `Reservation` table using the same `overlaps()` rule.
 */
export function getDemoTableViews(slotStart: Date, serverNow: Date): TableView[] {
  const slotKey = Math.floor(slotStart.getTime() / (30 * 60_000))

  return restaurantTables.map((table) => {
    // Stable pseudo-random bucket per table per slot.
    const hash = (table.number * 2654435761 + slotKey * 40503) >>> 0
    const bucket = hash % 10

    let status: TableStatus = 'AVAILABLE'
    let busyUntilIso: string | null = null

    if (bucket === 0 || bucket === 1) {
      status = 'OCCUPIED'
      const minutesLeft = 10 + (hash % 45)
      busyUntilIso = new Date(serverNow.getTime() + minutesLeft * 60_000).toISOString()
    } else if (bucket === 2) {
      status = 'PENDING'
      const minutesLeft = 5 + (hash % 15)
      busyUntilIso = new Date(serverNow.getTime() + minutesLeft * 60_000).toISOString()
    }

    return {
      id: `demo-table-${table.number}`,
      number: table.number,
      capacity: table.capacity,
      minCapacity: table.minCapacity,
      gridRow: table.gridRow,
      gridCol: table.gridCol,
      shape: table.shape,
      zone: table.zone,
      status,
      busyUntilIso,
    }
  })
}

/** A table can be picked only if free and large enough for the party. */
export function isSelectable(table: TableView, partySize: number): boolean {
  return table.status === 'AVAILABLE' && partySize <= table.capacity
}

/** Short, unambiguous booking code (no confusable characters). */
export function generateBookingCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `VR-${out}`
}
