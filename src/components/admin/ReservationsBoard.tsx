'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Phone, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

export type AdminReservation = {
  id: string
  code: string
  guestName: string
  guestPhone: string
  guestEmail: string | null
  partySize: number
  tableNumber: number
  startsAt: string
  endsAt: string
  status: string
  notes: string | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Offen',
  CALLBACK_REQUIRED: 'Rückruf',
  CONFIRMED: 'Bestätigt',
  SEATED: 'Eingesetzt',
  COMPLETED: 'Abgeschlossen',
  REJECTED: 'Abgelehnt',
  CANCELLED: 'Storniert',
  NO_SHOW: 'Nicht erschienen',
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'border-warning/50 bg-warning/10 text-warning',
  CALLBACK_REQUIRED: 'border-warning/50 bg-warning/10 text-warning',
  CONFIRMED: 'border-success/50 bg-success/10 text-success',
  SEATED: 'border-gold/50 bg-gold/10 text-gold-light',
  COMPLETED: 'border-white/20 bg-white/5 text-muted',
  REJECTED: 'border-danger/50 bg-danger/10 text-danger',
  CANCELLED: 'border-danger/50 bg-danger/10 text-danger',
  NO_SHOW: 'border-danger/50 bg-danger/10 text-danger',
}

/** Outcomes offered after the confirmation call, per the booking workflow. */
const CALL_ACTIONS = [
  { label: 'Bestätigt', status: 'CONFIRMED', outcome: 'CONFIRMED' },
  { label: 'Keine Antwort', status: 'CALLBACK_REQUIRED', outcome: 'NO_ANSWER' },
  { label: 'Abgelehnt', status: 'REJECTED', outcome: 'REJECTED' },
  { label: 'Storniert', status: 'CANCELLED', outcome: 'CANCELLED' },
] as const

const LATER_ACTIONS = [
  { label: 'Eingesetzt', status: 'SEATED' },
  { label: 'Abgeschlossen', status: 'COMPLETED' },
  { label: 'Nicht erschienen', status: 'NO_SHOW' },
] as const

const FILTERS = [
  { key: 'OPEN', label: 'Zu bearbeiten' },
  { key: 'CONFIRMED', label: 'Bestätigt' },
  { key: 'SEATED', label: 'Im Haus' },
  { key: 'TODAY', label: 'Heute' },
  { key: 'ALL', label: 'Alle' },
] as const

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })

const isToday = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

export function ReservationsBoard({ reservations }: { reservations: AdminReservation[] }) {
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const [filter, setFilter] = useState<string>('OPEN')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: reservations.length, OPEN: 0, TODAY: 0 }
    for (const r of reservations) {
      c[r.status] = (c[r.status] ?? 0) + 1
      if (r.status === 'PENDING' || r.status === 'CALLBACK_REQUIRED') c.OPEN += 1
      if (isToday(r.startsAt)) c.TODAY += 1
    }
    return c
  }, [reservations])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reservations.filter((r) => {
      const byFilter =
        filter === 'ALL'
          ? true
          : filter === 'OPEN'
            ? r.status === 'PENDING' || r.status === 'CALLBACK_REQUIRED'
            : filter === 'TODAY'
              ? isToday(r.startsAt)
              : r.status === filter
      if (!byFilter) return false
      if (!q) return true
      return (
        r.code.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        r.guestPhone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        String(r.tableNumber) === q
      )
    })
  }, [reservations, filter, query])

  const post = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id, ...body }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Aktion fehlgeschlagen.')
        return
      }
      startTransition(() => router.refresh())
    } catch {
      setError('Aktion fehlgeschlagen.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-luxe text-gold-light">
            Reservierungen
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {counts.OPEN} zu bestätigen · {counts.TODAY} heute · {counts.SEATED ?? 0} im Haus
          </p>
        </div>

        <label className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code, Name, Telefon, Tisch"
            className="h-10 w-[260px] rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'fx-press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                key === filter
                  ? 'border-gold bg-gold/12 text-gold-light'
                  : 'border-gold/25 text-cream/70 hover:border-gold/55 hover:text-gold',
              )}
            >
              {label}
              <span className="tabular-nums text-muted">{counts[key] ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-[13px] text-danger"
        >
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="card-lux mt-5 p-8 text-center text-[13px] text-muted">
          Keine Reservierungen in dieser Ansicht.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {visible.map((r) => (
            <li key={r.id} className="card-lux p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-gold-light">{r.code}</span>
                    <span
                      className={cn(
                        'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                        STATUS_STYLE[r.status] ?? 'border-white/20 text-muted',
                      )}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </p>
                  <p className="mt-1.5 text-[13.5px] text-cream">
                    {r.guestName} · Tisch {r.tableNumber} · {r.partySize} Pers.
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {dateTime(r.startsAt)} –{' '}
                    {new Date(r.endsAt).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <a
                  href={`tel:${r.guestPhone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 px-3 py-1.5 text-[12.5px] text-gold hover:bg-gold/10"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {r.guestPhone}
                </a>
              </div>

              {r.notes && (
                <p className="mt-2 rounded-md border border-gold/20 bg-black/25 px-3 py-2 text-[12.5px] text-cream/80">
                  {r.notes}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold/12 pt-3">
                <span className="text-[11px] uppercase tracking-luxe text-muted">Anruf:</span>
                {CALL_ACTIONS.map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    disabled={busyId === r.id || r.status === a.status}
                    onClick={() => post(r.id, { status: a.status, callOutcome: a.outcome })}
                    className="fx-press rounded-md border border-gold/25 px-2.5 py-1 text-[12px] text-cream/80 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-luxe text-muted">Service:</span>
                {LATER_ACTIONS.map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    disabled={busyId === r.id || r.status === a.status}
                    onClick={() => post(r.id, { status: a.status })}
                    className="fx-press rounded-md border border-gold/25 px-2.5 py-1 text-[12px] text-cream/80 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                  >
                    {a.label}
                  </button>
                ))}
                {busyId === r.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">Aktualisiere…</p>}
    </>
  )
}
