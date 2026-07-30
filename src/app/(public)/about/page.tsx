import type { Metadata } from 'next'
import Image from 'next/image'

import { site } from '@/config/site'
import { venueStats } from '@/content/restaurant'
import { getPublicGallery } from '@/server/catalogue'
import { getDictionary, getLocale } from '@/i18n'
import { Container } from '@/components/ui/Container'
import { ButtonLink } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Über uns',
  description: `${site.legalName} — authentische vietnamesische Küche und frisches Sushi im Herzen von Berlin.`,
}

const COPY = {
  de: {
    lead: 'Authentische vietnamesische Küche und frisches Sushi im Herzen von Berlin.',
    body: [
      'Viet Rice bringt die Aromen Vietnams nach Berlin-Moabit: klare Brühen, die stundenlang ziehen, frische Kräuter, und Rezepte, die in Familien weitergegeben wurden.',
      'An der Sushi-Bar arbeiten unsere Sushi-Meister täglich mit frischem Fisch. Klassisch, sorgfältig, ohne Abkürzungen.',
      'Ob ein schnelles Mittagessen, ein Abend zu zweit oder eine Feier im privaten Raum — wir möchten, dass Sie sich wie zu Hause fühlen.',
    ],
    seats: 'Sitzplätze',
    rooms: 'Private Räume',
    parking: 'Parkplätze',
  },
  en: {
    lead: 'Authentic Vietnamese cuisine and fresh sushi in the heart of Berlin.',
    body: [
      'Viet Rice brings the flavours of Vietnam to Berlin-Moabit: clear broths simmered for hours, fresh herbs, and recipes passed down through families.',
      'At the sushi bar our chefs work with fresh fish every day. Classic, careful, no shortcuts.',
      'A quick lunch, an evening for two, or a celebration in the private room — we want you to feel at home.',
    ],
    seats: 'Seats',
    rooms: 'Private rooms',
    parking: 'Parking',
  },
  vi: {
    lead: 'Ẩm thực Việt đích thực và sushi tươi giữa lòng Berlin.',
    body: [
      'Viet Rice mang hương vị Việt Nam đến Berlin-Moabit: nước dùng trong ninh hàng giờ, rau thơm tươi, và những công thức được truyền lại trong gia đình.',
      'Tại quầy sushi, các đầu bếp của chúng tôi làm việc với cá tươi mỗi ngày. Cổ điển, tỉ mỉ, không đi đường tắt.',
      'Một bữa trưa nhanh, một buổi tối cho hai người, hay một buổi tiệc trong phòng riêng — chúng tôi mong bạn thấy như ở nhà.',
    ],
    seats: 'Chỗ ngồi',
    rooms: 'Phòng riêng',
    parking: 'Bãi đỗ xe',
  },
} as const

export default async function AboutPage() {
  const [locale, galleryItems] = await Promise.all([getLocale(), getPublicGallery()])
  const t = getDictionary(locale)
  const copy = COPY[locale]
  const panorama = galleryItems.find((g) => g.isFeatured) ?? galleryItems[0]

  return (
    <div className="pt-[var(--header-h)]">
      <Container className="py-14 lg:py-20">
        <h1 className="font-display text-[34px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[42px]">
          {t.nav.about}
        </h1>
        <p className="mt-2 font-script text-[26px] text-cream/90 sm:text-[30px]">{copy.lead}</p>

        <div className="divider-lotus my-7 max-w-[320px]">
          <span aria-hidden className="text-base">
            ❦
          </span>
        </div>

        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-gold/20">
          <Image
            src={panorama.url}
            alt={panorama.altText}
            fill
            sizes="(max-width: 1280px) 100vw, 1240px"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            {copy.body.map((p) => (
              <p key={p} className="text-[15px] leading-relaxed text-cream/80">
                {p}
              </p>
            ))}
            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href="/reservation" size="lg">
                {t.common.reserveTable}
              </ButtonLink>
              <ButtonLink href="/menu" size="lg" variant="outline">
                {t.common.viewMenu}
              </ButtonLink>
            </div>
          </div>

          <ul className="grid grid-cols-3 gap-3 self-start lg:grid-cols-1">
            {[
              { value: `${venueStats.seats}+`, label: copy.seats },
              { value: String(venueStats.privateRooms), label: copy.rooms },
              { value: venueStats.hasParking ? '✓' : '—', label: copy.parking },
            ].map((s) => (
              <li key={s.label} className="card-lux p-4 text-center lg:text-left">
                <span className="block font-display text-3xl leading-none text-gold-light">
                  {s.value}
                </span>
                <span className="mt-1 block text-[12px] uppercase tracking-luxe text-muted">
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  )
}
