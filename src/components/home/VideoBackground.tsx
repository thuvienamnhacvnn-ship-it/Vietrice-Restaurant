'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

export type VideoBackgroundProps = {
  /** Video URL, or null when the dish has no footage yet. */
  src: string | null
  /** Always required — shown while loading, on error, and under reduced motion. */
  poster: string
  alt: string
  playing?: boolean
  muted?: boolean
  priority?: boolean
  className?: string
  onError?: () => void
  /**
   * Called when the clip reaches its end. Supplying this turns looping off —
   * a looping video never fires `ended`, so the two are mutually exclusive.
   * A dish with no footage still advances, on a timer, so the carousel cannot
   * stall on a still frame.
   */
  onEnded?: () => void
}

/**
 * Full-bleed background media.
 *
 * A missing or broken video degrades to the still frame rather than a black
 * box, but the still is never shown *in front of* a clip that is going to
 * play. Autoplay is only ever attempted muted, which is what browsers require.
 * Users who ask for reduced motion get the still image and no video at all.
 */
export function VideoBackground({
  src,
  poster,
  alt,
  playing = true,
  muted = true,
  priority = false,
  className,
  onError,
  onEnded,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Reset failure state when the source changes (carousel switches dish).
  useEffect(() => {
    setFailed(false)
    setReady(false)
  }, [src])

  useEffect(() => {
    const el = videoRef.current
    if (!el || failed) return
    el.muted = muted
    if (playing) {
      // A rejected play() is normal (autoplay policy) — fall back silently.
      void el.play().catch(() => setFailed(true))
    } else {
      el.pause()
    }
  }, [playing, muted, failed, src])

  const showVideo = Boolean(src) && !failed && !reducedMotion

  /**
   * Advance past a dish that has no playable video.
   *
   * Deliberately skipped under reduced motion: someone who asked the system to
   * stop moving things should not get a slideshow that advances on its own.
   */
  useEffect(() => {
    if (!onEnded || showVideo || !playing || reducedMotion) return
    const timer = setTimeout(onEnded, 7000)
    return () => clearTimeout(timer)
  }, [onEnded, showVideo, playing, reducedMotion, src])

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-background', className)}>
      {/* The still is for the cases where no clip will play: no footage, a
          broken file, or reduced motion. It used to render underneath every
          video too, which meant each switch flashed the thumbnail before the
          first frame arrived. Nothing to fade out now — the clip is the shot. */}
      {!showVideo && (
        <Image
          src={poster}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
      )}

      {showVideo && (
        <video
          ref={videoRef}
          key={src}
          src={src ?? undefined}
          // Deliberately no `poster`: the browser paints it until the first
          // video frame decodes, which is the flash this change removes.
          muted={muted}
          loop={!onEnded}
          playsInline
          // Metadata only. `auto` shortens the gap before the first frame but
          // holds the window `load` event open until the whole clip is down,
          // which left the tab spinning for as long as the download took.
          preload="metadata"
          aria-hidden
          onCanPlay={() => setReady(true)}
          onEnded={onEnded}
          onError={() => {
            setFailed(true)
            onError?.()
          }}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-700',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  )
}
