'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { useAdminI18n } from '@/components/admin/AdminI18n'

/**
 * One write helper for every admin board.
 *
 * Deliberately not optimistic: after a successful POST the list is re-read from
 * the server, so what staff see is what the database actually holds. Showing a
 * table as free because a click looked like it worked is how a walk-in ends up
 * sat at a booked table.
 */
export function useAdminAction(url: string) {
  const { t } = useAdminI18n()
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (id: string, body: unknown): Promise<boolean> => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? t.common.error)
        return false
      }
      startTransition(() => router.refresh())
      return true
    } catch {
      setError(t.common.error)
      return false
    } finally {
      setBusyId(null)
    }
  }

  return { run, busyId, error, setError, refreshing }
}
