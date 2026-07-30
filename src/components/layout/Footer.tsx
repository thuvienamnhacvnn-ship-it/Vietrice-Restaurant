'use client'

import Link from 'next/link'
import {
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
  Star,
} from 'lucide-react'

import { site } from '@/config/site'
import { openingHours, reviewSummary, serviceLinks, supportLinks } from '@/content/restaurant'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { GoogleMap } from './GoogleMap'
import { NewsletterForm } from './NewsletterForm'

const socials = [
  { key: 'instagram', href: site.social.instagram, Icon: Instagram },
  { key: 'facebook', href: site.social.facebook, Icon: Facebook },
  { key: 'tiktok', href: site.social.tiktok, Icon: Music2 },
  { key: 'reviews', href: site.social.googleReviews, Icon: Globe },
] as const

/** Column heading shared by every footer column. */
function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 font-body text-[11.5px] font-semibold uppercase tracking-luxe text-gold-light">
      {children}
    </h2>
  )
}

function LinkList({ items }: { items: { key: string; href: string; label: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="group inline-flex items-center gap-1.5 text-[12.5px] text-cream/75 transition-colors hover:text-gold"
          >
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-gold/70 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Site footer, laid out to match mockup 6: brand blurb, contact details,
 * services, customer support, socials + review score, and the location map.
 */
/**
 * Site footer.
 *
 * `embedded` renders it as the lower band of the combined AI-Assistant section
 * (mockup 6 puts both inside a single 16:9 frame): tighter vertical rhythm, no
 * top border of its own, and the newsletter block is dropped because the mockup
 * does not show one there. Standalone pages get the full version.
 */
export function Footer({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n()

  const openDays = openingHours.filter((h) => !h.isClosed)
  const uniformHours =
    openDays.length === 7 &&
    openDays.every((h) => h.opensAt === openDays[0].opensAt && h.closesAt === openDays[0].closesAt)

  return (
    <footer
      className={cn(
        'relative bg-background-soft/60',
        embedded ? 'shrink-0 border-t border-gold/12' : 'border-t border-gold/15',
      )}
    >
      <Container wide className={cn(embedded ? 'py-4' : 'py-14 lg:py-16')}>
        <div className={cn('grid gap-8 lg:grid-cols-12', embedded && 'gap-4 lg:gap-4')}>
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo
              layout="stacked"
              size={embedded ? 'md' : 'lg'}
              asLink={false}
              className="items-start text-left"
            />
            <p
              className={cn(
                'mt-4 max-w-xs leading-relaxed text-muted',
                embedded ? 'text-[12px]' : 'text-[13.5px]',
              )}
            >
              {t.footer.about}
            </p>
            {!embedded && (
              <div className="divider-lotus mt-6 max-w-[220px]">
                <span aria-hidden className="text-sm">
                  ❦
                </span>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <ColumnTitle>{t.footer.contactInfo}</ColumnTitle>
            <ul className="space-y-2 text-[13px] text-cream/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>
                  {site.address.street}
                  <br />
                  {site.address.postalCode} {site.address.city}, {site.address.country}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                <a href={site.phone.href} className="hover:text-gold">
                  {site.phone.display}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                <a href={`mailto:${site.email}`} className="break-all hover:text-gold">
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  {site.domain}
                </a>
              </li>
            </ul>

            <div className="mt-3 rounded-lg border border-gold/20 bg-black/25 px-3 py-2">
              <p className="text-[12px] font-semibold uppercase tracking-luxe text-gold/85">
                {t.footer.openingHours}
              </p>
              {openDays.length === 0 ? (
                <p className="mt-1.5 text-[13px] text-muted">{t.footer.hoursNotSet}</p>
              ) : uniformHours ? (
                <p className="mt-1.5 text-[13px] text-cream/80">
                  {t.weekdays[1]} – {t.weekdays[0]}: {openDays[0].opensAt} – {openDays[0].closesAt}
                </p>
              ) : (
                <ul className="mt-1.5 space-y-1 text-[13px] text-cream/80">
                  {openingHours.map((h) => (
                    <li key={h.weekday} className="flex justify-between gap-3">
                      <span>{t.weekdays[h.weekday as keyof typeof t.weekdays]}</span>
                      <span className={cn(h.isClosed && 'text-muted')}>
                        {h.isClosed ? '—' : `${h.opensAt} – ${h.closesAt}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Services + support */}
          <div className="grid grid-cols-2 gap-6 lg:col-span-3">
            <div>
              <ColumnTitle>{t.footer.services}</ColumnTitle>
              <LinkList
                items={[
                  ...serviceLinks.map((l) => ({
                    key: l.key,
                    href: l.href,
                    label: t.nav[l.key],
                  })),
                  { key: 'assistant', href: '/ai-assistant', label: t.assistant.title },
                ]}
              />
            </div>
            <div>
              <ColumnTitle>{t.footer.support}</ColumnTitle>
              <LinkList
                items={supportLinks.map((l) => ({
                  key: l.key,
                  href: l.href,
                  label: t.footer.links[l.key],
                }))}
              />
            </div>
          </div>

          {/* Social + reviews */}
          <div className="lg:col-span-2">
            <ColumnTitle>{t.footer.connect}</ColumnTitle>
            <ul className="flex flex-wrap gap-2">
              {socials.map(({ key, href, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.social[key]}
                    className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-black/35 text-gold transition-all hover:border-gold hover:bg-gold/15 hover:shadow-gold"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <ColumnTitle>{t.footer.reviews}</ColumnTitle>
              <div className="flex items-center gap-2.5">
                <span className="flex" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(reviewSummary.score)
                          ? 'fill-gold text-gold'
                          : 'text-gold/30',
                      )}
                    />
                  ))}
                </span>
                <span className="text-sm font-medium text-cream">
                  {reviewSummary.score.toFixed(1)}/5
                </span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {reviewSummary.count}+ {t.footer.reviews.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Map — its own column, as in mockup 6 */}
          <div className="lg:col-span-2">
            <ColumnTitle>{t.footer.location}</ColumnTitle>
            <GoogleMap className={cn('w-full', embedded ? 'h-[122px]' : 'h-[190px]')} />
          </div>
        </div>

        {/* Newsletter — omitted in the embedded band; the mockup has none there. */}
        {!embedded && (
          <div className="mt-12 border-t border-gold/12 pt-8">
            <NewsletterForm />
          </div>
        )}
      </Container>

      <div className={cn('border-t border-gold/12', embedded ? 'py-2' : 'py-5')}>
        <Container wide className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[12.5px] text-muted">
            © {new Date().getFullYear()} {site.legalName}. {t.footer.rights}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted">
            <li>
              <Link href="/impressum" className="hover:text-gold">
                {t.footer.links.impressum}
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="hover:text-gold">
                {t.footer.links.privacy}
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-gold">
                {t.footer.links.cookies}
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  )
}
