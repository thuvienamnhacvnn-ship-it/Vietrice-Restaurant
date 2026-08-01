'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { upload } from '@vercel/blob/client'
import { ImagePlus, Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'

/**
 * Pick an image, put it on Blob storage, hand back the URL.
 *
 * The component owns the upload but not the saving: it reports a URL and the
 * form around it decides when that becomes part of a row. Uploading and saving
 * as one step would strand a file on storage every time someone changes their
 * mind about a dish they were half-way through creating.
 *
 * A phone photo straight from a camera roll is routinely 4–8 MB, which is why
 * this goes browser-to-Blob rather than through a serverless function with a
 * 4.5 MB body limit.
 */
export function ImageUpload({
  folder,
  value,
  onChange,
  aspect = 'aspect-[4/3]',
}: {
  /** Blob folder, must be one the upload route allows. */
  folder: 'menu-images' | 'promotions' | 'gallery'
  value: string | null
  onChange: (url: string | null) => void
  aspect?: string
}) {
  const { t } = useAdminI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File) => {
    setError(null)
    setBusy(true)
    try {
      // The name is only a hint — the route adds a random suffix, so two dishes
      // called "pho" cannot overwrite each other's photograph.
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-60)
      const blob = await upload(`${folder}/${safe}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        contentType: file.type,
      })
      onChange(blob.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void pick(file)
        }}
      />

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-gold/25 bg-black/40',
          aspect,
        )}
      >
        {value ? (
          <Image src={value} alt="" fill sizes="360px" className="object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[12px] text-muted">
            {t.media.noImage}
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="fx-press flex items-center gap-1.5 rounded-md border border-gold/40 px-2.5 py-1 text-[12px] text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          {value ? t.media.replace : t.media.upload}
        </button>

        {value && !busy && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t.media.remove}
            className="fx-press grid h-7 w-7 place-items-center rounded-md border border-danger/35 text-danger hover:bg-danger/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-[11.5px] text-danger">{error}</p>}
    </div>
  )
}
