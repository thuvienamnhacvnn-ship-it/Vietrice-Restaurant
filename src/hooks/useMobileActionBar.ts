'use client'

import { useEffect } from 'react'
import { create } from 'zustand'

/**
 * Tracks the fixed bottom action bar (cart summary, booking CTA) so anything
 * pinned to that corner — the floating AI Chef button — can sit above it.
 *
 * This began as a CSS custom property, which read correctly on the element but
 * did not make Chrome re-resolve the `calc()` that consumed it: the button
 * stayed at its original offset while the variable said otherwise. A store
 * subscription re-renders the component, so the new value is applied as a real
 * style rather than relying on variable invalidation.
 *
 * Bars are counted rather than assigned, so two of them unmounting in any order
 * cannot leave the offset stuck on.
 */
type BarState = { count: number; height: number; push: (h: number) => void; pop: () => void }

const useBarStore = create<BarState>((set) => ({
  count: 0,
  height: 0,
  push: (h) => set((s) => ({ count: s.count + 1, height: h })),
  pop: () =>
    set((s) => {
      const count = Math.max(0, s.count - 1)
      return { count, height: count === 0 ? 0 : s.height }
    }),
}))

/** Call from a component that renders a fixed bottom bar while `visible`. */
export function useMobileActionBar(visible: boolean, height = 68) {
  const push = useBarStore((s) => s.push)
  const pop = useBarStore((s) => s.pop)

  useEffect(() => {
    if (!visible) return
    push(height)
    return pop
  }, [visible, height, push, pop])
}

/** Current bar height in pixels — 0 when no bar is on screen. */
export function useMobileActionBarHeight(): number {
  return useBarStore((s) => s.height)
}
