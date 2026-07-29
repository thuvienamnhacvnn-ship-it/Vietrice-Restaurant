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
}

/**
 * Full-bleed background media.
 *
 * The poster image is always rendered underneath, so a missing or broken video
 * degrades to a still frame rather than a black box. Autoplay is only ever
 * attempted muted, which is what browsers require. Users who ask for reduced
 * motion get the still image and no video element at all.
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

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <Image
        src={poster}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className={cn(
          'object-cover transition-opacity duration-700',
          showVideo && ready ? 'opacity-0' : 'opacity-100',
        )}
      />

      {showVideo && (
        <video
          ref={videoRef}
          key={src}
          src={src ?? undefined}
          poster={poster}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onCanPlay={() => setReady(true)}
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
