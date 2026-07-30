'use client'

import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'

import { site } from '@/config/site'
import { useT } from '@/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * Google Maps embed for the restaurant address.
 *
 * Uses the keyless `output=embed` endpoint on purpose — the Maps JavaScript API
 * would require shipping a browser key, which the spec forbids. If the iframe
 * is blocked (consent tooling, offline, corporate policy) the component falls
 * back to a static card that links out to Google Maps.
 */
export function GoogleMap({
  className,
  zoom = 16,
  /**
   * The footer map is far below the fold, so it stays lazy. On the contact page
   * the map *is* the content — deferring it there means staring at an empty
   * frame for several seconds.
   */
  eager = false,
}: {
  className?: string
  zoom?: number
  eager?: boolean
}) {
  const t = useT()
  const [failed, setFailed] = useState(false)

  const query = encodeURIComponent(site.address.full)
  const embedSrc = `https://www.google.com/maps?q=${query}&z=${zoom}&output=embed`

  return (
    <div className={cn('card-lux relative overflow-hidden', className)}>
      {!failed ? (
        <iframe
          src={embedSrc}
          title={`${site.name} — ${site.address.full}`}
          loading={eager ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setFailed(true)}
          className="h-full w-full border-0 grayscale-[0.35] contrast-[1.05]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <MapPin className="h-7 w-7 text-gold" aria-hidden />
          <p className="text-sm text-muted">{t.footer.mapFallback}</p>
        </div>
      )}

      <a
        href={site.social.googleMaps}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md border border-gold/45 bg-black/75 px-3 py-1.5 text-[11px] font-medium uppercase tracking-luxe text-gold backdrop-blur-md transition-colors hover:border-gold hover:bg-gold/15"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {t.footer.openDirections}
      </a>
    </div>
  )
}
