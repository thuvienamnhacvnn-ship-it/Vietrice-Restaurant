'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, MapPin, Phone, X } from 'lucide-react'

import { mainNav, site } from '@/config/site'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from './LocaleSwitcher'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on route change so a tap on a link never leaves the drawer open.
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Escape to close, and lock background scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label={t.common.close}
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t.common.menu}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-gold/25 bg-background-soft/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
              <Logo size="sm" withTagline={false} />
              <button
                type="button"
                onClick={onClose}
                aria-label={t.common.close}
                className="grid h-9 w-9 place-items-center rounded-md border border-gold/35 text-gold hover:bg-gold/10"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav aria-label={t.common.menu} className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {mainNav.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-4 py-3.5 text-sm font-medium uppercase tracking-luxe transition-colors',
                          active
                            ? 'border-gold/45 bg-gold/10 text-gold-light'
                            : 'border-transparent text-cream/80 hover:border-gold/25 hover:bg-white/[0.03] hover:text-gold',
                        )}
                      >
                        {t.nav[item.key]}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="space-y-4 border-t border-gold/15 px-5 py-5">
              <LocaleSwitcher className="justify-center text-sm" />
              <ButtonLink href="/reservation" size="md" className="w-full" onClick={onClose}>
                {t.common.reserveTable}
              </ButtonLink>
              <ul className="space-y-2.5 text-[13px] text-cream/70">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <span>
                    {site.address.street}
                    <br />
                    {site.address.postalCode} {site.address.city}, {site.address.country}
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <a href={site.phone.href} className="hover:text-gold">
                    {site.phone.display}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <a href={`mailto:${site.email}`} className="break-all hover:text-gold">
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
