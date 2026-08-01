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
 * The server's clock, ticking, in milliseconds.
 *
 * For a component that has to judge several deadlines at once — is this table
 * overdue, was it just freed, has the lock run out — one subscription reading
 * "what time is it" beats one `useCountdown` per deadline. Same shared 1 Hz
 * interval, same server-time anchoring, a quarter of the subscribers.
 *
 * Seeded from `serverNowIso` so the server render and the first client render
 * agree; the effect switches to live time on mount.
 */
export function useServerClock(serverNowIso?: string): number {
  const [offset] = useState(() =>
    serverNowIso ? new Date(serverNowIso).getTime() - Date.now() : 0,
  )
  const [nowMs, setNowMs] = useState(() =>
    serverNowIso ? new Date(serverNowIso).getTime() : Date.now(),
  )

  useEffect(() => {
    const update = (ms: number) => setNowMs(ms + offset)
    update(Date.now())
    return subscribe(update)
  }, [offset])

  return nowMs
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

  /**
   * Seed from the server's timestamp, not from `Date.now()`.
   *
   * The server renders this component too, and real time passes between that
   * render and hydration — seeding from the browser clock made the two disagree
   * by a second and threw a hydration mismatch on every countdown. Both sides
   * now derive the first frame from the same `serverNowIso`, and the effect
   * below switches to live time immediately after mount.
   */
  const [value, setValue] = useState<Countdown>(() =>
    diff(targetMs, serverNowIso ? new Date(serverNowIso).getTime() : Date.now()),
  )

  useEffect(() => {
    const update = (nowMs: number) => setValue(diff(targetMs, nowMs + offset))
    update(Date.now())
    return subscribe(update)
  }, [targetMs, offset])

  return value
}
