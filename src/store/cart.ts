'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CartOption = {
  /** ADD_TOPPING | REMOVE_INGREDIENT */
  kind: 'ADD_TOPPING' | 'REMOVE_INGREDIENT'
  label: string
  priceCents: number
}

export type CartLine = {
  /** Stable id derived from the dish plus its chosen options. */
  lineId: string
  menuItemSlug: string
  name: string
  image: string | null
  unitPriceCents: number
  quantity: number
  options: CartOption[]
  notes: string
}

type CartState = {
  lines: CartLine[]
  addLine: (line: Omit<CartLine, 'lineId'>) => void
  setQuantity: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  clear: () => void
}

/** Deterministic key so re-adding the same configuration merges quantities. */
function makeLineId(slug: string, options: CartOption[], notes: string) {
  const opt = [...options]
    .map((o) => `${o.kind}:${o.label}`)
    .sort()
    .join('|')
  return `${slug}__${opt}__${notes.trim()}`
}

export function lineTotalCents(line: CartLine): number {
  const optionsTotal = line.options.reduce((sum, o) => sum + o.priceCents, 0)
  return (line.unitPriceCents + optionsTotal) * line.quantity
}

export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0)
}

/**
 * Takeaway basket.
 *
 * Persisted to localStorage because it holds nothing sensitive — only dish
 * slugs, quantities and free-text notes. Customer name, phone and the order
 * itself are never stored client-side; they go straight to the server on
 * checkout, and prices are always recalculated there.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      addLine: (line) =>
        set((state) => {
          const lineId = makeLineId(line.menuItemSlug, line.options, line.notes)
          const existing = state.lines.find((l) => l.lineId === lineId)
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === lineId ? { ...l, quantity: l.quantity + line.quantity } : l,
              ),
            }
          }
          return { lines: [...state.lines, { ...line, lineId }] }
        }),

      setQuantity: (lineId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
        })),

      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'vr_cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
