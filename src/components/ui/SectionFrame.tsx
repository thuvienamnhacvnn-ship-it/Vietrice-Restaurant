import { cn } from '@/lib/utils'

/**
 * One full-viewport section, framed to the design mockups' 16:9 canvas.
 *
 * Geometry (desktop):
 *  - the section is exactly one viewport tall, so every section is the same
 *    size and a scroll gesture always lands on exactly one of them;
 *  - the *content* sits in a centred box whose height is the full viewport and
 *    whose width is derived from it at 16:9 — the same proportions as the
 *    1672x941 reference frames;
 *  - backgrounds are rendered by the section itself, so they still bleed the
 *    full width and the 16:9 box never shows letterbox bars.
 *
 * Below `lg` both the ratio and the fixed height are dropped — a 16:9 box on a
 * phone would be unusable — and the section falls back to its natural height.
 *
 * `scroll-snap-align: start` + `scroll-snap-stop: always` (see globals.css)
 * make each section a hard stop while scrolling.
 */
export function SectionFrame({
  children,
  className,
  innerClassName,
  /** Opt out of snapping and fixed height (used by standalone sub-pages). */
  flow = false,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  innerClassName?: string
  flow?: boolean
}) {
  return (
    <section
      className={cn(
        'relative w-full overflow-hidden',
        !flow && 'lg:h-[100svh] lg:snap-section',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'relative mx-auto w-full',
          !flow && 'lg:h-full lg:w-auto lg:max-w-full lg:aspect-[16/9]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  )
}
