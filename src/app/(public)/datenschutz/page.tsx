import type { Metadata } from 'next'

import { datenschutz } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Datenschutzerklärung' }

export default function Page() {
  return <LegalPage title="Datenschutzerklärung" updated="30.07.2026" blocks={datenschutz} />
}