'use client'

import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Cursor-following gold spotlight for cards.
 *
 * Tracks the pointer as CSS custom properties and paints a soft radial gold
 * wash that follows it, plus a hairline gold border that brightens on hover —
 * the "lit by candlelight" feel the dark palette is built around.
 *
 * Uses CSS variables rather than React state per frame, so pointer movement
 * never triggers a re-render. Touch devices never fire `pointermove` without a
 * press, so they simply get the static card.
 */
export function Spotlight({
  children,
  className,
  /** Radius of the glow in pixels. */
  size = 320,
  intensity = 0.13,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  size?: number
  intensity?: number
  as?: 'div' | 'li' | 'article'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }

  return (
    <Tag
      ref={ref as never}
      onPointerMove={onMove}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      className={cn('group/spot relative isolate overflow-hidden', className)}
      style={
        {
          '--spot-size': `${size}px`,
          '--spot-alpha': active ? intensity : 0,
        } as React.CSSProperties
      }
    >
      {/* Glow layer, painted above the background but below the content. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 motion-reduce:hidden"
        style={{
          background:
            'radial-gradient(var(--spot-size) circle at var(--spot-x, 50%) var(--spot-y, 50%), rgb(216 174 99 / var(--spot-alpha)), transparent 70%)',
        }}
      />
      {children}
    </Tag>
  )
}
