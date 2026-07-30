'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'

import { fill } from '@/i18n/admin'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, Busy, EmptyNote, ErrorNote } from '@/components/admin/primitives'

export type AdminMedia = {
  id: string
  url: string
  title: string
  category: string
  isVisible: boolean
  isFeatured: boolean
}

export function GalleryBoard({ media }: { media: AdminMedia[] }) {
  const { t } = useAdminI18n()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/content')

  const visible = media.filter((m) => m.isVisible).length

  return (
    <>
      <BoardHeader
        title={t.gallery.title}
        summary={fill(t.gallery.summary, { visible, total: media.length })}
      />

      <ErrorNote message={error} />

      {media.length === 0 ? (
        <EmptyNote message={t.gallery.empty} />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {media.map((m) => (
            <li key={m.id} className={cn('card-lux overflow-hidden', !m.isVisible && 'opacity-55')}>
              <span className="relative block aspect-[4/3] w-full">
                <Image
                  src={m.url}
                  alt={m.title}
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
                <p className="truncate text-[13px] text-cream">{m.title || m.category}</p>
                <p className="text-[11.5px] uppercase tracking-luxe text-muted">{m.category}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() =>
                      run(m.id, { entity: 'gallery', id: m.id, isVisible: !m.isVisible })
                    }
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
                    onClick={() =>
                      run(m.id, { entity: 'gallery', id: m.id, isFeatured: !m.isFeatured })
                    }
                    className={cn(
                      'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
                      m.isFeatured
                        ? 'border-gold/50 bg-gold/10 text-gold-light'
                        : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
                    )}
                  >
                    {m.isFeatured ? t.gallery.unfeature : t.gallery.feature}
                  </button>

                  <Busy show={busyId === m.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}
    </>
  )
}
