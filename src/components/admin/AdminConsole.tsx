'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CalendarClock, Clock, Loader2, ShoppingBag, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import { AdminShell, type AdminShellProps } from '@/components/admin/AdminShell'
import { useAdminI18n } from '@/components/admin/AdminI18n'

type Reservation = {
  id: string
  code: string
  guestName: string
  partySize: number
  tableNumber: number
  startsAt: string
  status: string
}

type Table = { id: string; number: number; capacity: number; status: string }

type Order = {
  id: string
  code: string
  guestName: string
  pickupAt: string
  status: string
  totalCents: number
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

const ORDER_STATUS: Record<string, string> = {
  NEW: 'border-warning/50 bg-warning/10 text-warning',
  CONFIRMED: 'border-gold/50 bg-gold/10 text-gold-light',
  PREPARING: 'border-gold/50 bg-gold/10 text-gold-light',
  READY_FOR_PICKUP: 'border-success/50 bg-success/10 text-success',
}

const TABLE_STATES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE'] as const

const TABLE_STYLE: Record<string, string> = {
  AVAILABLE: 'border-success/50 bg-success/10 text-success',
  PENDING: 'border-warning/50 bg-warning/10 text-warning',
  RESERVED: 'border-gold/50 bg-gold/10 text-gold-light',
  OCCUPIED: 'border-danger/50 bg-danger/10 text-danger',
  BLOCKED: 'border-white/20 bg-white/5 text-muted',
  MAINTENANCE: 'border-white/20 bg-white/5 text-muted',
}


type ConsoleProps = {
  stats: { pending: number; today: number; unread: number; tables: number; openOrders: number }
  reservations: Reservation[]
  tables: Table[]
  orders: Order[]
}

export function AdminConsole({
  stats,
  reservations,
  tables,
  orders,
  ...shell
}: ConsoleProps & Omit<AdminShellProps, 'children' | 'unread' | 'badges'>) {
  return (
    <AdminShell
      {...shell}
      unread={stats.unread}
      badges={{ '/admin/orders': stats.openOrders, '/admin/reservations': stats.pending }}
    >
      <Dashboard stats={stats} reservations={reservations} tables={tables} orders={orders} />
    </AdminShell>
  )
}

function Dashboard({ stats, reservations, tables, orders }: ConsoleProps) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit' })

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
        setError(data.error ?? t.common.error)
        return
      }
      // Re-fetch on the server so the list reflects what was actually stored,
      // rather than optimistically showing a state the database may not hold.
      startTransition(() => router.refresh())
    } catch {
      setError(t.common.error)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t.dashboard.statToday, value: stats.today, Icon: CalendarClock, href: '/admin/reservations' },
          { label: t.dashboard.statOpen, value: stats.pending, Icon: Clock, href: '/admin/reservations' },
          { label: t.dashboard.statOrders, value: stats.openOrders, Icon: ShoppingBag, href: '/admin/orders' },
          { label: t.dashboard.statTables, value: stats.tables, Icon: Users, href: '/admin/tables' },
        ].map(({ label, value, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="card-lux flex items-center gap-3 p-4 transition-colors hover:border-gold/45"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/35 text-gold">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-2xl leading-none text-cream">{value}</span>
              <span className="text-[11.5px] uppercase tracking-luxe text-muted">{label}</span>
            </span>
          </Link>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {/* ---- Next reservations ---- */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg uppercase tracking-luxe text-gold-light">
                {t.dashboard.nextUp}
              </h2>
              <Link href="/admin/reservations" className="text-[12.5px] text-gold hover:underline">
                {t.dashboard.allReservations}
              </Link>
            </div>

            {reservations.length === 0 ? (
              <p className="card-lux p-6 text-center text-[13px] text-muted">
                {t.dashboard.noReservations}
              </p>
            ) : (
              <ul className="card-lux divide-y divide-gold/10">
                {reservations.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                    <span className="font-display text-[15px] tabular-nums text-gold-light">
                      {time(r.startsAt)}
                    </span>
                    <span className="text-[13.5px] text-cream">{r.guestName}</span>
                    <span className="text-[12.5px] text-muted">
                      {t.reservations.table} {r.tableNumber} · {r.partySize} {t.reservations.persons}
                    </span>
                    <span
                      className={cn(
                        'ml-auto rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                        RES_STATUS[r.status] ?? 'border-white/20 text-muted',
                      )}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- Pickup queue ---- */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg uppercase tracking-luxe text-gold-light">
                {t.dashboard.openOrders}
              </h2>
              <Link href="/admin/orders" className="text-[12.5px] text-gold hover:underline">
                {t.dashboard.manageOrders}
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="card-lux p-6 text-center text-[13px] text-muted">
                {t.dashboard.noOrders}
              </p>
            ) : (
              <ul className="card-lux divide-y divide-gold/10">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                    <span className="font-display text-[15px] tabular-nums text-gold-light">
                      {time(o.pickupAt)}
                    </span>
                    <span className="text-[13.5px] text-cream">{o.code}</span>
                    <span className="text-[12.5px] text-muted">{o.guestName}</span>
                    <span className="text-[12.5px] tabular-nums text-gold">
                      {new Intl.NumberFormat(intl, {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(o.totalCents / 100)}
                    </span>
                    <span
                      className={cn(
                        'ml-auto rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                        ORDER_STATUS[o.status] ?? 'border-white/20 text-muted',
                      )}
                    >
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---- Floor plan control ---- */}
        <section>
          <h2 className="mb-3 font-display text-lg uppercase tracking-luxe text-gold-light">
            {t.dashboard.tableStatus}
          </h2>
          <ul className="space-y-2">
            {tables.map((table) => (
              <li key={table.id} className="card-lux p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] text-cream">
                    {t.reservations.table} {table.number}
                    <span className="ml-2 text-[12px] text-muted">
                      {table.capacity} {t.tables.capacity}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                      TABLE_STYLE[table.status] ?? 'border-white/20 text-muted',
                    )}
                  >
                    {t.tables.status[table.status as keyof typeof t.tables.status] ?? table.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TABLE_STATES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === table.id || table.status === s}
                      onClick={() => post('/api/admin/tables', { tableId: table.id, status: s }, table.id)}
                      className="fx-press rounded border border-gold/20 px-2 py-0.5 text-[11px] text-cream/70 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-35"
                    >
                      {t.tables.status[s]}
                    </button>
                  ))}
                  {busyId === table.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin self-center text-gold" aria-hidden />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {pending && (
        <p className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
          <Bell className="h-4 w-4 text-gold" aria-hidden />
          {t.common.refreshing}
        </p>
      )}
    </>
  )
}
