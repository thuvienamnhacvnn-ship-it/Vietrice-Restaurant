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
    open.length === 7 && open.every((h) => h.opensAt === open[0].opensAt && h.closesAt === open[0].closesAt)

  return (
    <div className="pt-[var(--header-h)]">
      <Container className="py-14 lg:py-20">
        <h1 className="font-display text-[34px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[42px]">
          {t.nav.contact}
        </h1>
        <div className="divider-lotus my-6 max-w-[320px]">
          <span aria-hidden className="text-base">
            ❦
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[14.5px] text-cream/85">
                  {site.address.street}
                  <br />
                  {site.address.postalCode} {site.address.city}, {site.address.country}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <Phone className="h-4 w-4" aria-hidden />
                </span>
                <a href={site.phone.href} className="text-[14.5px] text-cream/85 hover:text-gold">
                  {site.phone.display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <a
                  href={`mailto:${site.email}`}
                  className="break-all text-[14.5px] text-cream/85 hover:text-gold"
                >
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <Clock className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[14.5px] text-cream/85">
                  {open.length === 0 ? (
                    t.footer.hoursNotSet
                  ) : uniform ? (
                    <>
                      {t.weekdays[1]} – {t.weekdays[0]}
                      <br />
                      {open[0].opensAt} – {open[0].closesAt}
                    </>
                  ) : (
                    openingHours.map((h) => (
                      <span key={h.weekday} className="block">
                        {t.weekdays[h.weekday as keyof typeof t.weekdays]}:{' '}
                        {h.isClosed ? '—' : `${h.opensAt} – ${h.closesAt}`}
                      </span>
                    ))
                  )}
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/reservation" size="lg">
                {t.common.reserveTable}
              </ButtonLink>
              <ButtonLink href={site.phone.href} size="lg" variant="outline">
                <Phone className="h-4 w-4" aria-hidden />
                {site.phone.display}
              </ButtonLink>
            </div>
          </div>

          <GoogleMap className="h-[360px] w-full" />
        </div>
      </Container>
    </div>
  )
}
