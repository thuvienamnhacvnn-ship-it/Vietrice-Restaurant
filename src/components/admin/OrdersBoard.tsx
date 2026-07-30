'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BadgeEuro,
  ChefHat,
  Clock,
  Loader2,
  PackageCheck,
  Phone,
  Search,
  ShoppingBag,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export type AdminOrder = {
  id: string
  code: string
  guestName: string
  guestPhone: string
  guestEmail: string | null
  createdAt: string
  pickupAt: string
  status: string
  paymentStatus: string
  paymentMethod: string
  subtotalCents: number
  totalCents: number
  notes: string | null
  items: { name: string; quantity: number; unitPriceCents: number; notes: string | null }[]
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Neu',
  CONFIRMED: 'Angenommen',
  PREPARING: 'In Zubereitung',
  READY_FOR_PICKUP: 'Abholbereit',
  COMPLETED: 'Abgeholt',
  CANCELLED: 'Storniert',
}

const STATUS_STYLE: Record<string, string> = {
  NEW: 'border-warning/50 bg-warning/10 text-warning',
  CONFIRMED: 'border-gold/50 bg-gold/10 text-gold-light',
  PREPARING: 'border-gold/50 bg-gold/10 text-gold-light',
  READY_FOR_PICKUP: 'border-success/50 bg-success/10 text-success',
  COMPLETED: 'border-white/20 bg-white/5 text-muted',
  CANCELLED: 'border-danger/50 bg-danger/10 text-danger',
}

/**
 * The kitchen path, in order. `next` drives the primary button so staff always
 * have one obvious action; the rest stay available as secondary steps because
 * real service skips stages (an order can be handed over straight from the
 * counter) and mistakes need walking back.
 */
const FLOW = ['NEW', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'] as const

const FILTERS = [
  { key: 'OPEN', label: 'Offen', Icon: Clock },
  { key: 'NEW', label: 'Neu', Icon: ShoppingBag },
  { key: 'PREPARING', label: 'In Zubereitung', Icon: ChefHat },
  { key: 'READY_FOR_PICKUP', label: 'Abholbereit', Icon: PackageCheck },
  { key: 'COMPLETED', label: 'Abgeholt', Icon: BadgeEuro },
  { key: 'CANCELLED', label: 'Storniert', Icon: XCircle },
  { key: 'ALL', label: 'Alle', Icon: Search },
] as const

const euro = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })

export function OrdersBoard({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const [filter, setFilter] = useState<string>('OPEN')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length, OPEN: 0 }
    for (const o of orders) {
      c[o.status] = (c[o.status] ?? 0) + 1
      if (o.status !== 'COMPLETED' && o.status !== 'CANCELLED') c.OPEN += 1
    }
    return c
  }, [orders])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const byStatus =
        filter === 'ALL'
          ? true
          : filter === 'OPEN'
            ? o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
            : o.status === filter
      if (!byStatus) return false
      if (!q) return true
      return (
        o.code.toLowerCase().includes(q) ||
        o.guestName.toLowerCase().includes(q) ||
        o.guestPhone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
      )
    })
  }, [orders, filter, query])

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + o.totalCents, 0),
    [orders],
  )

  const post = async (order: AdminOrder, status: string, paymentStatus?: string) => {
    setBusyId(order.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status, ...(paymentStatus ? { paymentStatus } : {}) }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Aktion fehlgeschlagen.')
        return
      }
      // Re-read from the server rather than assuming the write landed.
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
            Bestellungen
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {counts.OPEN} offen · {counts.COMPLETED ?? 0} abgeholt · Umsatz abgeholt{' '}
            {euro(revenue)}
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
            placeholder="Code, Name oder Telefon"
            className="h-10 w-[260px] rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, Icon }) => (
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
              <Icon className="h-3.5 w-3.5" aria-hidden />
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
          Keine Bestellungen in dieser Ansicht.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 xl:grid-cols-2">
          {visible.map((o) => {
            const step = FLOW.indexOf(o.status as (typeof FLOW)[number])
            const next = step >= 0 && step < FLOW.length - 1 ? FLOW[step + 1] : null
            const closed = o.status === 'COMPLETED' || o.status === 'CANCELLED'

            return (
              <li key={o.id} className="card-lux p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg text-gold-light">{o.code}</span>
                      <span
                        className={cn(
                          'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                          STATUS_STYLE[o.status] ?? 'border-white/20 text-muted',
                        )}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span
                        className={cn(
                          'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                          o.paymentStatus === 'PAID'
                            ? 'border-success/50 text-success'
                            : 'border-danger/40 text-danger',
                        )}
                      >
                        {o.paymentStatus === 'PAID'
                          ? 'Bezahlt'
                          : o.paymentStatus === 'REFUNDED'
                            ? 'Erstattet'
                            : 'Unbezahlt'}
                      </span>
                    </p>

                    <p className="mt-1.5 text-[13.5px] text-cream">
                      {o.guestName} · Abholung {dateTime(o.pickupAt)}
                    </p>
                    <p className="text-[12px] text-muted">Eingegangen {dateTime(o.createdAt)}</p>
                  </div>

                  <div className="text-right">
                    <span className="block font-display text-xl text-gold-light">
                      {euro(o.totalCents)}
                    </span>
                    <a
                      href={`tel:${o.guestPhone.replace(/\s/g, '')}`}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-gold/40 px-2.5 py-1 text-[12px] text-gold hover:bg-gold/10"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      {o.guestPhone}
                    </a>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 border-t border-gold/12 pt-3">
                  {o.items.map((i, idx) => (
                    <li
                      key={`${o.id}-${idx}`}
                      className="flex items-baseline justify-between gap-3 text-[13px]"
                    >
                      <span className="text-cream/85">
                        <span className="mr-1.5 tabular-nums text-gold">{i.quantity}×</span>
                        {i.name}
                        {i.notes && <span className="ml-1.5 text-[12px] text-muted">({i.notes})</span>}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {euro(i.unitPriceCents * i.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {o.notes && (
                  <p className="mt-2 rounded-md border border-gold/20 bg-black/25 px-3 py-2 text-[12.5px] text-cream/80">
                    {o.notes}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold/12 pt-3">
                  {next && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() =>
                        // Handing the food over is when the guest pays at the
                        // counter, so that one click records both facts.
                        post(o, next, next === 'COMPLETED' ? 'PAID' : undefined)
                      }
                      className="fx-press rounded-md border border-gold/50 bg-gold/12 px-3 py-1.5 text-[12.5px] text-gold-light disabled:opacity-40"
                    >
                      → {STATUS_LABEL[next]}
                    </button>
                  )}

                  {FLOW.filter((s) => s !== o.status && s !== next).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => post(o, s, s === 'COMPLETED' ? 'PAID' : undefined)}
                      className="fx-press rounded-md border border-gold/20 px-2.5 py-1 text-[12px] text-cream/70 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40"
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}

                  {!closed && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => post(o, 'CANCELLED')}
                      className="fx-press rounded-md border border-danger/35 px-2.5 py-1 text-[12px] text-danger/85 transition-colors hover:bg-danger/10 disabled:opacity-40"
                    >
                      Stornieren
                    </button>
                  )}

                  {o.status === 'COMPLETED' && o.paymentStatus !== 'PAID' && (
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => post(o, o.status, 'PAID')}
                      className="fx-press rounded-md border border-success/40 px-2.5 py-1 text-[12px] text-success disabled:opacity-40"
                    >
                      Als bezahlt markieren
                    </button>
                  )}

                  {busyId === o.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">Aktualisiere…</p>}
    </>
  )
}
