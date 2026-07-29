import Image from 'next/image'
import Link from 'next/link'

import { site } from '@/config/site'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

type LogoProps = {
  /** `stacked` = mark above wordmark (hero). `inline` = mark beside it (header). */
  layout?: 'stacked' | 'inline'
  size?: Size
  withTagline?: boolean
  asLink?: boolean
  className?: string
}

/**
 * Sizes are CSS classes rather than inline width/height so they can respond to
 * the `short` (viewport-height) breakpoint. The intrinsic width/height props
 * stay on <Image> purely to give Next the aspect ratio.
 */
const markClass: Record<Size, string> = {
  sm: 'w-[34px]',
  md: 'w-[46px] short:w-[40px]',
  lg: 'w-[84px] short:w-[68px]',
  xl: 'w-[104px] short:w-[78px]',
}

const wordClass: Record<Size, string> = {
  sm: 'text-lg',
  md: 'text-2xl short:text-xl',
  lg: 'text-4xl short:text-3xl',
  xl: 'text-[42px] sm:text-5xl short:text-[38px]',
}

const taglineClass: Record<Size, string> = {
  sm: 'text-[9px] tracking-[0.08em]',
  md: 'text-[9px] tracking-[0.08em]',
  lg: 'text-[11px] tracking-[0.12em] sm:text-xs',
  // Extra breathing room under the hero wordmark, as in the reference.
  xl: 'mt-2 text-[11px] tracking-[0.12em] sm:text-[13px]',
}

export function Logo({
  layout = 'inline',
  size = 'md',
  withTagline = true,
  asLink = true,
  className,
}: LogoProps) {
  const content = (
    <span
      className={cn(
        // `flex-nowrap` keeps the mark and wordmark on one line even when the
        // header bar is tight — the wordmark must never break across two rows.
        'flex flex-nowrap items-center gap-3 whitespace-nowrap',
        layout === 'stacked' && 'flex-col gap-2 text-center',
        className,
      )}
    >
      <Image
        src="/images/logo-mark.svg"
        alt=""
        aria-hidden
        width={240}
        height={292}
        priority
        style={{ height: 'auto' }}
        className={cn('shrink-0', markClass[size])}
      />
      <span className={cn('flex flex-col', layout === 'stacked' && 'items-center')}>
        {/* The reference sets the wordmark in a heavy sans, not the display
            serif used for headings. */}
        <span
          className={cn(
            'whitespace-nowrap font-body font-bold leading-none tracking-luxe text-gold-gradient',
            wordClass[size],
          )}
        >
          {site.name}
        </span>
        {withTagline && (
          <span className={cn('mt-1 font-body text-cream/70', taglineClass[size])}>
            {site.tagline}
          </span>
        )}
      </span>
    </span>
  )

  if (!asLink) return content

  return (
    <Link href="/" aria-label={`${site.name} — ${site.tagline}`} className="group">
      {content}
    </Link>
  )
}
