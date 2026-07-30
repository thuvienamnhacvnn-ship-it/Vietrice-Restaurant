import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'

import { site } from '@/config/site'
import { openingHours } from '@/content/restaurant'
import { getDictionary, getLocale } from '@/i18n'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'
import { GoogleMap } from '@/components/layout/GoogleMap'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: `${site.legalName} — ${site.address.full}. Telefon ${site.phone.display}.`,
}

export default async function ContactPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)

  const open = openingHours.filter((h) => !h.isClosed)
  const uniform =
    open.length === 7 &&
    open.every((h) => h.opensAt === open[0].opensAt && h.closesAt === open[0].closesAt)

  /**
   * The four facts a guest comes to this page for, as equal-weight cards.
   * Previously they sat in a narrow column beside a small map, which left the
   * middle of the page empty and the map too small to actually navigate by.
   */
  const facts = [
    {
      Icon: MapPin,
      label: t.common.addressLabel,
      body: (
        <>
          {site.address.street}
          <br />
          {site.address.postalCode} {site.address.city}
        </>
      ),
      href: site.social.googleMaps,
      external: true,
    },
    {
      Icon: Phone,
      label: t.common.phoneLabel,
      body: site.phone.display,
      href: site.phone.href,
    },
    {
      Icon: Mail,
      label: t.common.emailLabel,
      body: site.email,
      href: `mailto:${site.email}`,
    },
    {
      Icon: Clock,
      label: t.footer.openingHours,
      body:
        open.length === 0 ? (
          t.footer.hoursNotSet
        ) : uniform ? (
          <>
            {t.weekdays[1]} – {t.weekdays[0]}
            <br />
            {open[0].opensAt} – {open[0].closesAt}
          </>
        ) : (
          <>
            {openingHours.map((h) => (
              <span key={h.weekday} className="block">
                {t.weekdays[h.weekday as keyof typeof t.weekdays]}:{' '}
                {h.isClosed ? '—' : `${h.opensAt} – ${h.closesAt}`}
              </span>
            ))}
          </>
        ),
    },
  ]

  return (
    <div className="pt-[var(--header-h)]">
      <Container wide className="py-12 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-[34px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[42px]">
              {t.nav.contact}
            </h1>
            <p className="mt-1.5 text-[14.5px] text-muted">{site.address.full}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/reservation" size="lg">
              {t.common.reserveTable}
            </ButtonLink>
            <ButtonLink href={site.phone.href} size="lg" variant="outline">
              <Phone className="h-4 w-4" aria-hidden />
              {site.phone.display}
            </ButtonLink>
          </div>
        </div>

        <div className="divider-lotus my-6">
          <span aria-hidden className="text-base">
            ❦
          </span>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {facts.map(({ Icon, label, body, href, external }) => {
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-luxe text-muted">
                    {label}
                  </span>
                  <span className="mt-0.5 block break-words text-[14px] leading-snug text-cream/90">
                    {body}
                  </span>
                </span>
              </>
            )

            return (
              <li key={label}>
                {href ? (
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="card-lux flex h-full items-start gap-3 p-4 transition-colors hover:border-gold/45"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="card-lux flex h-full items-start gap-3 p-4">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>

        {/* The map is the point of this page — give it the room to be read. */}
        <GoogleMap eager zoom={17} className="mt-4 h-[420px] w-full lg:h-[540px]" />
      </Container>
    </div>
  )
}
