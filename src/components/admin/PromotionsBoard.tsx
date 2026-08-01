'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Pencil, Plus } from 'lucide-react'

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
  Modal,
  fieldClass,
} from '@/components/admin/primitives'

export type AdminPromotion = {
  id: string
  titleDe: string
  titleEn: string
  titleVi: string
  subtitleDe: string
  subtitleEn: string
  subtitleVi: string
  descriptionDe: string
  descriptionEn: string
  descriptionVi: string
  title: string
  subtitle: string
  image: string | null
  discountPercent: number | null
  comboPriceCents: number | null
  startsAt: string
  endsAt: string
  isActive: boolean
}

type Draft = {
  titleDe: string
  titleEn: string
  titleVi: string
  subtitleDe: string
  subtitleEn: string
  subtitleVi: string
  descriptionDe: string
  descriptionEn: string
  descriptionVi: string
  image: string | null
  /** Which of the two offer types this promotion uses. */
  offer: 'discount' | 'combo' | 'none'
  discountPercent: string
  comboPriceEuro: string
  startsAt: string
  endsAt: string
  isActive: boolean
}

/** `datetime-local` wants `yyyy-MM-ddTHH:mm` in local time, not an ISO string. */
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function PromotionsBoard({ promotions }: { promotions: AdminPromotion[] }) {
  const { t, intl } = useAdminI18n()
  const router = useRouter()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/promotions')
  const [editing, setEditing] = useState<AdminPromotion | 'new' | null>(null)

  const active = promotions.filter((p) => p.isActive).length
  const date = (iso: string) => new Date(iso).toLocaleDateString(intl, { dateStyle: 'medium' })

  return (
    <>
      <BoardHeader
        title={t.promotions.title}
        summary={fill(t.promotions.summary, { active, total: promotions.length })}
      >
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="fx-press flex h-10 items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/12 px-3 text-[13px] text-gold-light transition-colors hover:bg-gold/20"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.promotions.add}
        </button>
      </BoardHeader>

      <ErrorNote message={error} />

      {promotions.length === 0 ? (
        <EmptyNote message={t.promotions.empty} />
      ) : (
        <ul className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {promotions.map((p) => {
            const expired = new Date(p.endsAt).getTime() < Date.now()
            return (
              <li key={p.id} className={cn('card-lux overflow-hidden', !p.isActive && 'opacity-65')}>
                {p.image && (
                  <span className="relative block aspect-[16/9] w-full">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover"
                    />
                  </span>
                )}

                <div className="p-4">
                  <p className="font-display text-[16px] uppercase tracking-wide text-gold-light">
                    {p.title}
                  </p>
                  {p.subtitle && <p className="text-[12.5px] text-muted">{p.subtitle}</p>}

                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                    {p.discountPercent !== null && (
                      <span className="rounded border border-gold/40 px-2 py-0.5 text-gold">
                        {t.promotions.discount} −{p.discountPercent}%
                      </span>
                    )}
                    {p.comboPriceCents !== null && (
                      <span className="rounded border border-gold/40 px-2 py-0.5 text-gold">
                        {t.promotions.comboPrice}{' '}
                        {new Intl.NumberFormat(intl, {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(p.comboPriceCents / 100)}
                      </span>
                    )}
                    {expired && (
                      <span className="rounded border border-danger/40 px-2 py-0.5 text-danger">
                        {t.promotions.expired}
                      </span>
                    )}
                  </p>

                  <p className="mt-1.5 text-[12px] text-muted">
                    {t.promotions.runsFrom} {date(p.startsAt)} {t.promotions.until} {date(p.endsAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gold/12 pt-3">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => run(p.id, { id: p.id, isActive: !p.isActive })}
                      className={cn(
                        'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                        p.isActive
                          ? 'border-success/45 bg-success/10 text-success'
                          : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                      )}
                    >
                      {p.isActive ? t.promotions.deactivate : t.promotions.activate}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="fx-press flex items-center gap-1.5 rounded-md border border-gold/35 px-2.5 py-1 text-[12px] text-gold transition-colors hover:bg-gold/10"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      {t.common.edit}
                    </button>

                    <DeleteButton
                      label={t.common.delete}
                      confirmLabel={t.common.confirmDelete}
                      disabled={busyId === p.id}
                      onDelete={() => void run(p.id, { action: 'delete', id: p.id })}
                    />

                    <Busy show={busyId === p.id} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}

      {editing && (
        <PromotionForm
          promotion={editing === 'new' ? null : editing}
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

function PromotionForm({
  promotion,
  onClose,
  onSaved,
}: {
  promotion: AdminPromotion | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useAdminI18n()

  const [draft, setDraft] = useState<Draft>(() => {
    if (!promotion) {
      // A new event defaults to a week starting today: the common case is a
      // run of days, and a blank date pair is the field people get wrong.
      const start = new Date()
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      return {
        titleDe: '',
        titleEn: '',
        titleVi: '',
        subtitleDe: '',
        subtitleEn: '',
        subtitleVi: '',
        descriptionDe: '',
        descriptionEn: '',
        descriptionVi: '',
        image: null,
        offer: 'none',
        discountPercent: '',
        comboPriceEuro: '',
        startsAt: toLocalInput(start.toISOString()),
        endsAt: toLocalInput(end.toISOString()),
        isActive: true,
      }
    }
    return {
      titleDe: promotion.titleDe,
      titleEn: promotion.titleEn,
      titleVi: promotion.titleVi,
      subtitleDe: promotion.subtitleDe,
      subtitleEn: promotion.subtitleEn,
      subtitleVi: promotion.subtitleVi,
      descriptionDe: promotion.descriptionDe,
      descriptionEn: promotion.descriptionEn,
      descriptionVi: promotion.descriptionVi,
      image: promotion.image,
      offer:
        promotion.discountPercent !== null
          ? 'discount'
          : promotion.comboPriceCents !== null
            ? 'combo'
            : 'none',
      discountPercent: promotion.discountPercent?.toString() ?? '',
      comboPriceEuro:
        promotion.comboPriceCents !== null ? (promotion.comboPriceCents / 100).toFixed(2) : '',
      startsAt: toLocalInput(promotion.startsAt),
      endsAt: toLocalInput(promotion.endsAt),
      isActive: promotion.isActive,
    }
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const startIso = fromLocalInput(draft.startsAt)
  const endIso = fromLocalInput(draft.endsAt)
  const datesOk = Boolean(startIso && endIso && new Date(endIso!) > new Date(startIso!))

  const discount = draft.offer === 'discount' ? Number(draft.discountPercent) : null
  const comboCents =
    draft.offer === 'combo'
      ? Math.round(parseFloat(draft.comboPriceEuro.replace(',', '.')) * 100)
      : null

  const offerOk =
    draft.offer === 'none' ||
    (draft.offer === 'discount' && Number.isInteger(discount) && discount! >= 1 && discount! <= 100) ||
    (draft.offer === 'combo' && Number.isFinite(comboCents) && comboCents! >= 0)

  const valid =
    draft.titleDe.trim() && draft.titleEn.trim() && draft.titleVi.trim() && datesOk && offerOk

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: promotion ? 'edit' : 'create',
          ...(promotion ? { id: promotion.id } : {}),
          titleDe: draft.titleDe.trim(),
          titleEn: draft.titleEn.trim(),
          titleVi: draft.titleVi.trim(),
          subtitleDe: draft.subtitleDe.trim(),
          subtitleEn: draft.subtitleEn.trim(),
          subtitleVi: draft.subtitleVi.trim(),
          descriptionDe: draft.descriptionDe.trim(),
          descriptionEn: draft.descriptionEn.trim(),
          descriptionVi: draft.descriptionVi.trim(),
          image: draft.image,
          discountPercent: draft.offer === 'discount' ? discount : null,
          comboPriceCents: draft.offer === 'combo' ? comboCents : null,
          startsAt: startIso,
          endsAt: endIso,
          isActive: draft.isActive,
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

  const OFFERS: { key: Draft['offer']; label: string }[] = [
    { key: 'none', label: t.promotions.offerNone },
    { key: 'discount', label: t.promotions.discount },
    { key: 'combo', label: t.promotions.comboPrice },
  ]

  return (
    <Modal
      open
      title={promotion ? t.promotions.edit : t.promotions.add}
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
        <Field label={`${t.promotions.eventTitle} (DE)`}>
          <input
            value={draft.titleDe}
            onChange={(e) => set('titleDe', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.promotions.eventTitle} (EN)`}>
          <input
            value={draft.titleEn}
            onChange={(e) => set('titleEn', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.promotions.eventTitle} (VI)`}>
          <input
            value={draft.titleVi}
            onChange={(e) => set('titleVi', e.target.value)}
            className={fieldClass}
          />
        </Field>

        <Field label={t.promotions.offer}>
          <select
            value={draft.offer}
            onChange={(e) => set('offer', e.target.value as Draft['offer'])}
            className={fieldClass}
          >
            {OFFERS.map((o) => (
              <option key={o.key} value={o.key} className="bg-background-soft">
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {draft.offer === 'discount' && (
          <Field label={`${t.promotions.discount} (%)`}>
            <input
              value={draft.discountPercent}
              onChange={(e) => set('discountPercent', e.target.value)}
              inputMode="numeric"
              placeholder="20"
              className={fieldClass}
            />
          </Field>
        )}

        {draft.offer === 'combo' && (
          <Field label={`${t.promotions.comboPrice} (€)`}>
            <input
              value={draft.comboPriceEuro}
              onChange={(e) => set('comboPriceEuro', e.target.value)}
              inputMode="decimal"
              placeholder="29,90"
              className={fieldClass}
            />
          </Field>
        )}

        <Field label={t.promotions.startsAt}>
          <input
            type="datetime-local"
            value={draft.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={t.promotions.endsAt}>
          <input
            type="datetime-local"
            value={draft.endsAt}
            onChange={(e) => set('endsAt', e.target.value)}
            className={cn(fieldClass, !datesOk && 'border-danger/60')}
          />
        </Field>

        <Field label={t.media.image} className="sm:col-span-2">
          <ImageUpload
            folder="promotions"
            value={draft.image}
            onChange={(url) => set('image', url)}
            aspect="aspect-[16/9]"
          />
        </Field>

        <Field label={`${t.promotions.subtitle} (DE)`}>
          <input
            value={draft.subtitleDe}
            onChange={(e) => set('subtitleDe', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.promotions.subtitle} (EN)`}>
          <input
            value={draft.subtitleEn}
            onChange={(e) => set('subtitleEn', e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={`${t.promotions.subtitle} (VI)`} className="sm:col-span-2">
          <input
            value={draft.subtitleVi}
            onChange={(e) => set('subtitleVi', e.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>

      {!datesOk && <p className="mt-2 text-[12px] text-danger">{t.promotions.dateOrder}</p>}

      <ErrorNote message={error} />
    </Modal>
  )
}
