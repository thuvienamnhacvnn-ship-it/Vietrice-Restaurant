'use client'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, Busy, ErrorNote } from '@/components/admin/primitives'

export type AdminTable = {
  id: string
  number: number
  capacity: number
  status: string
  zone: string | null
  isActive: boolean
  /** Guest name of the booking currently holding this table, if any. */
  heldBy: string | null
  heldUntil: string | null
}

const STATES = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'BLOCKED', 'MAINTENANCE'] as const

const STYLE: Record<string, string> = {
  AVAILABLE: 'border-success/50 bg-success/10 text-success',
  RESERVED: 'border-gold/50 bg-gold/10 text-gold-light',
  OCCUPIED: 'border-danger/50 bg-danger/10 text-danger',
  BLOCKED: 'border-white/20 bg-white/5 text-muted',
  MAINTENANCE: 'border-white/20 bg-white/5 text-muted',
}

export function TablesBoard({ tables }: { tables: AdminTable[] }) {
  const { t, intl } = useAdminI18n()
  const status = useAdminAction('/api/admin/tables')
  const content = useAdminAction('/api/admin/content')

  const free = tables.filter((x) => x.status === 'AVAILABLE').length
  const busy = tables.filter((x) => x.status === 'OCCUPIED' || x.status === 'RESERVED').length

  return (
    <>
      <BoardHeader
        title={t.tables.title}
        summary={fill(t.tables.summary, { total: tables.length, free, busy })}
      />

      <p className="mt-2 text-[12px] text-muted">{t.tables.activeHint}</p>

      <ErrorNote message={status.error ?? content.error} />

      <ul className="mt-5 grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
        {tables.map((table) => {
          const isBusy = status.busyId === table.id || content.busyId === table.id
          return (
            <li key={table.id} className={cn('card-lux p-3.5', !table.isActive && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[17px] text-gold-light">
                    {t.reservations.table} {table.number}
                  </p>
                  <p className="text-[12px] text-muted">
                    {table.capacity} {t.tables.capacity}
                    {table.zone ? ` · ${table.zone}` : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
                    STYLE[table.status] ?? 'border-white/20 text-muted',
                  )}
                >
                  {t.tables.status[table.status as keyof typeof t.tables.status] ?? table.status}
                </span>
              </div>

              {table.heldBy && (
                <p className="mt-2 rounded-md border border-gold/20 bg-black/25 px-2.5 py-1.5 text-[12px] text-cream/80">
                  {table.heldBy}
                  {table.heldUntil &&
                    ` · ${new Date(table.heldUntil).toLocaleTimeString(intl, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {STATES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isBusy || table.status === s}
                    onClick={() => status.run(table.id, { tableId: table.id, status: s })}
                    className="fx-press rounded border border-gold/20 px-2 py-0.5 text-[11px] text-cream/70 transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-35"
                  >
                    {t.tables.status[s]}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-gold/12 pt-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    content.run(table.id, {
                      entity: 'table',
                      id: table.id,
                      isActive: !table.isActive,
                    })
                  }
                  className={cn(
                    'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                    table.isActive
                      ? 'border-success/45 bg-success/10 text-success'
                      : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                  )}
                >
                  {table.isActive ? t.common.active : t.common.inactive}
                </button>
                <Busy show={isBusy} />
              </div>
            </li>
          )
        })}
      </ul>

      {(status.refreshing || content.refreshing) && (
        <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>
      )}
    </>
  )
}
