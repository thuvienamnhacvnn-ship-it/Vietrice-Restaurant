'use client'

import { Facebook, Instagram, MapPin, Music2 } from 'lucide-react'

import { site } from '@/config/site'
import { useT } from '@/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * Sticky vertical social rail pinned to the right edge of the viewport.
 * On small screens it shrinks and tucks in so it never covers content.
 *
 * Lucide ships no TikTok glyph; `Music2` is the closest neutral stand-in and is
 * labelled correctly for screen readers.
 */
const links = [
  { key: 'instagram', href: site.social.instagram, Icon: Instagram },
  { key: 'facebook', href: site.social.facebook, Icon: Facebook },
  { key: 'tiktok', href: site.social.tiktok, Icon: Music2 },
  { key: 'maps', href: site.social.googleMaps, Icon: MapPin },
] as const

export function SocialRail({ className }: { className?: string }) {
  const t = useT()

  return (
    <nav
      aria-label={t.social.followUs}
      className={cn(
        'fixed right-2 top-1/2 z-40 -translate-y-1/2 sm:right-3 lg:right-5',
        'flex flex-col gap-2.5 sm:gap-3',
        className,
      )}
    >
      {links.map(({ key, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.social[key]}
          title={t.social[key]}
          className="group grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-black/45 text-gold backdrop-blur-md transition-all duration-300 hover:border-gold hover:bg-gold/15 hover:text-gold-light hover:shadow-gold sm:h-10 sm:w-10"
        >
          <Icon
            className="h-[15px] w-[15px] transition-transform duration-300 group-hover:scale-110 sm:h-4 sm:w-4"
            aria-hidden
          />
        </a>
      ))}
    </nav>
  )
}
