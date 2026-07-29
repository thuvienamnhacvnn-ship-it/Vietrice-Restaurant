import { z } from 'zod'

import { RESERVATION_DEFAULTS } from '@/content/tables'

/** Loose international phone check — digits, spaces and the usual separators. */
const phoneRegex = /^[+]?[\d\s()/-]{6,24}$/

export const reservationSchema = z
  .object({
    tableId: z.string().min(1),
    tableNumber: z.number().int().positive(),

    guestName: z.string().trim().min(2, 'Bitte geben Sie Ihren Namen an.').max(120),
    guestPhone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Bitte geben Sie eine gültige Telefonnummer an.'),
    guestEmail: z.string().trim().email('Ungültige E-Mail-Adresse.').optional().or(z.literal('')),

    partySize: z
      .number()
      .int()
      .min(1, 'Mindestens 1 Person.')
      .max(RESERVATION_DEFAULTS.maxPartySize),

    /** `yyyy-mm-dd` */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum.'),
    /** `HH:mm` */
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Ungültige Uhrzeit.'),

    durationMinutes: z
      .number()
      .int()
      .min(30)
      .max(240)
      .default(RESERVATION_DEFAULTS.durationMinutes),

    occasion: z.string().trim().max(120).optional().or(z.literal('')),
    isBirthday: z.boolean().default(false),
    needsHighChair: z.boolean().default(false),
    allergyNotes: z.string().trim().max(500).optional().or(z.literal('')),
    notes: z.string().trim().max(500).optional().or(z.literal('')),

    policyAccepted: z
      .boolean()
      .refine((v) => v === true, { message: 'Bitte akzeptieren Sie die Reservierungsbedingungen.' }),
  })
  .superRefine((data, ctx) => {
    const [y, m, d] = data.date.split('-').map(Number)
    const [hh, mm] = data.time.split(':').map(Number)
    const start = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Ungültiges Datum.' })
      return
    }

    // Never allow a booking in the past. Re-checked server-side against server
    // time — this client-side pass is only for fast feedback.
    const earliest = Date.now() + RESERVATION_DEFAULTS.minLeadMinutes * 60_000
    if (start.getTime() < earliest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['time'],
        message: 'Bitte wählen Sie einen Zeitpunkt in der Zukunft.',
      })
    }

    const latest = new Date()
    latest.setDate(latest.getDate() + RESERVATION_DEFAULTS.maxAdvanceDays)
    if (start.getTime() > latest.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message: `Reservierungen sind bis ${RESERVATION_DEFAULTS.maxAdvanceDays} Tage im Voraus möglich.`,
      })
    }
  })

export type ReservationInput = z.input<typeof reservationSchema>
export type ReservationParsed = z.output<typeof reservationSchema>
