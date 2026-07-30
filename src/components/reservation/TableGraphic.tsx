import { cn } from '@/lib/utils'

/**
 * Top-down dining table.
 *
 * The number of chairs and covers is driven by the table's real `capacity`, so
 * the drawing always tells the guest how many people fit — a two-top shows two
 * covers, a six-top shows six. Two-tops and four-tops are square, six-tops are
 * round, matching how the room is actually laid out.
 *
 * `occupied` swaps the covers for seated guests and dims the wood, so a busy
 * table reads as busy at a glance rather than only via its badge.
 *
 * Pure SVG on a 100x100 viewBox so it scales cleanly inside any cell.
 */
export function TableGraphic({
  shape,
  capacity,
  tone = 'default',
  occupied = false,
  className,
}: {
  shape: 'square' | 'round'
  capacity: number
  tone?: 'default' | 'busy' | 'pending' | 'selected'
  /** Draw guests in the chairs and darken the wood. */
  occupied?: boolean
  className?: string
}) {
  const uid = `${shape}-${capacity}-${tone}`
  const seats = Math.max(2, Math.min(capacity, 8))

  const wood =
    tone === 'busy'
      ? { a: '#2b1d17', b: '#463229' }
      : tone === 'pending'
        ? { a: '#4a361b', b: '#6f5228' }
        : tone === 'selected'
          ? { a: '#6b5228', b: '#9c7c46' }
          : // Free tables sit brighter than busy ones, so the room reads at a glance.
            { a: '#4b3c2c', b: '#7a6853' }

  const chairFill = occupied ? '#2a1f18' : '#463628'
  const chairEdge = occupied ? '#5b4038' : '#8a7458'

  /** Seat angles around the table, 0 = top. */
  const angles = Array.from({ length: seats }, (_, i) => (360 / seats) * i)

  // Square two-tops seat guests opposite each other, not around all four sides.
  const squareAngles = seats === 2 ? [0, 180] : seats === 4 ? [0, 90, 180, 270] : angles
  const seatAngles = shape === 'round' ? angles : squareAngles

  const topInset = shape === 'round' ? 22 : 24
  const topSize = shape === 'round' ? 30 : 54

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('h-full w-full', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={`top-${uid}`} cx="40%" cy="32%" r="74%">
          <stop offset="0%" stopColor={wood.b} />
          <stop offset="100%" stopColor={wood.a} />
        </radialGradient>
        <linearGradient id={`chair-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={chairEdge} />
          <stop offset="60%" stopColor={chairFill} />
        </linearGradient>
        <radialGradient id={`guest-${uid}`} cx="42%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#caa87a" />
          <stop offset="100%" stopColor="#6d4d30" />
        </radialGradient>
      </defs>

      {/* Soft shadow pooled under the table */}
      <ellipse cx="50" cy="54" rx="40" ry="36" fill="#000" opacity="0.32" />

      {/* Chairs */}
      {seatAngles.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <rect
            x="43"
            y={topInset - 14}
            width="14"
            height="10"
            rx="4"
            fill={`url(#chair-${uid})`}
            stroke={chairEdge}
            strokeWidth="0.6"
          />
        </g>
      ))}

      {/* Table top */}
      {shape === 'round' ? (
        <>
          <circle cx="50" cy="50" r={topSize} fill={`url(#top-${uid})`} />
          <circle
            cx="50"
            cy="50"
            r={topSize}
            fill="none"
            stroke={chairEdge}
            strokeWidth="1"
            opacity="0.7"
          />
          <circle cx="50" cy="50" r={topSize - 10} fill="#000" opacity="0.12" />
        </>
      ) : (
        <>
          <rect
            x={50 - topSize / 2}
            y={50 - topSize / 2}
            width={topSize}
            height={topSize}
            rx="6"
            fill={`url(#top-${uid})`}
          />
          <rect
            x={50 - topSize / 2}
            y={50 - topSize / 2}
            width={topSize}
            height={topSize}
            rx="6"
            fill="none"
            stroke={chairEdge}
            strokeWidth="1"
            opacity="0.7"
          />
        </>
      )}

      {/* Covers, or seated guests when the table is busy */}
      {seatAngles.map((angle) => (
        <g key={`cover-${angle}`} transform={`rotate(${angle} 50 50)`}>
          {occupied ? (
            // Guest seen from above: head plus shoulders.
            <>
              <ellipse cx="50" cy={topInset - 8} rx="6.2" ry="4" fill="#3a2519" opacity="0.9" />
              <circle cx="50" cy={topInset - 10} r="4.4" fill={`url(#guest-${uid})`} />
            </>
          ) : (
            <>
              <circle cx="50" cy={topInset + 3} r="5" fill="#efe7d6" opacity="0.95" />
              <circle cx="50" cy={topInset + 3} r="2.6" fill="#cdc1ab" opacity="0.85" />
              <line
                x1="43.4"
                y1={topInset}
                x2="43.4"
                y2={topInset + 6}
                stroke="#e2d9c8"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <line
                x1="56.6"
                y1={topInset}
                x2="56.6"
                y2={topInset + 6}
                stroke="#e2d9c8"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </>
          )}
        </g>
      ))}

      {/* Centrepiece: a small candle on free tables, cleared plates when busy */}
      {!occupied && (
        <g>
          <ellipse cx="50" cy="52" rx="5" ry="3.4" fill="#1d2b16" opacity="0.6" />
          <rect x="48.4" y="45" width="3.2" height="6" rx="1.4" fill="#f0e2c4" />
          <circle cx="50" cy="44" r="2.4" fill="#f7c76a" opacity="0.95" />
          <circle cx="50" cy="44" r="5" fill="#f7c76a" opacity="0.18" />
        </g>
      )}
    </svg>
  )
}
