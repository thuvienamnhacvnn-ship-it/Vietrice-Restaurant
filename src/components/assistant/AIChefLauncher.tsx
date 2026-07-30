'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

import { useT } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { useMobileActionBarHeight } from '@/hooks/useMobileActionBar'
import { AIChatPanel } from './AIChatPanel'

/**
 * Global AI Chef entry point pinned to the bottom-right, matching the mockups:
 * a circular half-body chef portrait above a compact gold-bordered card.
 * Clicking it opens the chat panel in place.
 */
/** Pointer travel, in px, before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 5

export function AIChefLauncher() {
  const t = useT()
  const barHeight = useMobileActionBarHeight()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [overHero, setOverHero] = useState(false)

  /**
   * Left-button drag. `offset` is a delta from the launcher's docked corner, so
   * the default placement still follows the hero/scroll rules until the guest
   * actually moves it.
   *
   * The same button also opens the chat, so a press only becomes a drag once
   * the pointer has travelled past DRAG_THRESHOLD. Below that it is treated as
   * a click and the panel opens — otherwise every slightly shaky click would
   * nudge the chef instead of talking to him.
   */
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startX: number
    startY: number
    baseX: number
    baseY: number
    moved: boolean
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: offset?.x ?? 0,
        baseY: offset?.y ?? 0,
        moved: false,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [offset],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }
    setOffset({ x: d.baseX + dx, y: d.baseY + dy })
  }, [])

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      dragRef.current = null
      setDragging(false)
      if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      }
      // A press that never became a drag is a plain click: open the chat.
      if (!d.moved && e.type === 'pointerup') setOpen(true)
    },
    [],
  )

  // Keep the launcher on screen if the window is resized after a drag.
  useEffect(() => {
    if (!offset) return
    const clamp = () => {
      setOffset((o) =>
        o
          ? {
              x: Math.max(-window.innerWidth + 180, Math.min(0, o.x)),
              y: Math.max(-window.innerHeight + 200, Math.min(200, o.y)),
            }
          : o,
      )
    }
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [offset])

  /**
   * On the home page the hero's signature-dish strip occupies the bottom of the
   * viewport, and the reference layout puts the chef *above* that strip rather
   * than on top of it. Lift the launcher while the hero is in view, and drop it
   * back to the normal corner position once the page scrolls past.
   */
  useEffect(() => {
    if (pathname !== '/') {
      setOverHero(false)
      return
    }
    const onScroll = () => setOverHero(window.scrollY < window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <div
      className={cn(
        'fixed right-2 z-40 flex flex-col items-end sm:right-4',
        !offset && 'transition-[bottom] duration-500',
        overHero && !offset ? 'bottom-[292px] short:bottom-[262px]' : 'bottom-3 sm:bottom-4',
        dragging && 'select-none',
      )}
      style={{
        ...(offset ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : null),
        // Lift clear of a page's fixed bottom bar. Only applies below `lg`,
        // where such bars exist; the dragged position wins over both.
        ...(barHeight && !offset ? { marginBottom: barHeight } : null),
      }}
      title={t.assistant.title}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 origin-bottom-right"
          >
            <AIChatPanel
              variant="floating"
              onClose={() => setOpen(false)}
              className="max-h-[70vh] w-[min(360px,calc(100vw-1.5rem))]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          type="button"
          // Drag and open both live on this button, never on the wrapper. On
          // the wrapper the pointerup handler also caught clicks inside the
          // chat panel — closing it reopened it instantly — and pointer capture
          // there stole events from the chat input.
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={`${t.assistant.title} — ${t.assistant.chatNow}`}
          aria-expanded={open}
          className={cn(
            'group flex flex-col items-center focus:outline-none',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
        >
          <span
            className={cn(
              'relative grid h-[86px] w-[86px] place-items-center overflow-hidden rounded-full border-2 bg-background-soft transition-all duration-400 sm:h-[104px] sm:w-[104px]',
              hovered ? 'border-gold shadow-gold-lg' : 'border-gold/60 shadow-gold',
            )}
          >
            {/* Square head-anchored crop; the full-height portrait would
                shrink the face to nothing inside this medallion. */}
            <Image
              src="/images/assistant/ai-chef-avatar.png"
              alt=""
              aria-hidden
              width={290}
              height={290}
              className="h-full w-full scale-[1.05] object-cover object-top"
            />
            <span
              aria-hidden
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_10px_2px_rgb(34_197_94/0.6)]"
            />
          </span>

          <span className="card-lux -mt-3 w-[152px] px-3 py-2 text-center sm:w-[172px]">
            <span className="block font-body text-[12.5px] font-semibold text-gold-light">
              {t.assistant.title}
            </span>
            <span className="mt-0.5 block text-[10.5px] text-muted">{t.assistant.status}</span>
            <span className="mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-gold">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {t.assistant.chatNow}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
