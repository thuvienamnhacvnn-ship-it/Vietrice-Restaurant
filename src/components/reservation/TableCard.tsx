'use client'

import { Lock, Phone, Sparkles, Wrench } from 'lucide-react'

import { JUST_FREED_MINUTES } from '@/lib/floor'
import { useCountdown, useServerClock } from '@/hooks/useCountdown'
import { isSelectable, type TableView } from '@/lib/reservation'
import { cn } from '@/lib/utils'
import { TableGraphic } from './TableGraphic'

/**
 * Remaining time on a busy table, styled as a red digital readout.
 * Anchored to server time, so a skewed browser clock cannot free a table early.
 */
function BusyCountdown({ untilIso, serverNowIso }: { untilIso: string; serverNowIso: string }) {
  const c = useCountdown(untilIso, serverNowIso)
  const totalMinutes = c.expired ? 0 : c.days * 24 * 60 + c.hours * 60 + c.minutes
  const seconds = c.expired ? 0 : c.seconds

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] border border-danger/55 bg-black/80 px-1.5 py-[2px]',
        'font-mono text-[11px] font-bold leading-none tabular-nums tracking-[0.08em] text-danger',
        'shadow-[0_0_10px_-2px_rgb(239_68_68/0.75)]',
      )}
    >
      {String(totalMinutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}

const STATUS_RING: Record<TableView['status'], string> = {
  AVAILABLE: 'ring-transparent hover:ring-gold/70',
  PENDING: 'ring-warning/55',
  RESERVED: 'ring-warning/55',
  OCCUPIED: 'ring-danger/50',
  BLOCKED: 'ring-white/15',
  MAINTENANCE: 'ring-white/15',
}

function graphicTone(status: TableView['status'], selected: boolean) {
  if (selected) return 'selected' as const
  if (status === 'OCCUPIED') return 'busy' as const
  if (status === 'PENDING' || status === 'RESERVED') return 'pending' as const
  return 'default' as const
}

/**
 * One table on the floor plan.
 *
 * Free tables render brighter with a pulsing green "call to book" marker; busy
 * ones dim, seat their guests and show a red countdown. Rendered as a radio so
 * the whole map is keyboard navigable, and unavailable tables stay in the DOM
 * (disabled) so their state remains legible to screen readers.
 */
export function TableCard({
  table,
  partySize,
  selected,
  serverNowIso,
  onSelect,
  labels,
}: {
  table: TableView
  partySize: number
  selected: boolean
  serverNowIso: string
  onSelect: (table: TableView) => void
  labels: {
    available: string
    occupied: string
    pending: string
    blocked: string
    seats: string
    /** Localised word for "table", used in the accessible name. */
    table: string
    tooSmall: string
    justFreed: string
  }
}) {
  const selectable = isSelectable(table, partySize)
  const tooSmall = table.status === 'AVAILABLE' && partySize > table.capacity
  const occupied = table.status === 'OCCUPIED'

  /**
   * A table staff handed back a moment ago.
   *
   * Derived against the ticking server clock rather than baked in at render, so
   * the flag fades on its own while the page sits open. Worth saying plainly:
   * on a floor plan where most tables are free most of the time, "free" is not
   * news and nobody reads it — "free right now, ahead of you" is, and it is the
   * one moment a guest can act on faster than anyone else.
   */
  const nowMs = useServerClock(serverNowIso)
  const freedAtMs = table.freedAtIso ? new Date(table.freedAtIso).getTime() : null
  const justFreed =
    selectable && freedAtMs !== null && nowMs - freedAtMs < JUST_FREED_MINUTES * 60_000

  const statusLabel = occupied
    ? labels.occupied
    : table.status === 'AVAILABLE'
      ? tooSmall
        ? labels.tooSmall
        : labels.available
      : table.status === 'PENDING' || table.status === 'RESERVED'
        ? labels.pending
        : labels.blocked

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!selectable}
      onClick={() => selectable && onSelect(table)}
      aria-label={`${labels.table} ${table.number}, ${table.capacity} ${labels.seats}, ${statusLabel}`}
      className={cn(
        'fx-press group relative aspect-square w-full rounded-2xl p-1 ring-2 transition-all duration-300',
        STATUS_RING[table.status],
        justFreed && !selected && 'ring-success shadow-[0_0_18px_-4px_rgb(34_197_94/0.85)]',
        selected && 'ring-gold shadow-gold-lg',
        selectable ? 'cursor-pointer' : 'cursor-not-allowed',
        // Busy tables sit back; free ones stay bright and forward.
        occupied ? 'opacity-80 saturate-[0.75]' : 'opacity-100',
        (table.status === 'BLOCKED' || table.status === 'MAINTENANCE') && 'opacity-50',
        tooSmall && 'opacity-45',
      )}
    >
      <TableGraphic
        shape={table.shape}
        capacity={table.capacity}
        tone={graphicTone(table.status, selected)}
        occupied={occupied}
        className={cn(
          'transition-transform duration-300',
          selectable && 'group-hover:scale-[1.05]',
        )}
      />

      {/* Table number */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[22px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]',
          occupied ? 'text-danger/90' : selected ? 'text-gold-light' : 'text-cream',
        )}
      >
        {table.number}
      </span>

      {/* Seat count, small and unobtrusive */}
      <span className="pointer-events-none absolute inset-x-0 top-[64%] text-center text-[9.5px] font-medium text-cream/60 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
        {table.capacity} {labels.seats}
      </span>

      {/* Just handed back by staff — the only badge that outranks the seat count */}
      {justFreed && (
        <span className="pointer-events-none absolute inset-x-1 top-1 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-success/70 bg-success/25 px-2 py-[2px] text-[9.5px] font-semibold uppercase tracking-wide text-success backdrop-blur-sm">
            <Sparkles className="h-2.5 w-2.5" aria-hidden />
            {labels.justFreed}
          </span>
        </span>
      )}

      {/* Busy: red digital countdown */}
      {occupied && table.busyUntilIso && (
        <span className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
          <BusyCountdown untilIso={table.busyUntilIso} serverNowIso={serverNowIso} />
        </span>
      )}

      {/* Free: pulsing green call marker */}
      {table.status === 'AVAILABLE' && !tooSmall && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-success/45 motion-safe:animate-ping"
          />
          <span className="relative grid h-7 w-7 place-items-center rounded-full bg-success text-white shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
            <Phone className="h-3.5 w-3.5" aria-hidden />
          </span>
        </span>
      )}

      {(table.status === 'PENDING' || table.status === 'RESERVED') && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full border border-warning/60 bg-warning/20 text-warning">
          <Lock className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}

      {table.status === 'MAINTENANCE' && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/10 text-muted">
          <Wrench className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
    </button>
  )
}
