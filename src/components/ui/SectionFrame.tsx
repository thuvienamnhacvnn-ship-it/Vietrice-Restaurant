import { cn } from '@/lib/utils'

/**
 * Desktop sections are pinned to the design mockups' 16:9 canvas.
 *
 * Every reference frame is 1672x941 (16:9), and the brief is that each section
 * occupies exactly that ratio on desktop so the built page matches the artwork
 * proportionally at any width. Below `lg` the ratio is dropped entirely — a
 * 16:9 box on a phone would be unusable — and the section falls back to its
 * natural height.
 *
 * `aspect-[16/9]` sets the height from the width, so children must lay
 * themselves out with `h-full` and flex/grid rather than relying on their own
 * intrinsic height.
 */
export function SectionFrame({
  children,
  className,
  innerClassName,
  /** Set for the hero, which fills the viewport instead of the 16:9 box. */
  fullscreen = false,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  innerClassName?: string
  fullscreen?: boolean
}) {
  return (
    <section className={cn('relative w-full overflow-hidden', className)} {...props}>
      <div
        className={cn(
          'relative mx-auto w-full max-w-[1920px]',
          fullscreen
            ? 'min-h-[100svh]'
            : // 16:9 on desktop; natural height on smaller screens.
              'lg:aspect-[16/9] lg:min-h-0',
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  )
}
