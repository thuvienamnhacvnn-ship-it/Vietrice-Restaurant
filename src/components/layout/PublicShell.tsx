'use client'

import { usePathname } from 'next/navigation'

import { useT } from '@/i18n/provider'
import { AIChefLauncher } from '@/components/assistant/AIChefLauncher'
import { Footer } from './Footer'
import { Header } from './Header'
import { SectionDots } from './SectionDots'
import { SocialRail } from './SocialRail'

/**
 * Chrome shared by every public route: floating header, social rail and the
 * global AI Chef launcher.
 *
 * The home page renders its own footer, fused with the AI-Assistant section
 * inside a single 16:9 frame (mockup 6), so the shell skips it there to avoid
 * rendering it twice. Admin routes deliberately do not use this shell.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const t = useT()
  const pathname = usePathname()
  const footerIsInPage = pathname === '/'

  return (
    <>
      <a href="#main" className="skip-link">
        {t.common.skipToContent}
      </a>
      <Header />
      <main id="main">{children}</main>
      {!footerIsInPage && <Footer />}
      <SectionDots />
      <SocialRail />
      <AIChefLauncher />
    </>
  )
}
