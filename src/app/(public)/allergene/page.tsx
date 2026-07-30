import type { Metadata } from 'next'

import { allergene } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Allergeninformationen' }

export default function Page() {
  return <LegalPage title="Allergeninformationen" updated="30.07.2026" blocks={allergene} />
}