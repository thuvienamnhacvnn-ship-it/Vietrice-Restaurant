'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check } from 'lucide-react'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { DishVideoUpload } from '@/components/admin/DishVideoUpload'
import {
  BoardHeader,
  Busy,
  EmptyNote,
  ErrorNote,
  FilterPills,
  SearchInput,
} from '@/components/admin/primitives'

export type AdminDish = {
  id: string
  slug: string
  name: string
  categorySlug: string
  categoryName: string
  image: string | null
  priceCents: number
  isAvailable: boolean
  isSignature: boolean
  isBestseller: boolean
  hasVideo: boolean
}

export function MenuBoard({
  dishes,
  categories,
}: {
  dishes: AdminDish[]
  categories: { slug: string; name: string }[]
}) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/menu')
  const [category, setCategory] = useState('ALL')
  const [query, setQuery] = useState('')

  const options = useMemo(
    () => ['ALL', ...categories.map((c) => c.slug)] as const,
    [categories],
  )
  const label = (key: string) =>
    key === 'ALL' ? t.common.all : (categories.find((c) => c.slug === key)?.name ?? key)

  const visible = dishes.filter((d) => {
    if (category !== 'ALL' && d.categorySlug !== category) return false
    const q = query.trim().toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.slug.includes(q)
  })

  const soldOut = dishes.filter((d) => !d.isAvailable).length

  return (
    <>
      <BoardHeader
        title={t.menu.title}
        summary={fill(t.menu.summary, { total: dishes.length, soldOut })}
      >
        <SearchInput value={query} onChange={setQuery} placeholder={t.menu.searchPlaceholder} />
      </BoardHeader>

      <FilterPills
        options={options as readonly string[]}
        value={category}
        onChange={setCategory}
        label={label}
      />

      <ErrorNote message={error} />

      {visible.length === 0 ? (
        <EmptyNote message={t.menu.empty} />
      ) : (
        <ul className="mt-5 grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((d) => (
            <DishRow
              key={d.id}
              dish={d}
              busy={busyId === d.id}
              intl={intl}
              run={run}
              onSaved={() => router.refresh()}
            />
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}
    </>
  )
}

function DishRow({
  dish,
  busy,
  intl,
  run,
  onSaved,
}: {
  dish: AdminDish
  busy: boolean
  intl: string
  run: (id: string, body: unknown) => Promise<boolean>
  onSaved: () => void
}) {
  const { t } = useAdminI18n()
  // Prices are edited as euros because that is what is on the printed menu;
  // the conversion to cents happens once, here, on submit.
  const [price, setPrice] = useState((dish.priceCents / 100).toFixed(2))
  const [saved, setSaved] = useState(false)

  const dirty = Math.round(parseFloat(price.replace(',', '.')) * 100) !== dish.priceCents
  const valid = /^\d{1,4}([.,]\d{1,2})?$/.test(price.trim())

  const savePrice = async () => {
    if (!valid || !dirty) return
    const cents = Math.round(parseFloat(price.replace(',', '.')) * 100)
    if (await run(dish.id, { itemId: dish.id, priceCents: cents })) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <li className={cn('card-lux flex gap-3 p-3', !dish.isAvailable && 'opacity-70')}>
      <span className="relative h-[62px] w-[72px] shrink-0 overflow-hidden rounded-md bg-black/40">
        {dish.image && (
          <Image src={dish.image} alt="" fill sizes="72px" className="object-cover" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className="truncate font-display text-[15px] uppercase tracking-wide text-cream">
            {dish.name}
          </span>
        </p>
        <p className="text-[11.5px] text-muted">{dish.categoryName}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="relative">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={savePrice}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void savePrice()
              }}
              inputMode="decimal"
              aria-label={t.common.price}
              title={t.menu.priceHint}
              className={cn(
                'h-7 w-[74px] rounded border bg-black/40 px-2 text-[12.5px] tabular-nums text-cream focus:outline-none',
                valid ? 'border-gold/30 focus:border-gold' : 'border-danger/60',
              )}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">
              €
            </span>
          </span>

          {saved && (
            <span className="flex items-center gap-1 text-[11px] text-success">
              <Check className="h-3 w-3" aria-hidden />
              {t.common.saved}
            </span>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => run(dish.id, { itemId: dish.id, isAvailable: !dish.isAvailable })}
            className={cn(
              'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
              dish.isAvailable
                ? 'border-success/50 bg-success/10 text-success'
                : 'border-danger/50 bg-danger/10 text-danger',
            )}
          >
            {dish.isAvailable ? t.menu.available : t.menu.soldOut}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => run(dish.id, { itemId: dish.id, isSignature: !dish.isSignature })}
            className={cn(
              'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
              dish.isSignature
                ? 'border-gold/50 bg-gold/10 text-gold-light'
                : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
            )}
          >
            {t.menu.signature}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => run(dish.id, { itemId: dish.id, isBestseller: !dish.isBestseller })}
            className={cn(
              'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
              dish.isBestseller
                ? 'border-gold/50 bg-gold/10 text-gold-light'
                : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
            )}
          >
            {t.menu.bestseller}
          </button>

          <Busy show={busy} />
        </div>

        <div className="mt-1.5">
          <DishVideoUpload
            itemId={dish.id}
            slug={dish.slug}
            hasVideo={dish.hasVideo}
            onSaved={onSaved}
          />
        </div>
      </div>

      <span className="self-start text-[12px] tabular-nums text-gold">
        {new Intl.NumberFormat(intl, { style: 'currency', currency: 'EUR' }).format(
          dish.priceCents / 100,
        )}
      </span>
    </li>
  )
}
