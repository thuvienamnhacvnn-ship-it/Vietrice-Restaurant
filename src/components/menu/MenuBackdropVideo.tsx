'use client'

import { cn } from '@/lib/utils'

/**
 * Dishes that have a transparent clip, keyed by slug.
 *
 * A map rather than a flag on the dish, because this is about which files
 * exist in `public/videos`, not about the menu itself: a dish is not different
 * for having been filmed. Adding one is a line here plus the file.
 */
export const DISH_BACKDROP_VIDEOS: Record<string, string> = {
  'banh-xeo': '/videos/banh-xeo-alpha.webm',
}

export function hasBackdropVideo(slug: string): boolean {
  return slug in DISH_BACKDROP_VIDEOS
}

/**
 * The selected dish, turning slowly behind the Smart Menu.
 *
 * A VP9 WebM carrying its own alpha channel, so the plate sits on the section's
 * background rather than on a rectangle of its own. It belongs to whichever
 * dish is open and disappears with it — decoration tied to a subject, not a
 * permanent fixture of the page. `aria-hidden` and `pointer-events-none` keep
 * it out of the reading order and out of the way of every control over it.
 *
 * Worth knowing about alpha WebM: Safari plays VP9 but ignores the alpha
 * channel, painting the transparent area black instead. Here that is close to
 * harmless — the section background is #080806, so the rectangle Safari draws
 * is within a few values of the backdrop it covers. On a light background it
 * would be a visible black box, and the fix is an HEVC-with-alpha MP4 beside
 * this file.
 */
export function MenuBackdropVideo({ slug, className }: { slug: string; className?: string }) {
  const src = DISH_BACKDROP_VIDEOS[slug]
  if (!src) return null

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[58%] select-none md:block',
        // Nothing to look at if the visitor has asked for stillness.
        'motion-reduce:hidden',
        className,
      )}
      style={{
        // Feathered only at the rim. Fading the centre as well made the first
        // attempt invisible: a dish at low opacity on a near-black page has
        // almost no contrast left to spend.
        maskImage: 'radial-gradient(ellipse 70% 70% at 55% 50%, #000 62%, transparent 96%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 55% 50%, #000 62%, transparent 96%)',
      }}
    >
      <video
        // Remounts when the dish changes, so a clip always opens on its first
        // frame instead of resuming wherever the previous dish's clip stopped.
        key={src}
        className="h-full w-full object-contain opacity-90"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        // No poster: a still frame flashing in before the clip decodes would
        // read as a glitch on something the eye is not meant to land on.
        src={src}
      />

      {/* The clip is brightest where the copy is darkest — pale lettuce under
          the description and the allergen line. Stacking order alone does not
          help: the text is already on top, it just had nothing to sit against.
          The scrim covers the leading third only, so the plate keeps its full
          brightness on the side nothing is written over. */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent to-40%" />
    </div>
  )
}
