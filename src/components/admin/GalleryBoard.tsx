'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Pencil, Plus, Star } from 'lucide-react'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
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
  fieldClass,
} from '@/components/admin/primitives'

const CATEGORIES = [
  'RESTAURANT',
  'SUSHI_BAR',
  'PRIVATE_ROOM',
  'OUTDOOR_AREA',
  'ATMOSPHERE',
  'FOOD_PRESENTATION',
] as const

export type GalleryCategory = (typeof CATEGORIES)[number]

export type AdminMedia = {
  id: string
  url: string
  title: string
  titleDe: string
  titleEn: string
  titleVi: string
  altText: string
  category: GalleryCategory
  isVisible: boolean
  isFeatured: boolean
  sortOrder: number
}

type Draft = {
  url: string | null
  category: GalleryCategory
  titleDe: string
  titleEn: string
  titleVi: string
  altText: string
  sortOrder: string
}

export function GalleryBoard({ media }: { media: AdminMedia[] }) {
  const { t } = useAdminI18n()
  const router = useRouter()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/gallery')
  const [editing, setEditing] = useState<AdminMedia | 'new' | null>(null)
  const [category, setCategory] = useState<string>('ALL')

  const visible = media.filter((m) => m.isVisible).length
  const shown = media.filter((m) => category === 'ALL' || m.category === category)

  const label = (key: string) =>
    key === 'ALL'
      ? t.common.all
      : (t.gallery.categories[key as GalleryCategory] ?? key)

  return (
    <>
      <BoardHeader
        title={t.gallery.title}
        summary={fill(t.gallery.summary, { visible, total: media.length })}
      >
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="fx-press flex h-10 items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/12 px-3 text-[13px] text-gold-light transition-colors hover:bg-gold/20"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.gallery.add}
        </button>
      </BoardHeader>

      <FilterPills
        options={['ALL', ...CATEGORIES]}
        value={category}
        onChange={setCategory}
        label={label}
      />

      <ErrorNote message={error} />

      {shown.length === 0 ? (
        <EmptyNote message={t.gallery.empty} />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id} className={cn('card-lux overflow-hidden', !m.isVisible && 'opacity-55')}>
              <span className="relative block aspect-[4/3] w-full">
                <Image
                  src={m.url}
                  alt={m.altText || m.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
                {m.isFeatured && (
                  <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-gold/60 bg-black/60 text-gold">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                  </span>
                )}
              </span>

              <div className="p-3">
                <p className="truncate text-[13px] text-cream">{m.title || '—'}</p>
                <p className="text-[11.5px] uppercase tracking-luxe text-muted">
                  {t.gallery.categories[m.category] ?? m.category}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => run(m.id, { id: m.id, isVisible: !m.isVisible })}
                    className={cn(
                      'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                      m.isVisible
                        ? 'border-success/45 bg-success/10 text-success'
                        : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                    )}
                  >
                    {m.isVisible ? t.gallery.hide : t.gallery.show}
                  </button>

                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => run(m.id, { id: m.id, isFeatured: !m.isFeatured })}
                    className={cn(
                      'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                      m.isFeatured
                        ? 'border-gold/50 bg-gold/10 text-gold-light'
                        : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                    )}
                  >
                    {m.isFeatured ? t.gallery.unfeature : t.gallery.feature}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="fx-press flex items-center gap-1.5 rounded-md border border-gold/35 px-2.5 py-1 text-[12px] text-gold transition-colors hover:bg-gold/10"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {t.common.edit}
                  </button>

                  <DeleteButton
                    label={t.common.delete}
                    confirmLabel={t.common.confirmDelete}
                    disabled={busyId === m.id}
                    onDelete={() => void run(m.id, { action: 'delete', id: m.id })}
                  />

                  <Busy show={busyId === m.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}

      {editing && (
        <MediaForm
          item={editing === 'new' ? null : editing}
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

function MediaForm({
  item,
  onClose,
  onSaved,
}: {
  item: AdminMedia | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useAdminI18n()
  const [draft, setDraft] = useState<Draft>(() => ({
    url: item?.url ?? null,
    category: item?.category ?? 'RESTAURANT',
    titleDe: item?.titleDe ?? '',
    titleEn: item?.titleEn ?? '',
    titleVi: item?.titleVi ?? '',
    altText: item?.altText ?? '',
    sortOrder: String(item?.sortOrder ?? 0),
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const sortOrder = Number(draft.sortOrder)
  const valid = Boolean(draft.url) && Number.isInteger(sortOrder) && sortOrder >= 0

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(item ? { id: item.id } : { action: 'create' }),
          url: draft.url,
          category: draft.category,
          titleDe: draft.titleDe.trim(),
          titleEn: draft.titleEn.trim(),
          titleVi: draft.titleVi.trim(),
          altText: draft.altText.trim(),
          sortOrder,
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
      title={item ? t.gallery.edit : t.gallery.add}
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
        <Field label={t.media.image} className="sm:col-span-2">
          <ImageUpload folder="gallery" value={draft.url} onChange={(url) => set('url', url)} />
        </Field>

        <Field label={t.gallery.category}>
          <select
            value={draft.category}
            onChange={(e) => set('category', e.target.value as GalleryCategory)}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-background-soft">
                {t.gallery.categories[c]}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.gallery.sortOrder} hint={t.gallery.sortHint}>
          <input
            value={draft.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
            inputMode="numeric"
            className={cn(fieldClass, !Number.isInteger(sortOrder) && 'border-danger/60')}
          />
        </Field>

        <Field label={t.gallery.altText} hint={t.gallery.altHint} className="sm:col-span-2">
          <input
            value={draft.altText}
            onChange={(e) => set('altText', e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label={`${t.gallery.caption} (DE)`}>
          <input
            value={draft.titleDe}
            onChange={(e) => set('titleDe', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.gallery.caption} (EN)`}>
          <input
            value={draft.titleEn}
            onChange={(e) => set('titleEn', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.gallery.caption} (VI)`} className="sm:col-span-2">
          <input
            value={draft.titleVi}
            onChange={(e) => set('titleVi', e.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>

      <ErrorNote message={error} />
    </Modal>
  )
}
