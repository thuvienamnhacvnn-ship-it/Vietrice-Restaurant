'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

import { useI18n } from '@/i18n/provider'
import { formatPrice } from '@/lib/utils'
import { cartSubtotalCents, useCart } from '@/store/cart'
import { useMobileActionBar } from '@/hooks/useMobileActionBar'

const COPY = {
  de: { items: 'Artikel', checkout: 'Zur Kasse' },
  en: { items: 'items', checkout: 'Checkout' },
  vi: { items: 'món', checkout: 'Đặt món' },
} as const

/**
 * Cart bar for every public page except `/order`.
 *
 * Dishes can be added straight from the Smart Menu, where nothing on a phone
 * confirmed the tap or offered a way to reach checkout — the basket lived only
 * on the order page. This is that missing feedback and that missing exit.
 *
 * `/order` renders its own richer bar, which opens the basket in place rather
 * than navigating away.
 */
export function MobileCartBar() {
  const { locale, intl } = useI18n()
  const pathname = usePathname()
  const lines = useCart((s) => s.lines)

  // The store is persisted to localStorage, so the server render and the first
  // client render disagree about the cart. Waiting for mount keeps hydration
  // clean instead of trading one bug for another.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const count = lines.reduce((n, l) => n + l.quantity, 0)
  const visible = mounted && count > 0 && pathname !== '/order'

  useMobileActionBar(visible)

  if (!visible) return null

  const copy = COPY[locale]

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-background-soft/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
      <Link
        href="/order"
        className="fx-press flex h-12 w-full items-center justify-between rounded-lg border border-gold/55 bg-gold/12 px-4 text-gold-light"
      >
        <span className="flex items-center gap-2 text-[13px]">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {count} {copy.items}
        </span>
        <span className="flex items-center gap-3">
          <span className="font-display text-lg">
            {formatPrice(cartSubtotalCents(lines), intl)}
          </span>
          <span className="text-[12px] uppercase tracking-luxe">{copy.checkout}</span>
        </span>
      </Link>
    </div>
  )
}
