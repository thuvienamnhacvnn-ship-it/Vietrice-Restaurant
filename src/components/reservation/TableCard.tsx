'use client'

import { CheckCircle2, Clock, Lock, Wrench } from 'lucide-react'

import { useCountdown } from '@/hooks/useCountdown'
import { isSelectable, type TableView } from '@/lib/reservation'
import { cn } from '@/lib/utils'
import { TableGraphic } from './TableGraphic'

/** Live remaining time for a busy table, anchored to server time. */
function BusyCountdown({ untilIso, serverNowIso }: { untilIso: string; serverNowIso: string }) {
  const c = useCountdown(untilIso, serverNowIso)
  if (c.expired) return <span className="tabular-nums">00:00</span>
  const totalMinutes = c.days * 24 * 60 + c.hours * 60 + c.minutes
  return (
    <span className="tabular-nums">
      {String(totalMinutes).padStart(2, '0')}:{String(c.seconds).padStart(2, '0')}
    </span>
  )
}

const STATUS_RING: Record<TableView['status'], string> = {
  AVAILABLE: 'ring-transparent hover:ring-gold/70',
  PENDING: 'ring-warning/60',
  RESERVED: 'ring-warning/60',
  OCCUPIED: 'ring-danger/65',
  BLOCKED: 'ring-white/20',
  MAINTENANCE: 'ring-white/20',
}

function graphicTone(status: TableView['status'], selected: boolean) {
  if (selected) return 'selected' as const
  if (status === 'OCCUPIED') return 'busy' as const
  if (status === 'PENDING' || status === 'RESERVED') return 'pending' as const
  return 'default' as const
}

/**
 * One table on the floor plan. Renders as a radio-style button so the whole map
 * is keyboard navigable; unavailable tables are disabled rather than hidden so
 * their state stays legible to screen readers.
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
  labels: { available: string; occupied: string; pending: string; blocked: string; seats: string; tooSmall: string }
}) {
  const selectable = isSelectable(table, partySize)
  const tooSmall = table.status === 'AVAILABLE' && partySize > table.capacity

  const statusLabel =
    table.status === 'AVAILABLE'
      ? tooSmall
        ? labels.tooSmall
        : labels.available
      : table.status === 'OCCUPIED'
        ? labels.occupied
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
      aria-label={`Tisch ${table.number}, ${table.capacity} ${labels.seats}, ${statusLabel}`}
      className={cn(
        'fx-press group relative aspect-square w-full rounded-2xl p-1 ring-2 transition-all duration-300',
        STATUS_RING[table.status],
        selected && 'ring-gold shadow-gold-lg',
        selectable ? 'cursor-pointer' : 'cursor-not-allowed',
        table.status === 'BLOCKED' || table.status === 'MAINTENANCE' ? 'opacity-55' : '',
        tooSmall && 'opacity-45',
      )}
    >
      {/* Top-down table drawing — chairs and covers scale with capacity. */}
      <TableGraphic
        shape={table.shape}
        capacity={table.capacity}
        tone={graphicTone(table.status, selected)}
        className={cn(
          'transition-transform duration-300',
          selectable && 'group-hover:scale-[1.04]',
        )}
      />

      {/* Table number, centred on the wood */}
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[26px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
          table.status === 'OCCUPIED' ? 'text-danger' : selected ? 'text-gold-light' : 'text-cream',
        )}
      >
        {table.number}
      </span>

      {/* Status badge, bottom-right of the table shape */}
      <span
        className={cn(
          'absolute bottom-2 right-2 grid place-items-center rounded-full',
          table.status === 'AVAILABLE' && !tooSmall && 'h-8 w-8 bg-success text-white shadow-[0_2px_10px_rgba(0,0,0,0.7)]',
          table.status === 'PENDING' && 'h-6 w-6 border border-warning/60 bg-warning/20 text-warning',
          (table.status === 'BLOCKED' || table.status === 'MAINTENANCE') &&
            'h-6 w-6 border border-white/20 bg-white/10 text-muted',
        )}
      >
        {table.status === 'AVAILABLE' && !tooSmall && (
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        )}
        {table.status === 'PENDING' && <Lock className="h-3.5 w-3.5" aria-hidden />}
        {table.status === 'MAINTENANCE' && <Wrench className="h-3.5 w-3.5" aria-hidden />}
      </span>

      {/* Occupied tables show a live countdown instead of a badge */}
      {table.status === 'OCCUPIED' && table.busyUntilIso && (
        <span className="pointer-events-none absolute inset-x-0 top-[61%] flex items-center justify-center gap-1 text-[12px] font-semibold tabular-nums text-danger drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
          <Clock className="h-3 w-3" aria-hidden />
          <BusyCountdown untilIso={table.busyUntilIso} serverNowIso={serverNowIso} />
        </span>
      )}

      {(table.status === 'PENDING' || table.status === 'RESERVED') && (
        <span className="pointer-events-none absolute inset-x-0 top-[74%] text-center text-[10px] font-semibold uppercase tracking-wide text-warning drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
          {labels.pending}
        </span>
      )}
    </button>
  )
}
