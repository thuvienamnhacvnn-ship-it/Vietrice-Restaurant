'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, Menu as MenuIcon, Phone } from 'lucide-react'

import { mainNav, site } from '@/config/site'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from './LocaleSwitcher'
import { MobileDrawer } from './MobileDrawer'

/** Scroll distance after which the contact strip collapses. */
const COLLAPSE_AT = 60

/**
 * Two-layer header that floats over the hero.
 *
 * Layer 1 carries the contact strip, language switcher and reserve CTA.
 * Layer 2 carries the main navigation. Neither layer is opaque at rest: the
 * strip sits at 40% black with a light backdrop blur, exactly as in the
 * mockups, and both darken as the page scrolls.
 *
 * On scroll the contact strip collapses away and only the navigation bar
 * remains. The brand mark and reserve CTA slide into that bar so nothing
 * essential is lost. Below `lg` the strip stays put — it is the only place the
 * drawer trigger lives, and the nav bar itself is hidden there.
 */
export function Header() {
  const pathname = usePathname()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_AT)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-shadow duration-500',
          collapsed && 'shadow-[0_10px_40px_-20px_rgba(0,0,0,0.95)]',
        )}
      >
        {/* ---- Layer 1: mobile bar ----
            Desktop folds its contents into the navigation row below; this bar
            only survives under `lg`, where the nav row is hidden and this is
            the only home for the brand and the drawer trigger. */}
        <div
          className={cn(
            'overflow-hidden border-b border-gold/12 backdrop-blur-md transition-all duration-500 ease-out lg:hidden',
            collapsed ? 'bg-black/85' : 'bg-black/40',
          )}
        >
          <div className="mx-auto flex max-w-[1720px] items-center gap-4 px-4 py-2.5 lg:px-8">
            <div className="flex flex-1 items-center">
              <Logo size="sm" withTagline={false} />
            </div>

            <div className="flex shrink-0 items-center gap-3 xl:flex-1 xl:justify-end">
              <LocaleSwitcher />
              <span aria-hidden className="hidden h-4 w-px bg-gold/25 sm:block" />
              <ButtonLink href="/reservation" size="sm" className="hidden sm:inline-flex">
                {t.common.reserveTable}
              </ButtonLink>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label={t.common.menu}
                aria-expanded={drawerOpen}
                className="grid h-9 w-9 place-items-center rounded-md border border-gold/40 text-gold transition-colors hover:bg-gold/10 lg:hidden"
              >
                <MenuIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* ---- Layer 2: main navigation ---- */}
        <div
          className={cn(
            'hidden border-b border-gold/10 backdrop-blur-md transition-colors duration-500 lg:block',
            collapsed ? 'bg-black/85' : 'bg-black/30',
          )}
        >
          <div className="mx-auto grid max-w-[1800px] grid-cols-[auto_1fr_auto] items-center gap-6 px-4 lg:px-6">
            {/* Brand + contact details, folded into the single desktop bar. */}
            <div className="flex min-w-0 items-center gap-4 justify-self-start">
              <Logo size="sm" withTagline={false} />
              <span aria-hidden className="hidden h-5 w-px bg-gold/20 xl:block" />
              <ul className="hidden min-w-0 items-center gap-4 whitespace-nowrap text-[12px] text-cream/70 xl:flex">
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                  <a href={site.phone.href} className="font-medium hover:text-gold">
                    {site.phone.display}
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                  <a href={`mailto:${site.email}`} className="hover:text-gold">
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>

            <nav aria-label={t.common.menu}>
              <ul className="flex items-center justify-center gap-1 xl:gap-2">
                {mainNav.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative block whitespace-nowrap px-2.5 py-3.5 text-[11.5px] font-medium uppercase tracking-[0.1em] transition-all duration-300 hover:-translate-y-px motion-reduce:hover:translate-y-0 xl:px-3.5 xl:text-[12px] 2xl:px-4',
                          active ? 'text-gold-light' : 'text-cream/80 hover:text-gold',
                        )}
                      >
                        {t.nav[item.key]}
                        <span
                          aria-hidden
                          className={cn(
                            'absolute inset-x-2.5 bottom-2 h-px origin-center bg-gold transition-transform duration-300 xl:inset-x-3.5',
                            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                          )}
                        />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-3 justify-self-end">
              <LocaleSwitcher />
              <ButtonLink href="/reservation" size="sm">
                {t.common.reserveTable}
              </ButtonLink>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
