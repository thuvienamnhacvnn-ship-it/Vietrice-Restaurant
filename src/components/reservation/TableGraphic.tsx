import { cn } from '@/lib/utils'

/**
 * Top-down dining table, drawn to match the reservation mockup: a warm wooden
 * top with chairs around the rim, a laid place setting (plate + cutlery) per
 * seat, and a herb centrepiece.
 *
 * The number of chairs and covers is driven by the table's real `capacity`, so
 * the drawing always tells the guest how many people actually fit — a four-top
 * shows four covers, a six-top shows six.
 *
 * Pure SVG on a 100x100 viewBox so it scales cleanly inside any cell.
 */
export function TableGraphic({
  shape,
  capacity,
  tone = 'default',
  className,
}: {
  shape: 'square' | 'round'
  capacity: number
  /** Tints the wood so busy tables read as unavailable at a glance. */
  tone?: 'default' | 'busy' | 'pending' | 'selected'
  className?: string
}) {
  const uid = `${shape}-${capacity}-${tone}`
  const seats = Math.max(2, Math.min(capacity, 10))

  const wood =
    tone === 'busy'
      ? { a: '#4a241c', b: '#6d3626' }
      : tone === 'pending'
        ? { a: '#4f3a1c', b: '#78582c' }
        : tone === 'selected'
          ? { a: '#6b4a24', b: '#95682f' }
          : { a: '#4a3220', b: '#6f4c2c' }

  const chairFill = tone === 'busy' ? '#3d2019' : '#3f2b1b'
  const chairEdge = tone === 'busy' ? '#7b4433' : '#7a5533'

  /** Seat positions around the table, as angles in degrees (0 = top). */
  const angles = Array.from({ length: seats }, (_, i) => (360 / seats) * i)

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('h-full w-full', className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id={`top-${uid}`} cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor={wood.b} />
          <stop offset="100%" stopColor={wood.a} />
        </radialGradient>
        <linearGradient id={`chair-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={chairEdge} />
          <stop offset="55%" stopColor={chairFill} />
        </linearGradient>
      </defs>

      {/* ---- Chairs (drawn first so the table top overlaps their inner edge) */}
      <g>
        {angles.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <rect
              x="42"
              y={shape === 'round' ? 4 : 6}
              width="16"
              height="11"
              rx="4"
              fill={`url(#chair-${uid})`}
              stroke={chairEdge}
              strokeWidth="0.7"
              opacity="0.95"
            />
          </g>
        ))}
      </g>

      {/* ---- Table top ---- */}
      {shape === 'round' ? (
        <>
          <circle cx="50" cy="50" r="32" fill={`url(#top-${uid})`} />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke={chairEdge}
            strokeWidth="0.9"
            opacity="0.55"
          />
          {/* Inner ring, as in the mockup's round tops */}
          <circle cx="50" cy="50" r="21" fill="#000" opacity="0.13" />
        </>
      ) : (
        <>
          <rect x="19" y="19" width="62" height="62" rx="6" fill={`url(#top-${uid})`} />
          <rect
            x="19"
            y="19"
            width="62"
            height="62"
            rx="6"
            fill="none"
            stroke={chairEdge}
            strokeWidth="0.9"
            opacity="0.55"
          />
          {/* Wood grain */}
          <g opacity="0.16" stroke="#000" strokeWidth="0.6">
            <line x1="19" y1="34" x2="81" y2="34" />
            <line x1="19" y1="50" x2="81" y2="50" />
            <line x1="19" y1="66" x2="81" y2="66" />
          </g>
        </>
      )}

      {/* ---- Place settings: plate + fork + knife, one per seat ---- */}
      <g>
        {angles.map((angle) => (
          <g key={`cover-${angle}`} transform={`rotate(${angle} 50 50)`}>
            <ellipse
              cx="50"
              cy={shape === 'round' ? 27 : 28}
              rx="5.4"
              ry="5.4"
              fill="#e6ddcd"
              opacity="0.92"
            />
            <ellipse
              cx="50"
              cy={shape === 'round' ? 27 : 28}
              rx="3"
              ry="3"
              fill="#c9bda8"
              opacity="0.8"
            />
            <line
              x1="42.6"
              y1={shape === 'round' ? 24 : 25}
              x2="42.6"
              y2={shape === 'round' ? 30 : 31}
              stroke="#d8cfbe"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <line
              x1="57.4"
              y1={shape === 'round' ? 24 : 25}
              x2="57.4"
              y2={shape === 'round' ? 30 : 31}
              stroke="#d8cfbe"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      {/* ---- Herb centrepiece ---- */}
      <g opacity="0.9">
        <ellipse cx="50" cy="50" rx="8" ry="6" fill="#1e2d16" opacity="0.55" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="50"
            cy="45.5"
            rx="1.9"
            ry="4.2"
            fill="#4f8a3d"
            opacity="0.85"
            transform={`rotate(${a} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="1.8" fill="#6fae57" />
      </g>
    </svg>
  )
}
