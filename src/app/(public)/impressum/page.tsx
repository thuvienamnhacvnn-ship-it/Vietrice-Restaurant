import type { Metadata } from 'next'

import { impressum } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Impressum' }

export default function Page() {
  return <LegalPage title="Impressum" updated="30.07.2026" blocks={impressum} />
}