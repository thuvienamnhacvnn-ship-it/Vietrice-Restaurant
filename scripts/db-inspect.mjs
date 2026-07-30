/**
 * Read-only audit of the target database.
 *
 * Reports both schemas, because this Neon database is shared: `public` holds a
 * different project's live data and must stay untouched, while Viet Rice lives
 * in `vietrice`. Also prints the most recent reservations with their audit
 * trail, to confirm bookings land with their logs and notification.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

for (const schema of ['public', 'vietrice']) {
  const tables = await prisma.$queryRawUnsafe(
    `select table_name from information_schema.tables
     where table_schema = $1 order by table_name`,
    schema,
  )
  let total = 0
  for (const t of tables) {
    const [{ n }] = await prisma.$queryRawUnsafe(
      `select count(*)::int as n from "${schema}"."${t.table_name}"`,
    )
    total += n
  }
  console.log(`[${schema}]  ${tables.length} tables, ${total} rows`)
}

const bookings = await prisma.reservation.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  include: {
    table: { select: { number: true } },
    statusLogs: { select: { toStatus: true } },
    history: { select: { action: true } },
  },
})

console.log(`\nLatest reservations: ${bookings.length}`)
for (const b of bookings) {
  console.log(
    `  ${b.code}  table ${b.table.number}  ${b.partySize}p  ${b.status}  ` +
      `${b.startsAt.toISOString()}  logs=${b.statusLogs.length} history=${b.history.length}`,
  )
}

const notes = await prisma.notification.count({ where: { type: 'RESERVATION_NEW' } })
const customers = await prisma.customer.count()
console.log(`\nAdmin notifications: ${notes}   Customers: ${customers}`)

await prisma.$disconnect()
