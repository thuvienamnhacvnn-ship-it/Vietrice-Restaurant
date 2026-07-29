'use client'

import { useT } from '@/i18n/provider'
import { AIChefLauncher } from '@/components/assistant/AIChefLauncher'
import { Footer } from './Footer'
import { Header } from './Header'
import { SocialRail } from './SocialRail'

/**
 * Chrome shared by every public route: floating header, social rail and the
 * global AI Chef launcher. Admin routes deliberately do not use this shell.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const t = useT()

  return (
    <>
      <a href="#main" className="skip-link">
        {t.common.skipToContent}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <SocialRail />
      <AIChefLauncher />
    </>
  )
}
