import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 *
 * Next's dev server hot-reloads modules on every edit; without caching the
 * client on globalThis each reload would open a fresh connection pool and Neon
 * would start refusing connections after a few dozen saves.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/** True when a database is configured; the site falls back to seed data if not. */
export const hasDatabase = Boolean(process.env.DATABASE_URL)
