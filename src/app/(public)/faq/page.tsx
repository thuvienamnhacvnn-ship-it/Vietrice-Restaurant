import type { Metadata } from 'next'

import { faq } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Häufige Fragen' }

export default function Page() {
  return <LegalPage title="Häufige Fragen" updated="30.07.2026" blocks={faq} />
}