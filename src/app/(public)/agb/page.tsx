import type { Metadata } from 'next'

import { agb } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Nutzungsbedingungen' }

export default function Page() {
  return <LegalPage title="Nutzungsbedingungen" updated="30.07.2026" blocks={agb} />
}