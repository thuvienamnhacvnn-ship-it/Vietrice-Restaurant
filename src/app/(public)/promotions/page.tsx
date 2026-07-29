import type { Metadata } from 'next'

import { getLocale } from '@/i18n'
import { getActivePromotions, nextExpiring } from '@/lib/promotions'
import { PromotionsSection } from '@/components/promotions/PromotionsSection'

export const metadata: Metadata = {
  title: 'Special Promotions',
  description: 'Aktuelle Angebote und Aktionen im Viet Rice Berlin.',
}

export default async function PromotionsPage() {
  const locale = await getLocale()
  const now = new Date()
  const promotions = getActivePromotions(locale, now)
  const soonest = nextExpiring(promotions)

  return (
      <>
      <PromotionsSection
        promotions={promotions}
        soonestEndingIso={soonest?.endsAtIso ?? null}
        serverNowIso={now.toISOString()}
        showAllLink={false}
      />
    </>
  )
}
