'use client'

import { useEffect, useState } from 'react'

export type Countdown = {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
}

function diff(targetMs: number, nowMs: number): Countdown {
  const totalMs = Math.max(0, targetMs - nowMs)
  return {
    days: Math.floor(totalMs / 86_400_000),
    hours: Math.floor((totalMs / 3_600_000) % 24),
    minutes: Math.floor((totalMs / 60_000) % 60),
    seconds: Math.floor((totalMs / 1000) % 60),
    totalMs,
    expired: totalMs <= 0,
  }
}

// ---------------------------------------------------------------------------
// Shared 1 Hz clock
//
// The reservation floor plan alone renders up to twelve countdowns, plus the
// promotions panel. One `setInterval` per countdown pegged the main thread, so
// every consumer now subscribes to a single interval that only runs while at
// least one countdown is mounted. It also pauses while the tab is hidden,
// because a backgrounded tab has nothing to repaint.
// ---------------------------------------------------------------------------

type Listener = (nowMs: number) => void

const listeners = new Set<Listener>()
let timerId: number | null = null

function tick() {
  const now = Date.now()
  for (const listener of listeners) listener(now)
}

function start() {
  if (timerId !== null || typeof window === 'undefined') return
  timerId = window.setInterval(tick, 1000)
}

function stop() {
  if (timerId === null) return
  window.clearInterval(timerId)
  timerId = null
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) {
    start()
    document.addEventListener('visibilitychange', onVisibility)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

function onVisibility() {
  if (document.hidden) {
    stop()
  } else {
    tick() // Catch up immediately so nothing shows a stale value.
    start()
  }
}

/**
 * Ticking countdown anchored to *server* time.
 *
 * `serverNowIso` is the server's clock at render time; the offset against the
 * browser clock is measured once and applied to every tick. A guest with a
 * skewed or deliberately altered system clock therefore cannot make an expired
 * promotion look live — and validity is re-checked server-side regardless.
 */
export function useCountdown(targetIso: string, serverNowIso?: string): Countdown {
  const targetMs = new Date(targetIso).getTime()

  const [offset] = useState(() =>
    serverNowIso ? new Date(serverNowIso).getTime() - Date.now() : 0,
  )

  const [value, setValue] = useState<Countdown>(() => diff(targetMs, Date.now() + offset))

  useEffect(() => {
    const update = (nowMs: number) => setValue(diff(targetMs, nowMs + offset))
    update(Date.now())
    return subscribe(update)
  }, [targetMs, offset])

  return value
}
