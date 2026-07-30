'use client'

import Image from 'next/image'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, Busy, EmptyNote, ErrorNote } from '@/components/admin/primitives'

export type AdminPromotion = {
  id: string
  title: string
  subtitle: string
  image: string | null
  discountPercent: number | null
  comboPriceCents: number | null
  startsAt: string
  endsAt: string
  isActive: boolean
}

export function PromotionsBoard({ promotions }: { promotions: AdminPromotion[] }) {
  const { t, intl } = useAdminI18n()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/content')

  const active = promotions.filter((p) => p.isActive).length
  const date = (iso: string) => new Date(iso).toLocaleDateString(intl, { dateStyle: 'medium' })

  return (
    <>
      <BoardHeader
        title={t.promotions.title}
        summary={fill(t.promotions.summary, { active, total: promotions.length })}
      />

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

                  <div className="mt-3 flex items-center gap-2 border-t border-gold/12 pt-3">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() =>
                        run(p.id, { entity: 'promotion', id: p.id, isActive: !p.isActive })
                      }
                      className={cn(
                        'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                        p.isActive
                          ? 'border-success/45 bg-success/10 text-success'
                          : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                      )}
                    >
                      {p.isActive ? t.promotions.deactivate : t.promotions.activate}
                    </button>
                    <Busy show={busyId === p.id} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}
    </>
  )
}
