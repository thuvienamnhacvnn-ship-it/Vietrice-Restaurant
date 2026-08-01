'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Check, Loader2, Phone, X } from 'lucide-react'

import type { DatedBooking, FloorTable } from '@/lib/floor'
import { buildTimeSlots, toDateInput } from '@/lib/reservation'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { ErrorNote } from '@/components/admin/primitives'

const DURATIONS = [60, 90, 120, 180] as const

/**
 * Everything that turns a request for a table into a fixed one.
 *
 * Two halves of one job, side by side on purpose. The queue is bookings guests
 * made on the website, which hold a table but are not yet promised to anyone;
 * the form is a booking staff are taking right now, at the door or on the
 * phone. Splitting them across two screens would mean the person holding the
 * phone cannot see that the table they are about to promise is already spoken
 * for at seven.
 */
export function TerminPanel({
  tables,
  pending,
  serverNowIso,
}: {
  tables: FloorTable[]
  pending: DatedBooking[]
  serverNowIso: string
}) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const bookable = useMemo(
    () => tables.filter((tb) => tb.isActive).sort((a, b) => a.number - b.number),
    [tables],
  )

  const slots = useMemo(() => buildTimeSlots(), [])
  const [tableId, setTableId] = useState(bookable[0]?.id ?? '')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [date, setDate] = useState(() => toDateInput(new Date(serverNowIso)))
  const [time, setTime] = useState(slots[0] ?? '17:00')
  const [durationMinutes, setDuration] = useState<number>(90)
  const [notes, setNotes] = useState('')

  const selectedTable = bookable.find((tb) => tb.id === tableId) ?? null
  const tooLarge = selectedTable ? partySize > selectedTable.capacity : false
  const canSubmit =
    Boolean(tableId) && guestName.trim().length >= 2 && guestPhone.trim().length >= 6 && !tooLarge

  const dateTime = (iso: string) =>
    new Date(iso).toLocaleString(intl, { dateStyle: 'short', timeStyle: 'short' })

  /** Move a booking already in the system to a new status. */
  const decide = async (id: string, status: string, callOutcome: string) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id, status, callOutcome }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? t.common.error)
        return
      }
      startTransition(() => router.refresh())
    } catch {
      setError(t.common.error)
    } finally {
      setBusyId(null)
    }
  }

  const submit = async () => {
    if (!canSubmit) return
    setBusyId('new')
    setError(null)
    setCreated(null)
    try {
      const res = await fetch('/api/admin/termin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          partySize,
          date,
          time,
          durationMinutes,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
      if (!res.ok) {
        setError(data.error ?? t.common.error)
        return
      }
      setCreated(data.code ?? null)
      setGuestName('')
      setGuestPhone('')
      setNotes('')
      startTransition(() => router.refresh())
    } catch {
      setError(t.common.error)
    } finally {
      setBusyId(null)
    }
  }

  const field =
    'h-9 w-full rounded-lg border border-gold/25 bg-black/40 px-2.5 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none'
  const legend = 'mb-1 block text-[10.5px] font-semibold uppercase tracking-luxe text-gold/80'

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* ---- Bookings waiting on a decision ---- */}
      <div className="card-lux p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-luxe text-gold/85">
          {t.floor.termin.queue}
        </h2>
        <p className="mt-1 text-[12px] text-muted">{t.floor.termin.queueHint}</p>

        {pending.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted">{t.floor.termin.queueEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((b) => (
              <li key={b.id} className="rounded-lg border border-gold/20 bg-black/25 p-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px]">
                      <span className="font-display text-gold-light">{b.code}</span>
                      <span className="truncate text-cream/85">{b.guestName}</span>
                    </p>
                    <p className="text-[12px] text-muted">
                      {t.floor.tableShort}
                      {b.tableNumber} · {b.partySize} {t.reservations.persons} ·{' '}
                      {dateTime(b.startsAtIso)}
                    </p>
                  </div>
                  <a
                    href={`tel:${b.guestPhone.replace(/\s/g, '')}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gold/35 px-2 py-1 text-[11.5px] text-gold hover:bg-gold/10"
                  >
                    <Phone className="h-3 w-3" aria-hidden />
                    {b.guestPhone}
                  </a>
                </div>

                {b.notes && (
                  <p className="mt-1.5 rounded border border-gold/15 bg-black/30 px-2 py-1 text-[11.5px] text-cream/75">
                    {b.notes}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => decide(b.id, 'CONFIRMED', 'CONFIRMED')}
                    className="fx-press flex items-center gap-1.5 rounded-md border border-success/45 bg-success/10 px-2.5 py-1 text-[12px] text-success transition-colors hover:bg-success/20 disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {t.floor.termin.confirm}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === b.id}
                    onClick={() => decide(b.id, 'REJECTED', 'REJECTED')}
                    className="fx-press flex items-center gap-1.5 rounded-md border border-danger/40 px-2.5 py-1 text-[12px] text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    {t.floor.termin.reject}
                  </button>
                  {busyId === b.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- Take a booking here and now ---- */}
      <div className="card-lux p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-luxe text-gold/85">
          {t.floor.termin.create}
        </h2>
        <p className="mt-1 text-[12px] text-muted">{t.floor.termin.createHint}</p>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={legend}>{t.floor.termin.table}</span>
            <select value={tableId} onChange={(e) => setTableId(e.target.value)} className={field}>
              {bookable.map((tb) => (
                <option key={tb.id} value={tb.id} className="bg-background-soft">
                  {t.tables.title} {tb.number} · {tb.capacity} {t.tables.capacity}
                  {tb.zone ? ` · ${tb.zone}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={legend}>{t.common.name}</span>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t.floor.termin.namePlaceholder}
              className={field}
            />
          </label>

          <label>
            <span className={legend}>{t.common.phone}</span>
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              inputMode="tel"
              placeholder="+49 …"
              className={field}
            />
          </label>

          <label>
            <span className={legend}>{t.floor.termin.date}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={field}
            />
          </label>

          <label>
            <span className={legend}>{t.floor.termin.time}</span>
            <select value={time} onChange={(e) => setTime(e.target.value)} className={field}>
              {slots.map((s) => (
                <option key={s} value={s} className="bg-background-soft">
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={legend}>{t.reservations.persons}</span>
            <select
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className={cn(field, tooLarge && 'border-danger/60')}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="bg-background-soft">
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={legend}>{t.floor.termin.duration}</span>
            <select
              value={durationMinutes}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={field}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d} className="bg-background-soft">
                  {d >= 60 ? `${d / 60}h` : `${d}′`}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className={legend}>{t.common.notes}</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.floor.termin.notesPlaceholder}
              className={field}
            />
          </label>
        </div>

        {tooLarge && selectedTable && (
          <p className="mt-2 text-[12px] text-danger">
            {t.floor.termin.tooLarge} {selectedTable.capacity}.
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit || busyId === 'new'}
          onClick={submit}
          className="fx-press mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gold/50 bg-gold/12 px-3 py-2.5 text-[13px] text-gold-light transition-colors hover:bg-gold/20 disabled:opacity-40"
        >
          {busyId === 'new' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CalendarPlus className="h-4 w-4" aria-hidden />
          )}
          {t.floor.termin.submit}
        </button>

        {created && (
          <p className="mt-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[12.5px] text-success">
            {t.floor.termin.created} <span className="font-display">{created}</span>
          </p>
        )}
      </div>

      <div className="xl:col-span-2">
        <ErrorNote message={error} />
        {refreshing && <p className="mt-3 text-[12.5px] text-muted">{t.common.refreshing}</p>}
      </div>
    </div>
  )
}
