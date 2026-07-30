import { redirect } from 'next/navigation'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLocale } from '@/i18n'
import { getAdminDictionary } from '@/i18n/admin'

/**
 * Everything every admin page needs: the session (or a redirect), the chosen
 * language, and the live nav counters.
 *
 * The session check is repeated here rather than left to middleware on purpose.
 * Middleware is a navigation convenience; it does not run for every code path
 * that can reach a server component, so each page re-checks before it reads a
 * single row of restaurant data.
 */
export async function adminContext() {
  const session = await readSession()
  if (!session) redirect('/admin/login')

  const locale = await getLocale()

  const [unread, openOrders, openReservations] = await Promise.all([
    prisma.notification.count({ where: { readAt: null } }),
    prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
    prisma.reservation.count({ where: { status: { in: ['PENDING', 'CALLBACK_REQUIRED'] } } }),
  ])

  return {
    session: { name: session.name, role: session.role, userId: session.userId },
    locale,
    dictionary: getAdminDictionary(locale),
    unread,
    badges: {
      '/admin/orders': openOrders,
      '/admin/reservations': openReservations,
    } as Record<string, number>,
  }
}
