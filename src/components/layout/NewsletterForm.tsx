'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2, Send } from 'lucide-react'

import { useT } from '@/i18n/provider'
import { newsletterSchema, type NewsletterInput } from '@/lib/validation/newsletter'
import { Button } from '@/components/ui/Button'

/**
 * Double-opt-in newsletter signup. The consent checkbox is mandatory and the
 * server records a consent timestamp — the API never stores an address without
 * one (GDPR Art. 7).
 */
export function NewsletterForm() {
  const t = useT()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '', consent: false },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(await res.text())
      setDone(true)
      reset()
    } catch {
      setServerError(t.common.error)
    }
  })

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3.5">
        <Check className="h-5 w-5 shrink-0 text-success" aria-hidden />
        <p className="text-sm text-cream">{t.footer.newsletterSuccess}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-10"
    >
      <div>
        <h2 className="font-display text-xl text-gold-light">{t.footer.newsletter}</h2>
        <p className="mt-1 text-[13.5px] text-muted">{t.footer.newsletterText}</p>
      </div>

      <div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="newsletter-email" className="sr-only">
              {t.footer.newsletterPlaceholder}
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder={t.footer.newsletterPlaceholder}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'newsletter-email-error' : undefined}
              className="h-11 w-full rounded-md border border-gold/25 bg-black/40 px-4 text-sm text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p id="newsletter-email-error" className="mt-1.5 text-[12.5px] text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" size="md" disabled={isSubmitting} className="shrink-0">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {t.footer.subscribe}
          </Button>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-[12.5px] text-muted">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[color:rgb(var(--c-gold))]"
            aria-invalid={errors.consent ? true : undefined}
            {...register('consent')}
          />
          <span>{t.footer.newsletterConsent}</span>
        </label>
        {errors.consent && <p className="mt-1 text-[12.5px] text-danger">{errors.consent.message}</p>}
        {serverError && <p className="mt-1 text-[12.5px] text-danger">{serverError}</p>}
      </div>
    </form>
  )
}
