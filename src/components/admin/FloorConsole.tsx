'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, CalendarRange, LayoutGrid, Radio, UserPlus } from 'lucide-react'

import type { DatedBooking, FloorTable } from '@/lib/floor'
import { useFloorStream } from '@/hooks/useFloorStream'
import { useServerClock } from '@/hooks/useCountdown'
import { fill } from '@/i18n/admin'
import { cn, formatPrice } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, ErrorNote } from '@/components/admin/primitives'
import { FloorPlan, TableActions, deriveState, justFreedTables } from '@/components/admin/FloorPlan'
import { TerminPanel } from '@/components/admin/TerminPanel'

export type FloorOrder = {
  id: string
  code: string
  guestName: string
  status: string
  pickupAtIso: string
  totalCents: number
  paymentStatus: string
  itemCount: number
}

type Tab = 'tables' | 'termin' | 'month'

export function FloorConsole({
  tables,
  today,
  pending,
  orders,
  month,
  serverNowIso,
}: {
  tables: FloorTable[]
  today: DatedBooking[]
  pending: DatedBooking[]
  orders: FloorOrder[]
  month: DatedBooking[]
  serverNowIso: string
}) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('tables')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const action = useAdminAction('/api/admin/tables')
  const nowMs = useServerClock(serverNowIso)

  // A push tells us the floor moved; the server components re-read and the map
  // redraws from the database rather than from a guess about what changed.
  const stream = useFloorStream(() => startTransition(() => router.refresh()))

  const selected = useMemo(
    () => tables.find((tb) => tb.id === selectedId) ?? null,
    [tables, selectedId],
  )

  const freed = justFreedTables(tables, nowMs)

  // One pass, one derivation per table: the summary counts, the banner and the
  // tiles all have to agree, and re-deriving per counter is how they drift.
  const states = tables.map((tb) => deriveState(tb, nowMs))
  const free = states.filter((s) => s === 'free' || s === 'justFreed').length
  const busy = states.filter((s) => s === 'occupied' || s === 'arriving' || s === 'overdue').length
  const overdue = states.filter((s) => s === 'overdue').length

  const clock = (iso: string) =>
    new Date(iso).toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit' })
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(intl, { day: '2-digit', month: 'short' })

  /**
   * The one-tap control on each tile.
   *
   * Seating sends no duration, so the server applies the house default. A
   * member of staff who needs a different one picks it in the side panel; the
   * tile stays a single decision, which is the only reason it gets used.
   */
  const toggleBusy = (table: FloorTable) => {
    const state = deriveState(table, nowMs)
    const isBusy = state === 'occupied' || state === 'arriving' || state === 'overdue'
    void action.run(table.id, {
      tableId: table.id,
      action: isBusy ? 'free' : 'seat',
    })
  }

  const TABS: { key: Tab; label: string; Icon: typeof LayoutGrid; badge?: number }[] = [
    { key: 'tables', label: t.floor.tabs.tables, Icon: LayoutGrid },
    { key: 'termin', label: t.floor.tabs.termin, Icon: UserPlus, badge: pending.length },
    { key: 'month', label: t.floor.tabs.month, Icon: CalendarRange },
  ]

  return (
    <>
      <BoardHeader
        title={t.floor.title}
        summary={fill(t.tables.summary, { total: tables.length, free, busy })}
      >
        <span
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]',
            stream === 'live'
              ? 'border-success/50 bg-success/10 text-success'
              : 'border-white/20 text-muted',
          )}
        >
          <Radio className={cn('h-3 w-3', stream === 'live' && 'animate-blink')} aria-hidden />
          {stream === 'live' ? t.floor.live.on : t.floor.live.off}
        </span>
      </BoardHeader>

      {/* The news of the moment: a table that has just come free, and any that
          are past the time they were expected to turn over. Both decay on the
          ticking clock rather than on the next reload. */}
      {(freed.length > 0 || overdue > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {freed.length > 0 && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-lg border border-success/45 bg-success/10 px-3 py-2 text-[13px] text-success"
            >
              <BellRing className="h-4 w-4 animate-blink" aria-hidden />
              {fill(t.floor.freed.notice, {
                tables: freed.map((tb) => tb.number).join(', '),
              })}
            </p>
          )}
          {overdue > 0 && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-lg border border-danger/45 bg-danger/10 px-3 py-2 text-[13px] text-danger"
            >
              {fill(t.floor.overdueNotice, { count: overdue })}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2 border-b border-gold/15">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 border-b-2 px-3 pb-2 pt-1 text-[13px] transition-colors',
              tab === key
                ? 'border-gold text-gold-light'
                : 'border-transparent text-muted hover:text-gold',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {badge ? (
              <span className="rounded-full bg-gold/20 px-1.5 text-[10.5px] tabular-nums text-gold-light">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <ErrorNote message={action.error} />

      {tab === 'tables' && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <FloorPlan
              tables={tables}
              serverNowIso={serverNowIso}
              selectedId={selectedId}
              busyId={action.busyId}
              onSelect={setSelectedId}
              onToggleBusy={toggleBusy}
            />

            <div className="card-lux p-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-luxe text-gold/85">
                {t.floor.today.title}
              </h2>
              {today.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted">{t.floor.today.empty}</p>
              ) : (
                <ul className="mt-2 divide-y divide-gold/10">
                  {today.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 py-2 text-[12.5px]">
                      <span className="w-[46px] shrink-0 font-mono tabular-nums text-gold-light">
                        {clock(b.startsAtIso)}
                      </span>
                      <span className="w-[52px] shrink-0 text-muted">
                        {t.floor.tableShort}
                        {b.tableNumber}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-cream/85">{b.guestName}</span>
                      <span className="shrink-0 text-muted">{b.partySize}</span>
                      <span className="shrink-0 text-[11px] text-muted">
                        {t.reservations.status[b.status as keyof typeof t.reservations.status] ??
                          b.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <TableActions
            table={selected}
            serverNowIso={serverNowIso}
            busy={action.busyId !== null}
            onAction={(body) => void action.run(String(body.tableId), body)}
          />
        </div>
      )}

      {tab === 'termin' && (
        <div className="mt-4">
          <TerminPanel tables={tables} pending={pending} serverNowIso={serverNowIso} />
        </div>
      )}

      {tab === 'month' && (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="card-lux p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-luxe text-gold/85">
              {t.floor.month.orders}
            </h2>
            {orders.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">{t.floor.month.empty}</p>
            ) : (
              <ul className="mt-2 divide-y divide-gold/10">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2 text-[12.5px]">
                    <span className="w-[74px] shrink-0 font-mono tabular-nums text-gold-light">
                      {day(o.pickupAtIso)} {clock(o.pickupAtIso)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-cream/85">{o.guestName}</span>
                    <span className="shrink-0 text-muted">
                      {o.itemCount}× · {formatPrice(o.totalCents)}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted">
                      {t.orders.status[o.status as keyof typeof t.orders.status] ?? o.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-lux p-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-luxe text-gold/85">
              {t.floor.month.reservations}
            </h2>
            {month.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">{t.floor.month.empty}</p>
            ) : (
              <ul className="mt-2 divide-y divide-gold/10">
                {month.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-2 text-[12.5px]">
                    <span className="w-[74px] shrink-0 font-mono tabular-nums text-gold-light">
                      {day(b.startsAtIso)} {clock(b.startsAtIso)}
                    </span>
                    <span className="w-[52px] shrink-0 text-muted">
                      {t.floor.tableShort}
                      {b.tableNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-cream/85">{b.guestName}</span>
                    <span className="shrink-0 text-muted">{b.partySize}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
