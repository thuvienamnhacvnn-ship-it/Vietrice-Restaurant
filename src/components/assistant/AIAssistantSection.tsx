'use client'

import Image from 'next/image'
import { CalendarCheck, Gift, Leaf, Soup } from 'lucide-react'

import { useI18n } from '@/i18n/provider'
import { Container } from '@/components/ui/Container'
import { AIChatPanel } from './AIChatPanel'

const QUICK_CARDS = [
  { key: 'suggest', Icon: Soup },
  { key: 'diet', Icon: Leaf },
  { key: 'booking', Icon: CalendarCheck },
  { key: 'offers', Icon: Gift },
] as const

/**
 * AI Chef Assistant page section, matching mockup 6: the chef portrait centred
 * on a dark restaurant backdrop, intro copy and capability cards on the left,
 * and the live chat panel on the right.
 */
export function AIAssistantSection() {
  const { t } = useI18n()

  return (
    <section
      aria-labelledby="assistant-heading"
      className="relative overflow-hidden border-t border-gold/10 py-14 lg:py-16"
    >
      {/* Restaurant backdrop */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/images/gallery/restaurant.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      <Container wide className="relative">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:gap-12">
          {/* ---- Left: intro + chef ---- */}
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="eyebrow">{t.assistant.title}</p>
              <h1
                id="assistant-heading"
                className="mt-2 font-display text-[30px] leading-tight text-cream sm:text-[38px]"
              >
                {t.assistant.heading}
              </h1>

              <div className="divider-lotus my-5 max-w-[300px]">
                <span aria-hidden className="text-sm">
                  ❦
                </span>
              </div>

              <p className="max-w-lg text-[14px] leading-relaxed text-muted">
                {t.assistant.intro}
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_CARDS.map(({ key, Icon }) => (
                  <li key={key} className="card-lux card-lux-hover p-4 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-gold/35 text-gold">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="mt-3 font-body text-[13px] font-semibold text-cream">
                      {t.assistant.quick[key].title}
                    </h2>
                    <p className="mt-1 text-[11.5px] leading-snug text-muted">
                      {t.assistant.quick[key].body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chef portrait */}
            <div className="relative mx-auto w-[220px] shrink-0 sm:w-[260px] lg:w-[300px]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(216,174,99,0.22),transparent_68%)]"
              />
              <Image
                src="/images/assistant/ai-chef.png"
                alt=""
                aria-hidden
                width={370}
                height={330}
                className="relative h-auto w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              />
            </div>
          </div>

          {/* ---- Right: chat ---- */}
          <AIChatPanel className="h-[600px] w-full" />
        </div>
      </Container>
    </section>
  )
}
