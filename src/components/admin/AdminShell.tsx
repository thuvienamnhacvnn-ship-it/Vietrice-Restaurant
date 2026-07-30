'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, CalendarClock, LayoutDashboard, LogOut, ShoppingBag } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

/** Only routes that exist are listed — a nav link to a 404 is worse than none. */
const NAV = [
  { href: '/admin', label: 'Übersicht', Icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Bestellungen', Icon: ShoppingBag },
  { href: '/admin/reservations', label: 'Reservierungen', Icon: CalendarClock },
] as const

export function AdminShell({
  session,
  unread,
  badges,
  children,
}: {
  session: { name: string; role: string }
  unread: number
  /** Live counts rendered next to a nav entry, keyed by href. */
  badges?: Partial<Record<string, number>>
  children: React.ReactNode
}) {
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
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Logo size="sm" withTagline={false} asLink={false} />

          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map(({ href, label, Icon }) => {
              const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
              const count = badges?.[href]
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] transition-colors',
                    active
                      ? 'border-gold/60 bg-gold/10 text-gold-light'
                      : 'border-transparent text-cream/70 hover:border-gold/30 hover:text-gold',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  {typeof count === 'number' && count > 0 && (
                    <span className="ml-0.5 rounded-full bg-gold/20 px-1.5 text-[10.5px] tabular-nums text-gold-light">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] text-muted">
              <Bell className="h-4 w-4 text-gold" aria-hidden />
              {unread}
            </span>
            <span className="text-[13px] text-cream/80">
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
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-6">{children}</main>
    </div>
  )
}
