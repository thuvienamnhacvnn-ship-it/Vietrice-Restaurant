/**
 * The twelve tables, laid out exactly as in the reservation mockup:
 * three rows of four. Rows 1 and 3 are square four-tops, row 2 is round
 * six-tops, matching the floor plan artwork.
 */
export type TableSeed = {
  number: number
  capacity: number
  minCapacity: number
  gridRow: number
  gridCol: number
  shape: 'square' | 'round'
  zone: string
}

export const restaurantTables: TableSeed[] = [
  { number: 1, capacity: 4, minCapacity: 1, gridRow: 1, gridCol: 1, shape: 'square', zone: 'Main Hall' },
  { number: 2, capacity: 4, minCapacity: 1, gridRow: 1, gridCol: 2, shape: 'square', zone: 'Main Hall' },
  { number: 3, capacity: 4, minCapacity: 1, gridRow: 1, gridCol: 3, shape: 'square', zone: 'Main Hall' },
  { number: 4, capacity: 4, minCapacity: 1, gridRow: 1, gridCol: 4, shape: 'square', zone: 'Main Hall' },

  { number: 5, capacity: 6, minCapacity: 2, gridRow: 2, gridCol: 1, shape: 'round', zone: 'Main Hall' },
  { number: 6, capacity: 6, minCapacity: 2, gridRow: 2, gridCol: 2, shape: 'round', zone: 'Main Hall' },
  { number: 7, capacity: 6, minCapacity: 2, gridRow: 2, gridCol: 3, shape: 'round', zone: 'Main Hall' },
  { number: 8, capacity: 6, minCapacity: 2, gridRow: 2, gridCol: 4, shape: 'round', zone: 'Main Hall' },

  { number: 9, capacity: 4, minCapacity: 1, gridRow: 3, gridCol: 1, shape: 'square', zone: 'Private Room' },
  { number: 10, capacity: 4, minCapacity: 1, gridRow: 3, gridCol: 2, shape: 'square', zone: 'Private Room' },
  { number: 11, capacity: 4, minCapacity: 1, gridRow: 3, gridCol: 3, shape: 'square', zone: 'Private Room' },
  { number: 12, capacity: 4, minCapacity: 1, gridRow: 3, gridCol: 4, shape: 'square', zone: 'Private Room' },
]

/** Bookable slot length in minutes, and the granularity of the time picker. */
export const RESERVATION_DEFAULTS = {
  durationMinutes: 90,
  slotMinutes: 30,
  /** Earliest and latest seating time, evaluated against opening hours. */
  firstSeating: '11:00',
  lastSeating: '21:30',
  /** Guests cannot book closer than this to the current time. */
  minLeadMinutes: 30,
  /** How far ahead the calendar allows booking. */
  maxAdvanceDays: 60,
  maxPartySize: 12,
} as const
