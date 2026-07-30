'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  ShoppingBag,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

type Reservation = {
  id: string
  code: string
  guestName: string
  guestPhone: string
  partySize: number
  tableNumber: number
  startsAt: string
  status: string
  notes: string | null
}

type Table = { id: string; number: number; capacity: number; status: string }

type Order = {
  id: string
  code: string
  guestName: string
  guestPhone: string
  pickupAt: string
  status: string
  paymentStatus: string
  totalCents: number
  notes: string | null
  items: { name: string; quantity: number }[]
}

const RES_STATUS: Record<string, string> = {
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

const TABLE_STATES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE'] as const

/** Kitchen lifecycle for a pickup order, in the order staff actually work it. */
const ORDER_ACTIONS = [
  { label: 'Angenommen', status: 'CONFIRMED' },
  { label: 'In Zubereitung', status: 'PREPARING' },
  { label: 'Abholbereit', status: 'READY_FOR_PICKUP' },
  { label: 'Abgeholt', status: 'COMPLETED' },
  { label: 'Storniert', status: 'CANCELLED' },
] as const

const ORDER_STATUS: Record<string, string> = {
  NEW: 'border-warning/50 bg-warning/10 text-warning',
  CONFIRMED: 'border-gold/50 bg-gold/10 text-gold-light',
  PREPARING: 'border-gold/50 bg-gold/10 text-gold-light',
  READY_FOR_PICKUP: 'border-success/50 bg-success/10 text-success',
  COMPLETED: 'border-white/20 bg-white/5 text-muted',
  CANCELLED: 'border-danger/50 bg-danger/10 text-danger',
}

const TABLE_STYLE: Record<string, string> = {
  AVAILABLE: 'border-success/50 bg-success/10 text-success',
  PENDING: 'border-warning/50 bg-warning/10 text-warning',
  RESERVED: 'border-gold/50 bg-gold/10 text-gold-light',
  OCCUPIED: 'border-danger/50 bg-danger/10 text-danger',
  BLOCKED: 'border-white/20 bg-white/5 text-muted',
  MAINTENANCE: 'border-white/20 bg-white/5 text-muted',
}

export function AdminConsole({
  session,
  stats,
  reservations,
  tables,
  orders,
}: {
  session: { name: string; role: string }
  stats: { pending: number; today: number; unread: number; tables: number; openOrders: number }
  reservations: Reservation[]
  tables: Table[]
  orders: Order[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const post = async (url: string, body: unknown, id: string) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Aktion fehlgeschlagen.')
        return
      }
      // Re-fetch on the server so the list reflects what was actually stored,
      // rather than optimistically showing a state the database may not hold.
      startTransition(() => router.refresh())
    } catch {
      setError('Aktion fehlgeschlagen.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="border-b border-gold/15 bg-background-soft/70">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3">
          <Logo size="sm" withTagline={false} asLink={false} />
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] text-muted">
              <Bell className="h-4 w-4 text-gold" aria-hidden />
              {stats.unread}
            </span>
            <span className="text-[13px] text-cream/80">
              {session.name}
              <span className="ml-2 rounded border border-gold/30 px-1.5 py-0.5 text-[10px] uppercase tracking-luxe text-gold">
                {session.role}
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-6">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Heute', value: stats.today, Icon: CalendarClock },
            { label: 'Offen', value: stats.pending, Icon: Clock },
            { label: 'Bestellungen', value: stats.openOrders, Icon: ShoppingBag },
            { label: 'Tische', value: stats.tables, Icon: Users },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="card-lux flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/35 text-gold">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-2xl leading-none text-cream">{value}</span>
                <span className="text-[11.5px] uppercase tracking-luxe text-muted">{label}</span>
              </span>
            </div>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-[13px] text-danger"
          >
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ---- Reservations ---- */}
          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-luxe text-gold-light">
              Reservierungen
            </h2>

            {reservations.length === 0 ? (
              <p className="card-lux p-6 text-center text-[13px] text-muted">
                Keine Reservierungen ab heute.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {reservations.map((r) => (
                  <li key={r.id} className="card-lux p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2">
                          <span className="font-display text-lg text-gold-light">{r.code}</span>
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                              RES_STATUS[r.status] ?? 'border-white/20 text-muted',
                            )}
                          >
                            {r.status}
                          </span>
                        </p>
                        <p className="mt-1 text-[13.5px] text-cream">
                          {r.guestName} · Tisch {r.tableNumber} · {r.partySize} Pers.
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          {new Date(r.startsAt).toLocaleString('de-DE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                          {r.notes ? ` · ${r.notes}` : ''}
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

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gold/12 pt-3">
                      {CALL_ACTIONS.map((a) => (
                        <button
                          key={a.status}
                          type="button"
                          disabled={busyId === r.id || r.status === a.status}
                          onClick={() =>
                            post(
                              '/api/admin/reservations',
                              {
                                reservationId: r.id,
                                status: a.status,
                                callOutcome: a.outcome,
                              },
                              r.id,
                            )
                          }
                          className="fx-press rounded-md border border-gold/25 px-2.5 py-1 text-[12px] text-cream/80 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                        >
                          {a.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() =>
                          post(
                            '/api/admin/reservations',
                            { reservationId: r.id, status: 'SEATED' },
                            r.id,
                          )
                        }
                        className="fx-press rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[12px] text-gold-light disabled:opacity-40"
                      >
                        Eingesetzt
                      </button>
                      {busyId === r.id && (
                        <Loader2 className="h-4 w-4 animate-spin self-center text-gold" aria-hidden />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- Floor plan control ---- */}
          <section>
            <h2 className="mb-3 font-display text-lg uppercase tracking-luxe text-gold-light">
              Tischstatus
            </h2>
            <ul className="space-y-2">
              {tables.map((t) => (
                <li key={t.id} className="card-lux p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] text-cream">
                      Tisch {t.number}
                      <span className="ml-2 text-[12px] text-muted">{t.capacity} Plätze</span>
                    </span>
                    <span
                      className={cn(
                        'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                        TABLE_STYLE[t.status] ?? 'border-white/20 text-muted',
                      )}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TABLE_STATES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={busyId === t.id || t.status === s}
                        onClick={() =>
                          post('/api/admin/tables', { tableId: t.id, status: s }, t.id)
                        }
                        className="fx-press rounded border border-gold/20 px-2 py-0.5 text-[11px] text-cream/70 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-35"
                      >
                        {s === 'AVAILABLE' ? 'Frei' : s === 'RESERVED' ? 'Reserviert' : s === 'OCCUPIED' ? 'Besetzt' : s === 'BLOCKED' ? 'Gesperrt' : 'Wartung'}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ---- Pickup orders ---- */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg uppercase tracking-luxe text-gold-light">
            Abholbestellungen
          </h2>

          {orders.length === 0 ? (
            <p className="card-lux p-6 text-center text-[13px] text-muted">
              Keine offenen Bestellungen.
            </p>
          ) : (
            <ul className="grid gap-2.5 lg:grid-cols-2">
              {orders.map((o) => (
                <li key={o.id} className="card-lux p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2">
                        <span className="font-display text-lg text-gold-light">{o.code}</span>
                        <span
                          className={cn(
                            'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                            ORDER_STATUS[o.status] ?? 'border-white/20 text-muted',
                          )}
                        >
                          {o.status}
                        </span>
                        {o.paymentStatus !== 'PAID' && (
                          <span className="rounded border border-danger/40 px-2 py-0.5 text-[10px] uppercase tracking-luxe text-danger">
                            Unbezahlt
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[13.5px] text-cream">
                        {o.guestName} ·{' '}
                        {new Date(o.pickupAt).toLocaleString('de-DE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}{' '}
                        · {(o.totalCents / 100).toFixed(2)} €
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                        {o.notes ? ` — ${o.notes}` : ''}
                      </p>
                    </div>

                    <a
                      href={`tel:${o.guestPhone.replace(/\s/g, '')}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 px-3 py-1.5 text-[12.5px] text-gold hover:bg-gold/10"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {o.guestPhone}
                    </a>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-gold/12 pt-3">
                    {ORDER_ACTIONS.map((a) => (
                      <button
                        key={a.status}
                        type="button"
                        disabled={busyId === o.id || o.status === a.status}
                        onClick={() =>
                          post(
                            '/api/admin/orders',
                            // Handing the food over is also when the guest pays
                            // at the counter, so that single click records both.
                            a.status === 'COMPLETED'
                              ? { orderId: o.id, status: a.status, paymentStatus: 'PAID' }
                              : { orderId: o.id, status: a.status },
                            o.id,
                          )
                        }
                        className="fx-press rounded-md border border-gold/25 px-2.5 py-1 text-[12px] text-cream/80 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                      >
                        {a.label}
                      </button>
                    ))}
                    {busyId === o.id && (
                      <Loader2 className="h-4 w-4 animate-spin self-center text-gold" aria-hidden />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {pending && (
          <p className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            Aktualisiere…
          </p>
        )}
      </main>
    </div>
  )
}
