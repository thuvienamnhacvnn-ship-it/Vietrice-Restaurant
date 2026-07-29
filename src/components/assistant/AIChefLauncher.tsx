'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

import { useT } from '@/i18n/provider'
import { cn } from '@/lib/utils'
import { AIChatPanel } from './AIChatPanel'

/**
 * Global AI Chef entry point pinned to the bottom-right, matching the mockups:
 * a circular half-body chef portrait above a compact gold-bordered card.
 * Clicking it opens the chat panel in place.
 */
export function AIChefLauncher() {
  const t = useT()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [overHero, setOverHero] = useState(false)

  /**
   * On the home page the hero's signature-dish strip occupies the bottom of the
   * viewport, and the reference layout puts the chef *above* that strip rather
   * than on top of it. Lift the launcher while the hero is in view, and drop it
   * back to the normal corner position once the page scrolls past.
   */
  useEffect(() => {
    if (pathname !== '/') {
      setOverHero(false)
      return
    }
    const onScroll = () => setOverHero(window.scrollY < window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <div
      className={cn(
        'fixed right-2 z-40 flex flex-col items-end transition-[bottom] duration-500 sm:right-4',
        overHero ? 'bottom-[292px] short:bottom-[262px]' : 'bottom-3 sm:bottom-4',
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 origin-bottom-right"
          >
            <AIChatPanel
              variant="floating"
              onClose={() => setOpen(false)}
              className="max-h-[70vh] w-[min(360px,calc(100vw-1.5rem))]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={`${t.assistant.title} — ${t.assistant.chatNow}`}
          aria-expanded={open}
          className="group flex flex-col items-center focus:outline-none"
        >
          <span
            className={cn(
              'relative grid h-[86px] w-[86px] place-items-center overflow-hidden rounded-full border-2 bg-background-soft transition-all duration-400 sm:h-[104px] sm:w-[104px]',
              hovered ? 'border-gold shadow-gold-lg' : 'border-gold/60 shadow-gold',
            )}
          >
            <Image
              src="/images/assistant/ai-chef.png"
              alt=""
              aria-hidden
              width={210}
              height={190}
              className="h-full w-full scale-[1.18] object-cover object-top"
            />
            <span
              aria-hidden
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_10px_2px_rgb(34_197_94/0.6)]"
            />
          </span>

          <span className="card-lux -mt-3 w-[152px] px-3 py-2 text-center sm:w-[172px]">
            <span className="block font-body text-[12.5px] font-semibold text-gold-light">
              {t.assistant.title}
            </span>
            <span className="mt-0.5 block text-[10.5px] text-muted">{t.assistant.status}</span>
            <span className="mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-gold">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {t.assistant.chatNow}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
