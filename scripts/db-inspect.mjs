/**
 * Read-only audit of the target database.
 *
 * Reports both schemas, because this Neon database is shared: `public` holds a
 * different project's live data and must stay untouched, while Viet Rice lives
 * in `vietrice`.
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
  const lines = []
  for (const t of tables) {
    const [{ n }] = await prisma.$queryRawUnsafe(
      `select count(*)::int as n from "${schema}"."${t.table_name}"`,
    )
    total += n
    if (n > 0) lines.push(`  ${String(n).padStart(6)}  ${t.table_name}`)
  }

  console.log(`\n[${schema}]  ${tables.length} tables, ${total} rows`)
  console.log(lines.join('\n') || '  (empty)')
}

await prisma.$disconnect()
