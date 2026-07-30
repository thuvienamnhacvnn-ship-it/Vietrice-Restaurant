import type { Metadata } from 'next'

import { stornierung } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Stornierungsbedingungen' }

export default function Page() {
  return <LegalPage title="Stornierungsbedingungen" updated="30.07.2026" blocks={stornierung} />
}