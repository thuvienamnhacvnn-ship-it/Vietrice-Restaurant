import type { Metadata } from 'next'

import { AIAssistantSection } from '@/components/assistant/AIAssistantSection'

export const metadata: Metadata = {
  title: 'AI Chef Assistant',
  description:
    'Der smarte Kulinarik-Assistent von Viet Rice — Gerichte finden, Allergien filtern, Angebote entdecken.',
}

export default function AIAssistantPage() {
  return (
      <>
      <AIAssistantSection />
    </>
  )
}
