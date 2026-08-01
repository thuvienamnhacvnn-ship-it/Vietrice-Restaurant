'use client'

import { useEffect, useRef, useState } from 'react'

export type StreamStatus = 'connecting' | 'live' | 'offline'

/**
 * Subscribe to floor-plan changes over server-sent events.
 *
 * The stream deliberately ends itself just under Vercel's function ceiling, so
 * a disconnect roughly every fifty seconds is the normal case rather than a
 * fault. EventSource would reconnect on its own, but it does so on a fixed
 * timer with no way to tell "the server said goodbye" from "the database is
 * down" — this reconnects immediately after a clean cycle and backs off only
 * when attempts keep failing, so a real outage does not turn into a retry
 * storm against an already-struggling server.
 *
 * `onChange` is held in a ref so a caller can pass an inline closure without
 * tearing the connection down and rebuilding it on every render.
 */
export function useFloorStream(onChange: () => void, enabled = true): StreamStatus {
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const handler = useRef(onChange)
  handler.current = onChange

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('EventSource' in window)) {
      setStatus('offline')
      return
    }

    let source: EventSource | null = null
    let retryId: number | null = null
    let stopped = false
    let attempt = 0

    const connect = () => {
      if (stopped) return
      source = new EventSource('/api/tables/stream')

      source.addEventListener('sync', () => {
        attempt = 0
        setStatus('live')
      })

      source.addEventListener('change', () => {
        setStatus('live')
        handler.current()
      })

      source.onerror = () => {
        source?.close()
        source = null
        setStatus('offline')
        const delay = Math.min(1000 * 2 ** attempt, 30_000)
        attempt += 1
        retryId = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      stopped = true
      source?.close()
      if (retryId !== null) window.clearTimeout(retryId)
    }
  }, [enabled])

  return status
}
