'use client'

import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, Busy, EmptyNote, ErrorNote, SearchInput } from '@/components/admin/primitives'

export type AdminCustomer = {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  marketingOptIn: boolean
  reservations: number
  orders: number
  lastVisit: string | null
}

export function CustomersBoard({ customers }: { customers: AdminCustomer[] }) {
  const { t, intl } = useAdminI18n()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/content')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      (c.email?.toLowerCase().includes(q) ?? false),
  )

  const optIn = customers.filter((c) => c.marketingOptIn).length

  return (
    <>
      <BoardHeader
        title={t.customers.title}
        summary={fill(t.customers.summary, { total: customers.length, optIn })}
      >
        <SearchInput value={query} onChange={setQuery} placeholder={t.customers.searchPlaceholder} />
      </BoardHeader>

      <ErrorNote message={error} />

      {visible.length === 0 ? (
        <EmptyNote message={t.customers.empty} />
      ) : (
        <ul className="mt-5 grid gap-2.5 xl:grid-cols-2">
          {visible.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              busy={busyId === c.id}
              intl={intl}
              run={run}
            />
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}
    </>
  )
}

function CustomerRow({
  customer,
  busy,
  intl,
  run,
}: {
  customer: AdminCustomer
  busy: boolean
  intl: string
  run: (id: string, body: unknown) => Promise<boolean>
}) {
  const { t } = useAdminI18n()
  const [note, setNote] = useState(customer.notes ?? '')

  const saveNote = () => {
    if (note === (customer.notes ?? '')) return
    void run(customer.id, { entity: 'customer', id: customer.id, notes: note || null })
  }

  return (
    <li className="card-lux p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[16px] text-gold-light">{customer.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-[12.5px] text-muted">
            <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-gold">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {customer.phone}
            </a>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-gold">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {customer.email}
              </a>
            )}
          </p>
        </div>

        <div className="flex gap-3 text-right text-[12px] text-muted">
          <span>
            <span className="block font-display text-lg leading-none text-cream">
              {customer.reservations}
            </span>
            {t.customers.reservations}
          </span>
          <span>
            <span className="block font-display text-lg leading-none text-cream">
              {customer.orders}
            </span>
            {t.customers.orders}
          </span>
        </div>
      </div>

      {customer.lastVisit && (
        <p className="mt-1.5 text-[12px] text-muted">
          {t.customers.lastVisit}:{' '}
          {new Date(customer.lastVisit).toLocaleDateString(intl, { dateStyle: 'medium' })}
        </p>
      )}

      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveNote}
        placeholder={t.customers.noteHint}
        className="mt-2.5 w-full resize-none rounded-lg border border-gold/25 bg-black/40 p-2.5 text-[12.5px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(customer.id, {
              entity: 'customer',
              id: customer.id,
              marketingOptIn: !customer.marketingOptIn,
            })
          }
          className={cn(
            'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
            customer.marketingOptIn
              ? 'border-success/45 bg-success/10 text-success'
              : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
          )}
        >
          {t.customers.marketing}: {customer.marketingOptIn ? t.common.yes : t.common.no}
        </button>
        <Busy show={busy} />
      </div>
    </li>
  )
}
