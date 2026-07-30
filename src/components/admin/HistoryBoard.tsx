'use client'

import { useState } from 'react'

import { useAdminI18n } from '@/components/admin/AdminI18n'
import { BoardHeader, EmptyNote, SearchInput } from '@/components/admin/primitives'

export type AuditEntry = {
  id: string
  actorName: string
  action: string
  entity: string
  entityId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}

/** `{status: 'NEW'} → {status: 'CONFIRMED'}` renders as `status: NEW → CONFIRMED`. */
function diff(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  if (!after) return []
  return Object.keys(after)
    .filter((key) => key !== 'reason')
    .map((key) => ({
      key,
      from: before && key in before ? String(before[key]) : '—',
      to: String(after[key]),
    }))
    .filter((row) => row.from !== row.to)
}

export function HistoryBoard({ entries }: { entries: AuditEntry[] }) {
  const { t, intl } = useAdminI18n()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = entries.filter(
    (e) =>
      !q ||
      e.action.toLowerCase().includes(q) ||
      e.entity.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q),
  )

  return (
    <>
      <BoardHeader title={t.history.title} summary={t.history.subtitle}>
        <SearchInput value={query} onChange={setQuery} placeholder={t.history.searchPlaceholder} />
      </BoardHeader>

      {visible.length === 0 ? (
        <EmptyNote message={t.history.empty} />
      ) : (
        <div className="card-lux mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-gold/15 text-[11px] uppercase tracking-luxe text-muted">
                <th className="px-4 py-2.5 font-normal">{t.history.when}</th>
                <th className="px-4 py-2.5 font-normal">{t.history.actor}</th>
                <th className="px-4 py-2.5 font-normal">{t.history.action}</th>
                <th className="px-4 py-2.5 font-normal">{t.history.change}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const rows = diff(e.before, e.after)
                return (
                  <tr key={e.id} className="border-b border-gold/8 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">
                      {new Date(e.createdAt).toLocaleString(intl, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-cream/85">{e.actorName}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded border border-gold/25 px-2 py-0.5 text-[11.5px] text-gold">
                        {e.action}
                      </span>
                      <span className="ml-2 text-muted">{e.entity}</span>
                    </td>
                    <td className="px-4 py-2.5 text-cream/80">
                      {rows.length === 0
                        ? '—'
                        : rows.map((r) => (
                            <span key={r.key} className="mr-3 whitespace-nowrap">
                              <span className="text-muted">{r.key}:</span> {r.from}{' '}
                              <span className="text-gold">→</span> {r.to}
                            </span>
                          ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
