'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Info, Loader2, RotateCcw, Send, X } from 'lucide-react'

import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }

/**
 * Chat panel for the AI Chef Assistant.
 *
 * Answers come from `/api/chat`, which is grounded in the menu and promotion
 * data — the assistant never confirms a booking or an order itself, because
 * only the reservation/order endpoints can write one.
 */
export function AIChatPanel({
  onClose,
  className,
  variant = 'page',
}: {
  onClose?: () => void
  className?: string
  variant?: 'page' | 'floating'
}) {
  const { t, locale } = useI18n()

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.assistant.greeting },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const next: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, messages: next }),
      })
      if (!res.ok) throw new Error('chat failed')
      const data = (await res.json()) as { content: string; provider: string }
      setIsDemo(data.provider === 'demo')
      setMessages((m) => [...m, { role: 'assistant', content: data.content }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t.common.error }])
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const quickPrompts = [
    t.assistant.prompts.vegetarian,
    t.assistant.prompts.seafoodAllergy,
    t.assistant.prompts.bookTable,
    t.assistant.prompts.promotions,
  ]

  return (
    <div
      className={cn(
        'card-lux flex flex-col overflow-hidden',
        variant === 'floating' && 'h-[520px] w-[360px]',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
        <div>
          <p className="font-body text-[14px] font-semibold text-cream">{t.assistant.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
            {t.assistant.online}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMessages([{ role: 'assistant', content: t.assistant.greeting }])}
            aria-label={t.assistant.reset}
            className="grid h-8 w-8 place-items-center rounded-md border border-gold/30 text-gold hover:bg-gold/10"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="grid h-8 w-8 place-items-center rounded-md border border-gold/30 text-gold hover:bg-gold/10"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="border-b border-gold/10 px-4 py-3">
        <ul className="space-y-2">
          {quickPrompts.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                onClick={() => send(prompt)}
                disabled={busy}
                className="w-full rounded-lg border border-gold/25 bg-black/30 px-3.5 py-2.5 text-left text-[12.5px] text-cream/85 transition-colors hover:border-gold/55 hover:bg-gold/10 hover:text-gold-light disabled:opacity-50"
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Transcript */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={t.assistant.title}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[86%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                m.role === 'user'
                  ? 'rounded-br-sm bg-gold/18 text-cream'
                  : 'rounded-bl-sm border border-gold/18 bg-black/40 text-cream/90',
              )}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-gold/18 bg-black/40 px-3.5 py-2.5 text-[13px] text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" aria-hidden />
              {t.common.loading}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="border-t border-gold/15 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="ai-input" className="sr-only">
            {t.assistant.inputPlaceholder}
          </label>
          <input
            id="ai-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.assistant.inputPlaceholder}
            maxLength={2000}
            className="h-11 flex-1 rounded-lg border border-gold/25 bg-black/40 px-3.5 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label={t.assistant.send}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-gold/45 text-gold transition-colors hover:bg-gold/12 disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted/80">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {isDemo ? `${t.assistant.demoMode} ${t.assistant.disclaimer}` : t.assistant.disclaimer}
        </p>
      </form>
    </div>
  )
}
