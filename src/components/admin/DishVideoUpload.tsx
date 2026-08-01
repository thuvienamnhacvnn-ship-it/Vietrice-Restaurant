'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Film, Loader2, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'

/**
 * Grab a representative still from the chosen file, in the browser.
 *
 * The poster has to be a frame of the video, not a separate photograph, or the
 * banner visibly jumps the moment the clip finishes buffering. Vercel has no
 * ffmpeg, so the frame is decoded client-side — the file is already in memory
 * there, which also means one less round trip.
 */
function captureFrame(file: File, atSeconds = 1): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    const done = (blob: Blob | null) => {
      URL.revokeObjectURL(url)
      resolve(blob)
    }

    video.onloadedmetadata = () => {
      // A clip shorter than the requested mark would seek past the end and
      // never fire `seeked`; fall back to its midpoint.
      video.currentTime = Math.min(atSeconds, Math.max(0, video.duration / 2))
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(video.videoWidth, 1600)
      canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight)
      const ctx = canvas.getContext('2d')
      if (!ctx) return done(null)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((b) => done(b), 'image/jpeg', 0.82)
    }
    video.onerror = () => done(null)
    video.src = url
  })
}

export function DishVideoUpload({
  itemId,
  slug,
  hasVideo,
  onSaved,
}: {
  itemId: string
  slug: string
  hasVideo: boolean
  onSaved: () => void
}) {
  const { t } = useAdminI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, ...body }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? t.common.error)
    }
  }

  const onPick = async (file: File) => {
    setError(null)
    try {
      setBusy(t.menu.uploadingVideo)
      const videoBlob = await upload(`dish-videos/${slug}.mp4`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        contentType: file.type,
      })

      // A missing frame is not a reason to lose the video; keep the old poster.
      setBusy(t.menu.uploadingPoster)
      const frame = await captureFrame(file)
      let posterUrl: string | undefined
      if (frame) {
        const posterBlob = await upload(
          `dish-videos/${slug}-poster.jpg`,
          new File([frame], `${slug}-poster.jpg`, { type: 'image/jpeg' }),
          { access: 'public', handleUploadUrl: '/api/admin/upload', contentType: 'image/jpeg' },
        )
        posterUrl = posterBlob.url
      }

      setBusy(t.common.save)
      await save({
        video: videoBlob.url,
        ...(posterUrl ? { poster: posterUrl, image: posterUrl } : {}),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setBusy(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async () => {
    setError(null)
    setBusy(t.common.save)
    try {
      await save({ video: null })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setBusy(null)
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onPick(file)
        }}
      />

      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'fx-press flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
          hasVideo
            ? 'border-gold/50 bg-gold/10 text-gold-light'
            : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Film className="h-3.5 w-3.5" aria-hidden />
        )}
        {busy ?? (hasVideo ? t.menu.replaceVideo : t.menu.addVideo)}
      </button>

      {hasVideo && !busy && (
        <button
          type="button"
          onClick={remove}
          aria-label={t.menu.removeVideo}
          className="fx-press grid h-7 w-7 place-items-center rounded-md border border-danger/35 text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      {error && <span className="text-[11.5px] text-danger">{error}</span>}
    </span>
  )
}
