'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  CalendarClock,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  ShoppingBag,
  Tags,
  UtensilsCrossed,
  Users,
} from 'lucide-react'

import { LOCALE_COOKIE, locales, localeLabels } from '@/i18n/config'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { AdminI18nProvider, useAdminI18n } from '@/components/admin/AdminI18n'
import type { AdminDictionary } from '@/i18n/admin'
import type { Locale } from '@/i18n/config'

/** Every entry points at a route that exists — a nav link to a 404 is worse than none. */
const NAV = [
  { href: '/admin', key: 'dashboard', Icon: LayoutDashboard },
  { href: '/admin/orders', key: 'orders', Icon: ShoppingBag },
  { href: '/admin/reservations', key: 'reservations', Icon: CalendarClock },
  { href: '/admin/tables', key: 'tables', Icon: LayoutGrid },
  { href: '/admin/menu', key: 'menu', Icon: UtensilsCrossed },
  { href: '/admin/promotions', key: 'promotions', Icon: Tags },
  { href: '/admin/gallery', key: 'gallery', Icon: ImageIcon },
  { href: '/admin/customers', key: 'customers', Icon: Users },
  { href: '/admin/history', key: 'history', Icon: History },
  { href: '/admin/settings', key: 'settings', Icon: Settings },
] as const

export type AdminShellProps = {
  session: { name: string; role: string }
  locale: Locale
  dictionary: AdminDictionary
  unread: number
  /** Live counts rendered next to a nav entry, keyed by href. */
  badges?: Partial<Record<string, number>>
  children: React.ReactNode
}

export function AdminShell({ locale, dictionary, ...rest }: AdminShellProps) {
  return (
    <AdminI18nProvider locale={locale} dictionary={dictionary}>
      <Chrome {...rest} locale={locale} dictionary={dictionary} />
    </AdminI18nProvider>
  )
}

function Chrome({ session, unread, badges, children }: AdminShellProps) {
  const { t } = useAdminI18n()
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-background-soft/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-5 py-2.5">
          <Logo size="sm" withTagline={false} asLink={false} />

          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher />
            <span className="flex items-center gap-1.5 text-[13px] text-muted">
              <Bell className="h-4 w-4 text-gold" aria-hidden />
              {unread}
            </span>
            <span className="hidden text-[13px] text-cream/80 sm:block">
              {session.name}
              <span className="ml-2 rounded border border-gold/30 px-1.5 py-0.5 text-[10px] uppercase tracking-luxe text-gold">
                {session.role}
              </span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="fx-press flex items-center gap-1.5 rounded-md border border-gold/25 px-2.5 py-1.5 text-[12px] text-cream/70 transition-colors hover:border-danger/50 hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              {t.nav.signOut}
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-[1600px] overflow-x-auto px-5 pb-2">
          <ul className="flex items-center gap-1">
            {NAV.map(({ href, key, Icon }) => {
              const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
              const count = badges?.[href]
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-[12.5px] transition-colors',
                      active
                        ? 'border-gold/60 bg-gold/10 text-gold-light'
                        : 'border-transparent text-cream/70 hover:border-gold/30 hover:text-gold',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {t.nav[key]}
                    {typeof count === 'number' && count > 0 && (
                      <span className="ml-0.5 rounded-full bg-gold/20 px-1.5 text-[10.5px] tabular-nums text-gold-light">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-6">{children}</main>
    </div>
  )
}

function LocaleSwitcher() {
  const { locale, t } = useAdminI18n()
  const router = useRouter()
  const [switching, startTransition] = useTransition()

  const choose = (next: string) => {
    // Same cookie the public site uses: one language preference per browser,
    // so staff previewing the guest view see what they just selected.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn(
        'flex items-center rounded-md border border-gold/25',
        switching && 'opacity-60',
      )}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-current={l === locale ? 'true' : undefined}
          className={cn(
            'px-2 py-1 text-[11.5px] uppercase tracking-luxe transition-colors first:rounded-l-md last:rounded-r-md',
            l === locale ? 'bg-gold/15 text-gold-light' : 'text-cream/60 hover:text-gold',
          )}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  )
}
