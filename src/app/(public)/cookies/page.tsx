import type { Metadata } from 'next'

import { cookies } from '@/content/legal'
import { LegalPage } from '@/components/layout/LegalPage'

export const metadata: Metadata = { title: 'Cookie-Richtlinie' }

export default function Page() {
  return <LegalPage title="Cookie-Richtlinie" updated="30.07.2026" blocks={cookies} />
}
