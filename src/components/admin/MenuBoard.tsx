'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, Loader2, Pencil, Plus } from 'lucide-react'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { DishVideoUpload } from '@/components/admin/DishVideoUpload'
import { ImageUpload } from '@/components/admin/ImageUpload'
import {
  BoardHeader,
  Busy,
  DeleteButton,
  EmptyNote,
  ErrorNote,
  Field,
  FilterPills,
  Modal,
  SearchInput,
  fieldClass,
} from '@/components/admin/primitives'

export type AdminDish = {
  id: string
  slug: string
  name: string
  nameDe: string
  nameEn: string
  nameVi: string
  descriptionDe: string
  descriptionEn: string
  descriptionVi: string
  categoryId: string
  categorySlug: string
  categoryName: string
  image: string | null
  priceCents: number
  isAvailable: boolean
  isSignature: boolean
  isBestseller: boolean
  hasVideo: boolean
}

type Category = { id: string; slug: string; name: string }

/** The editable shape, shared by the create and edit forms. */
type DishDraft = {
  nameDe: string
  nameEn: string
  nameVi: string
  descriptionDe: string
  descriptionEn: string
  descriptionVi: string
  categoryId: string
  priceEuro: string
  image: string | null
}

const emptyDraft = (categoryId: string): DishDraft => ({
  nameDe: '',
  nameEn: '',
  nameVi: '',
  descriptionDe: '',
  descriptionEn: '',
  descriptionVi: '',
  categoryId,
  priceEuro: '',
  image: null,
})

/** Euro text as typed by staff → cents. Accepts both `14.90` and `14,90`. */
function toCents(euro: string): number | null {
  const trimmed = euro.trim().replace(',', '.')
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(trimmed)) return null
  return Math.round(parseFloat(trimmed) * 100)
}

export function MenuBoard({
  dishes,
  categories,
}: {
  dishes: AdminDish[]
  categories: Category[]
}) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/menu')
  const [category, setCategory] = useState('ALL')
  const [query, setQuery] = useState('')

  /** `null` = closed, `'new'` = create, otherwise the dish being edited. */
  const [editing, setEditing] = useState<AdminDish | 'new' | null>(null)

  const options = useMemo(() => ['ALL', ...categories.map((c) => c.slug)], [categories])
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
        <div className="flex items-center gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder={t.menu.searchPlaceholder} />
          <button
            type="button"
            disabled={categories.length === 0}
            onClick={() => setEditing('new')}
            className="fx-press flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/12 px-3 text-[13px] text-gold-light transition-colors hover:bg-gold/20 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t.menu.addDish}
          </button>
        </div>
      </BoardHeader>

      <FilterPills options={options} value={category} onChange={setCategory} label={label} />

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
              onEdit={() => setEditing(d)}
              onSaved={() => router.refresh()}
            />
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}

      {editing && (
        <DishForm
          dish={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function DishRow({
  dish,
  busy,
  intl,
  run,
  onEdit,
  onSaved,
}: {
  dish: AdminDish
  busy: boolean
  intl: string
  run: (id: string, body: unknown) => Promise<boolean>
  onEdit: () => void
  onSaved: () => void
}) {
  const { t } = useAdminI18n()
  // Prices are edited as euros because that is what is on the printed menu;
  // the conversion to cents happens once, here, on submit.
  const [price, setPrice] = useState((dish.priceCents / 100).toFixed(2))
  const [saved, setSaved] = useState(false)

  const cents = toCents(price)
  const dirty = cents !== null && cents !== dish.priceCents

  const savePrice = async () => {
    if (cents === null || !dirty) return
    if (await run(dish.id, { itemId: dish.id, priceCents: cents })) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <li className={cn('card-lux flex gap-3 p-3', !dish.isAvailable && 'opacity-70')}>
      <span className="relative h-[62px] w-[72px] shrink-0 overflow-hidden rounded-md bg-black/40">
        {dish.image && <Image src={dish.image} alt="" fill sizes="72px" className="object-cover" />}
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
                cents !== null ? 'border-gold/30 focus:border-gold' : 'border-danger/60',
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

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="fx-press flex items-center gap-1.5 rounded-md border border-gold/35 px-2.5 py-1 text-[12px] text-gold transition-colors hover:bg-gold/10"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t.common.edit}
          </button>

          <DishVideoUpload
            itemId={dish.id}
            slug={dish.slug}
            hasVideo={dish.hasVideo}
            onSaved={onSaved}
          />

          <DeleteButton
            label={t.common.delete}
            confirmLabel={t.common.confirmDelete}
            disabled={busy}
            onDelete={() => void run(dish.id, { action: 'delete', itemId: dish.id })}
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

/**
 * Create or edit a dish.
 *
 * Names are required in all three languages, descriptions are not. A dish with
 * no German name would show up blank on the printed-menu side of the site,
 * which is the one people actually order from; a missing description just means
 * a shorter card.
 */
function DishForm({
  dish,
  categories,
  onClose,
  onSaved,
}: {
  dish: AdminDish | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useAdminI18n()
  const [draft, setDraft] = useState<DishDraft>(() =>
    dish
      ? {
          nameDe: dish.nameDe,
          nameEn: dish.nameEn,
          nameVi: dish.nameVi,
          descriptionDe: dish.descriptionDe,
          descriptionEn: dish.descriptionEn,
          descriptionVi: dish.descriptionVi,
          categoryId: dish.categoryId,
          priceEuro: (dish.priceCents / 100).toFixed(2),
          image: dish.image,
        }
      : emptyDraft(categories[0]?.id ?? ''),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof DishDraft>(key: K, value: DishDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const cents = toCents(draft.priceEuro)
  const valid =
    draft.nameDe.trim() &&
    draft.nameEn.trim() &&
    draft.nameVi.trim() &&
    draft.categoryId &&
    cents !== null

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(dish ? { itemId: dish.id } : { action: 'create' }),
          nameDe: draft.nameDe.trim(),
          nameEn: draft.nameEn.trim(),
          nameVi: draft.nameVi.trim(),
          descriptionDe: draft.descriptionDe.trim(),
          descriptionEn: draft.descriptionEn.trim(),
          descriptionVi: draft.descriptionVi.trim(),
          categoryId: draft.categoryId,
          priceCents: cents,
          image: draft.image,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? t.common.error)
        return
      }
      onSaved()
    } catch {
      setError(t.common.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title={dish ? t.menu.editDish : t.menu.addDish}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="fx-press rounded-lg border border-white/15 px-3 py-2 text-[13px] text-muted hover:border-gold/40 hover:text-gold"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={submit}
            className="fx-press flex items-center gap-2 rounded-lg border border-gold/50 bg-gold/12 px-3 py-2 text-[13px] text-gold-light transition-colors hover:bg-gold/20 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t.common.save}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`${t.common.name} (DE)`}>
          <input
            value={draft.nameDe}
            onChange={(e) => set('nameDe', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.common.name} (EN)`}>
          <input
            value={draft.nameEn}
            onChange={(e) => set('nameEn', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.common.name} (VI)`}>
          <input
            value={draft.nameVi}
            onChange={(e) => set('nameVi', e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label={t.menu.category}>
          <select
            value={draft.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className={fieldClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-background-soft">
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.common.price} hint={t.menu.priceHint}>
          <input
            value={draft.priceEuro}
            onChange={(e) => set('priceEuro', e.target.value)}
            inputMode="decimal"
            placeholder="14,90"
            className={cn(fieldClass, cents === null && draft.priceEuro && 'border-danger/60')}
          />
        </Field>

        <Field label={t.media.image} className="sm:col-span-2">
          <ImageUpload
            folder="menu-images"
            value={draft.image}
            onChange={(url) => set('image', url)}
            aspect="aspect-[16/9]"
          />
        </Field>

        <Field label={`${t.menu.description} (DE)`} className="sm:col-span-2">
          <textarea
            rows={2}
            value={draft.descriptionDe}
            onChange={(e) => set('descriptionDe', e.target.value)}
            className={cn(fieldClass, 'h-auto resize-none py-2')}
          />
        </Field>
        <Field label={`${t.menu.description} (EN)`}>
          <textarea
            rows={2}
            value={draft.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
            className={cn(fieldClass, 'h-auto resize-none py-2')}
          />
        </Field>
        <Field label={`${t.menu.description} (VI)`}>
          <textarea
            rows={2}
            value={draft.descriptionVi}
            onChange={(e) => set('descriptionVi', e.target.value)}
            className={cn(fieldClass, 'h-auto resize-none py-2')}
          />
        </Field>
      </div>

      <ErrorNote message={error} />
    </Modal>
  )
}
