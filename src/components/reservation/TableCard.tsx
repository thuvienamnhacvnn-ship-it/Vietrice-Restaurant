'use client'

import { CheckCircle2, Clock, Lock, Users, Wrench } from 'lucide-react'

import { useCountdown } from '@/hooks/useCountdown'
import { isSelectable, type TableView } from '@/lib/reservation'
import { cn } from '@/lib/utils'

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

const STATUS_STYLE: Record<TableView['status'], string> = {
  AVAILABLE: 'border-gold/25 hover:border-gold hover:shadow-gold',
  PENDING: 'border-warning/50',
  RESERVED: 'border-warning/50',
  OCCUPIED: 'border-danger/55',
  BLOCKED: 'border-white/15',
  MAINTENANCE: 'border-white/15',
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
        'group relative flex aspect-[4/3] flex-col items-center justify-center gap-1 border bg-black/45 p-2 transition-all duration-300',
        table.shape === 'round' ? 'rounded-full' : 'rounded-xl',
        STATUS_STYLE[table.status],
        selected && 'border-gold bg-gold/12 shadow-gold-lg ring-1 ring-gold',
        selectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
        tooSmall && 'opacity-45',
      )}
    >
      <span
        className={cn(
          'font-display text-2xl leading-none',
          table.status === 'OCCUPIED' ? 'text-danger' : selected ? 'text-gold-light' : 'text-cream',
        )}
      >
        {table.number}
      </span>

      <span className="flex items-center gap-1 text-[10.5px] text-muted">
        <Users className="h-3 w-3" aria-hidden />
        {table.capacity}
      </span>

      {/* Status badge, bottom-right of the table shape */}
      <span
        className={cn(
          'absolute bottom-1.5 right-1.5 grid place-items-center rounded-full',
          table.status === 'AVAILABLE' && !tooSmall && 'h-6 w-6 bg-success text-white',
          table.status === 'PENDING' && 'h-6 w-6 border border-warning/60 bg-warning/20 text-warning',
          (table.status === 'BLOCKED' || table.status === 'MAINTENANCE') &&
            'h-6 w-6 border border-white/20 bg-white/10 text-muted',
        )}
      >
        {table.status === 'AVAILABLE' && !tooSmall && (
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        )}
        {table.status === 'PENDING' && <Lock className="h-3.5 w-3.5" aria-hidden />}
        {table.status === 'MAINTENANCE' && <Wrench className="h-3.5 w-3.5" aria-hidden />}
      </span>

      {/* Occupied tables show a live countdown instead of a badge */}
      {table.status === 'OCCUPIED' && table.busyUntilIso && (
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-danger">
          <Clock className="h-3 w-3" aria-hidden />
          <BusyCountdown untilIso={table.busyUntilIso} serverNowIso={serverNowIso} />
        </span>
      )}

      {table.status === 'PENDING' && table.busyUntilIso && (
        <span className="mt-0.5 text-[10px] font-medium text-warning">{labels.pending}</span>
      )}
    </button>
  )
}
