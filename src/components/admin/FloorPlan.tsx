'use client'

import { useMemo } from 'react'
import { Clock, Lock, LockOpen, LogIn, LogOut, Users } from 'lucide-react'

import type { FloorTable } from '@/lib/floor'
import { DEFAULT_BUSY_MINUTES, JUST_ARRIVED_MINUTES, JUST_FREED_MINUTES } from '@/lib/floor'
import { useServerClock } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { TableGraphic } from '@/components/reservation/TableGraphic'

/**
 * The states a floor manager needs to tell apart at a glance.
 *
 * Checked top to bottom, first match wins. Order encodes urgency, not tidiness:
 * a locked table that also has a booking on it is locked, because showing it as
 * reserved would invite someone to seat a party there; an overdue table beats a
 * merely occupied one because it is the one that needs a decision.
 */
export type TableState =
  | 'locked'
  | 'overdue'
  | 'arriving'
  | 'occupied'
  | 'reserved'
  | 'justFreed'
  | 'free'

/**
 * Ring colour per state, applied to the tile around the table drawing.
 *
 * The drawing is the same one the guests see, so the console and the dining
 * room are never two different pictures of the same twelve tables. What differs
 * is everything around it: no wooden floor, no foliage, no pulsing "call to
 * book" marker — this screen is read at a glance across a busy room, so it says
 * the status in a colour and a word and stops there.
 */
const STATE_RING: Record<TableState, string> = {
  free: 'ring-success/45',
  justFreed: 'ring-success ring-[3px]',
  reserved: 'ring-gold/55',
  arriving: 'ring-warning/75',
  occupied: 'ring-danger/55',
  overdue: 'ring-danger ring-[3px]',
  locked: 'ring-white/20',
}

const STATE_TEXT: Record<TableState, string> = {
  free: 'text-success',
  justFreed: 'text-success',
  reserved: 'text-gold-light',
  arriving: 'text-warning',
  occupied: 'text-danger',
  overdue: 'text-danger',
  locked: 'text-muted',
}

const STATE_DOT: Record<TableState, string> = {
  free: 'bg-success',
  justFreed: 'bg-success',
  reserved: 'bg-gold',
  arriving: 'bg-warning',
  occupied: 'bg-danger',
  overdue: 'bg-danger',
  locked: 'bg-white/40',
}

/** Badge treatment for the selected table's status chip. */
const STATE_BADGE: Record<TableState, string> = {
  free: 'border-success/50 bg-success/10 text-success',
  justFreed: 'border-success bg-success/15 text-success',
  reserved: 'border-gold/50 bg-gold/10 text-gold-light',
  arriving: 'border-warning/60 bg-warning/15 text-warning',
  occupied: 'border-danger/50 bg-danger/10 text-danger',
  overdue: 'border-danger bg-danger/20 text-danger',
  locked: 'border-white/25 bg-white/[0.06] text-muted',
}

/** The states that should catch an eye that is not looking at the screen. */
const STATE_BLINKS: Partial<Record<TableState, boolean>> = {
  justFreed: true,
  arriving: true,
  overdue: true,
}

export const STATE_ORDER: TableState[] = [
  'free',
  'justFreed',
  'reserved',
  'arriving',
  'occupied',
  'overdue',
  'locked',
]

/** How the guest floor plan tints the same drawing, kept in step by state. */
function graphicTone(state: TableState): 'default' | 'busy' | 'pending' | 'selected' {
  if (state === 'occupied' || state === 'overdue' || state === 'arriving') return 'busy'
  if (state === 'reserved') return 'pending'
  return 'default'
}

/**
 * Derive the display state from the table and the current time.
 *
 * Takes `nowMs` rather than reading the clock itself: every one of these
 * decisions decays while the page sits open, and a page that only tells the
 * truth immediately after a reload is worse than no page — staff would trust it.
 */
export function deriveState(table: FloorTable, nowMs: number): TableState {
  const manuallyLocked = table.status === 'BLOCKED' || table.status === 'MAINTENANCE'
  const lockEnds = table.blockedToIso ? new Date(table.blockedToIso).getTime() : null
  // No end date means an open-ended lock, which holds until someone clears it.
  if (manuallyLocked && (lockEnds === null || lockEnds > nowMs)) return 'locked'

  const occupied = table.status === 'OCCUPIED' || table.current?.status === 'SEATED'

  if (occupied) {
    const seatedAt = table.current?.seatedAtIso
      ? new Date(table.current.seatedAtIso).getTime()
      : null
    if (seatedAt !== null && nowMs - seatedAt < JUST_ARRIVED_MINUTES * 60_000) return 'arriving'

    const busyUntil = table.busyUntilIso ? new Date(table.busyUntilIso).getTime() : null
    if (busyUntil !== null && busyUntil <= nowMs) return 'overdue'
    return 'occupied'
  }

  if (table.current || table.status === 'RESERVED' || table.status === 'PENDING') return 'reserved'

  const freedAt = table.freedAtIso ? new Date(table.freedAtIso).getTime() : null
  if (freedAt !== null && nowMs - freedAt < JUST_FREED_MINUTES * 60_000) return 'justFreed'

  return 'free'
}

/** Tables handed back within the notice window, most recent first. */
export function justFreedTables(tables: FloorTable[], nowMs: number): FloorTable[] {
  return tables
    .filter((tb) => deriveState(tb, nowMs) === 'justFreed')
    .sort((a, b) => (b.freedAtIso ?? '').localeCompare(a.freedAtIso ?? ''))
}

/**
 * Remaining time, at the resolution that is actually useful.
 *
 * A three-hour seating counted in `mm:ss` reads as `179:59` — a number nobody
 * parses mid-service. Over an hour it becomes `2:59` hours-and-minutes; under
 * one it drops to `59:31`, where the seconds start to mean something.
 */
export function formatLeft(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}

function clock(iso: string, intl: string) {
  return new Date(iso).toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit' })
}

/** The deadline a tile counts down to, if it has one. */
function deadline(table: FloorTable, state: TableState): number | null {
  if (state === 'locked') {
    return table.blockedToIso ? new Date(table.blockedToIso).getTime() : null
  }
  if (state === 'occupied' || state === 'arriving' || state === 'overdue') {
    return table.busyUntilIso ? new Date(table.busyUntilIso).getTime() : null
  }
  return null
}

/**
 * One table on the map: the guests' own drawing, plus the one control staff
 * reach for most.
 *
 * The busy/free toggle sits on the tile rather than only in the side panel
 * because that is the whole job — someone walks past, sees a table fill up, and
 * marks it. Making that two taps and a panel would mean it stops happening on a
 * busy night, and a floor map nobody updates is worse than none.
 */
function TableTile({
  table,
  state,
  nowMs,
  selected,
  busy,
  onSelect,
  onToggleBusy,
}: {
  table: FloorTable
  state: TableState
  nowMs: number
  selected: boolean
  busy: boolean
  onSelect: (id: string) => void
  onToggleBusy: (table: FloorTable) => void
}) {
  const { t, intl } = useAdminI18n()

  const ends = deadline(table, state)
  const isBusy = state === 'occupied' || state === 'arriving' || state === 'overdue'

  return (
    <li className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => onSelect(table.id)}
        aria-label={`${t.tables.title} ${table.number}, ${table.capacity} ${t.tables.capacity}, ${t.floor.state[state]}`}
        className={cn(
          'fx-press group relative aspect-square w-full rounded-2xl p-1 ring-2 transition-all duration-300',
          STATE_RING[state],
          STATE_BLINKS[state] && 'animate-blink',
          selected && 'ring-gold shadow-gold-lg',
          !table.isActive && 'opacity-40',
        )}
      >
        <TableGraphic
          shape={table.shape}
          capacity={table.capacity}
          tone={selected ? 'selected' : graphicTone(state)}
          occupied={isBusy}
        />

        {/* The table number, on its own solid chip.
            Painted over the drawing it was almost unreadable: the numeral took
            the state colour, and green-on-dark-wood at this size disappeared
            into the tabletop and the candle behind it. The number is the one
            thing on this tile staff say out loud, so it gets a background of
            its own rather than borrowing the plate's. */}
        <span className="pointer-events-none absolute left-1 top-1 z-10 grid h-[20px] min-w-[20px] place-items-center rounded-md border border-cream/25 bg-black/80 px-1 font-mono text-[12px] font-bold leading-none tabular-nums text-cream">
          {table.number}
        </span>

        <span className="pointer-events-none absolute bottom-1 right-1 z-10 inline-flex items-center gap-0.5 rounded bg-black/70 px-1 py-[1px] text-[9px] font-medium leading-none text-cream/70">
          <Users className="h-2 w-2" aria-hidden />
          {table.capacity}
        </span>

        {/* Countdown, or how long a table has been overdue. Both are the same
            question — is this table about to turn over — so they share a slot. */}
        {ends !== null && (
          <span className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
            <span
              className={cn(
                'inline-flex items-center rounded-[3px] border bg-black/80 px-1.5 py-[2px] font-mono text-[11px] font-bold leading-none tabular-nums',
                state === 'overdue'
                  ? 'border-danger bg-danger/25 text-danger'
                  : state === 'locked'
                    ? 'border-white/30 text-cream/75'
                    : 'border-danger/55 text-danger',
              )}
            >
              {state === 'overdue' && '+'}
              {formatLeft(Math.abs(ends - nowMs))}
            </span>
          </span>
        )}

        {/* A booking later today on a table that is free right now. Staff need
            to know a free table is spoken for at 19:00 before seating a walk-in. */}
        {ends === null && table.upcoming.length > 0 && (
          <span className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-[3px] border border-gold/40 bg-black/75 px-1.5 py-[2px] text-[10px] leading-none text-gold-light">
              <Clock className="h-2.5 w-2.5" aria-hidden />
              {clock(table.upcoming[0].startsAtIso, intl)}
            </span>
          </span>
        )}
      </button>

      {/* The label is a verb, and only a verb.
          It used to read "Besetzt" / "Frei" — the names of the states — which
          put the word for "free" under a table that was busy and vice versa,
          because a button says what it does, not what is. Next to a coloured
          status dot it was a coin-flip which of the two the reader took it
          for. The dot is gone as well: the ring around the tile already says
          the state, and the only job left for this control is the change. */}
      <button
        type="button"
        disabled={busy || state === 'locked'}
        onClick={() => onToggleBusy(table)}
        className={cn(
          'fx-press flex w-full items-center justify-center gap-1 rounded-md border px-1 py-1 text-[11.5px] transition-colors disabled:opacity-40',
          isBusy
            ? 'border-success/50 bg-success/10 text-success hover:bg-success/20'
            : 'border-danger/45 bg-danger/10 text-danger hover:bg-danger/20',
        )}
      >
        {isBusy ? (
          <LogOut className="h-3 w-3" aria-hidden />
        ) : (
          <LogIn className="h-3 w-3" aria-hidden />
        )}
        {isBusy ? t.floor.actions.markFree : t.floor.actions.markBusy}
      </button>
    </li>
  )
}

export function FloorPlan({
  tables,
  serverNowIso,
  selectedId,
  busyId,
  onSelect,
  onToggleBusy,
}: {
  tables: FloorTable[]
  serverNowIso: string
  selectedId: string | null
  busyId: string | null
  onSelect: (id: string) => void
  onToggleBusy: (table: FloorTable) => void
}) {
  const { t } = useAdminI18n()
  const nowMs = useServerClock(serverNowIso)

  // Derived from the data, not hard-coded to 3x4: the floor plan is editable
  // and a fixed grid would silently drop a table added in row four.
  const rows = useMemo(() => {
    const max = tables.reduce((m, tb) => Math.max(m, tb.gridRow), 1)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [tables])

  const cols = useMemo(() => tables.reduce((m, tb) => Math.max(m, tb.gridCol), 1), [tables])

  return (
    // Capped rather than filling the column. At full width on a desk monitor
    // each table was drawn the size of a playing card, which reads as a feature
    // demanding attention; the plan is a reference the manager glances at, and
    // a glance wants the whole room in one fixation.
    <div className="w-full max-w-[560px] rounded-xl border border-gold/20 bg-black/25 p-3">
      <ul className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]">
        {STATE_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', STATE_DOT[s])} aria-hidden />
            <span className="text-cream/75">{t.floor.state[s]}</span>
          </li>
        ))}
      </ul>

      <div role="radiogroup" aria-label={t.floor.title} className="space-y-2">
        {rows.map((row) => (
          <ul
            key={row}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {tables
              .filter((tb) => tb.gridRow === row)
              .sort((a, b) => a.gridCol - b.gridCol)
              .map((tb) => (
                <TableTile
                  key={tb.id}
                  table={tb}
                  state={deriveState(tb, nowMs)}
                  nowMs={nowMs}
                  selected={tb.id === selectedId}
                  busy={busyId === tb.id}
                  onSelect={onSelect}
                  onToggleBusy={onToggleBusy}
                />
              ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/** Lock presets, in minutes. `null` is an open-ended lock with no countdown. */
const LOCK_PRESETS: (number | null)[] = [15, 30, 60, null]

/** Seating presets, in minutes. The middle one is the house default. */
const BUSY_PRESETS = [60, 120, DEFAULT_BUSY_MINUTES] as const

export function TableActions({
  table,
  serverNowIso,
  busy,
  onAction,
}: {
  table: FloorTable | null
  serverNowIso: string
  busy: boolean
  onAction: (body: Record<string, unknown>) => void
}) {
  const { t, intl } = useAdminI18n()
  const nowMs = useServerClock(serverNowIso)

  if (!table) {
    return (
      <div className="card-lux grid min-h-[220px] place-items-center p-5 text-center text-[13px] text-muted">
        {t.floor.selectHint}
      </div>
    )
  }

  const state = deriveState(table, nowMs)
  const locked = state === 'locked'
  const ends = deadline(table, state)

  return (
    <div className="card-lux p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[19px] text-gold-light">
            {t.tables.title} {table.number}
          </p>
          <p className="text-[12px] text-muted">
            {table.capacity} {t.tables.capacity}
            {table.zone ? ` · ${table.zone}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'rounded border px-2 py-0.5 text-[10px] uppercase tracking-luxe',
            STATE_BADGE[state],
          )}
        >
          {t.floor.state[state]}
        </span>
      </div>

      {ends !== null && (
        <p
          className={cn(
            'mt-3 rounded-md border px-2.5 py-1.5 text-[12px]',
            state === 'overdue'
              ? 'border-danger/50 bg-danger/10 text-danger'
              : 'border-white/15 bg-black/30 text-cream/80',
          )}
        >
          {state === 'overdue'
            ? t.floor.overdueBy
            : locked
              ? t.floor.unlocksIn
              : t.floor.freesUpIn}{' '}
          <span className="font-mono tabular-nums">{formatLeft(Math.abs(ends - nowMs))}</span>
        </p>
      )}

      {table.current && (
        <div className="mt-3 rounded-md border border-gold/25 bg-black/30 px-2.5 py-2 text-[12.5px]">
          <p className="text-gold-light">{table.current.guestName}</p>
          <p className="text-muted">
            {table.current.partySize} · {clock(table.current.startsAtIso, intl)}–
            {clock(table.current.endsAtIso, intl)} · {table.current.code}
          </p>
          {table.current.guestPhone && (
            <a href={`tel:${table.current.guestPhone}`} className="text-cream/80 hover:text-gold">
              {table.current.guestPhone}
            </a>
          )}
        </div>
      )}

      {table.upcoming.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[10.5px] uppercase tracking-luxe text-gold/70">{t.floor.laterToday}</p>
          {table.upcoming.slice(0, 3).map((b) => (
            <p key={b.id} className="text-[12px] text-muted">
              {clock(b.startsAtIso, intl)} · {b.guestName} · {b.partySize}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1.5 text-[10.5px] uppercase tracking-luxe text-gold/70">
          {t.floor.busyFor}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BUSY_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => onAction({ tableId: table.id, action: 'seat', minutes: m })}
              className="fx-press flex items-center gap-1 rounded-md border border-danger/45 bg-danger/10 px-2.5 py-1.5 text-[12px] text-danger transition-colors hover:bg-danger/20 disabled:opacity-40"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              {m >= 60 ? `${m / 60}h` : `${m}′`}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction({ tableId: table.id, action: 'free' })}
            className="fx-press flex items-center gap-1.5 rounded-md border border-success/45 bg-success/10 px-2.5 py-1.5 text-[12px] text-success transition-colors hover:bg-success/20 disabled:opacity-40"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {t.floor.actions.free}
          </button>
        </div>
      </div>

      <div className="mt-2 border-t border-gold/12 pt-2">
        <p className="mb-1.5 text-[10.5px] uppercase tracking-luxe text-gold/70">
          {locked ? t.floor.actions.unlock : t.floor.actions.lock}
        </p>
        {locked ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction({ tableId: table.id, action: 'unlock' })}
            className="fx-press flex w-full items-center justify-center gap-1.5 rounded-md border border-gold/45 bg-gold/10 px-2 py-2 text-[12px] text-gold-light transition-colors hover:bg-gold/20 disabled:opacity-40"
          >
            <LockOpen className="h-3.5 w-3.5" aria-hidden />
            {t.floor.actions.unlock}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {LOCK_PRESETS.map((m) => (
              <button
                key={String(m)}
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction({
                    tableId: table.id,
                    action: 'lock',
                    ...(m ? { minutes: m } : {}),
                  })
                }
                className="fx-press flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-[12px] text-cream/75 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
              >
                <Lock className="h-3 w-3" aria-hidden />
                {m ? `${m}′` : t.floor.actions.openEnded}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 flex items-start gap-1.5 border-t border-gold/12 pt-2 text-[11px] leading-snug text-muted">
        <Users className="mt-0.5 h-3 w-3 shrink-0 text-gold/70" aria-hidden />
        {t.floor.publicHint}
      </p>
    </div>
  )
}
