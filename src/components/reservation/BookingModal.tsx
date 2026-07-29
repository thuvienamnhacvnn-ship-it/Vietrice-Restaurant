'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, Phone, X } from 'lucide-react'

import { site } from '@/config/site'
import { RESERVATION_DEFAULTS } from '@/content/tables'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import type { TableView } from '@/lib/reservation'
import { reservationSchema, type ReservationInput } from '@/lib/validation/reservation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const COPY: Record<
  Locale,
  Record<
    | 'title'
    | 'name'
    | 'phone'
    | 'email'
    | 'emailHint'
    | 'guests'
    | 'date'
    | 'time'
    | 'duration'
    | 'occasion'
    | 'birthday'
    | 'highChair'
    | 'allergies'
    | 'notes'
    | 'policy'
    | 'submit'
    | 'successTitle'
    | 'successBody'
    | 'yourCode'
    | 'callHint'
    | 'close',
    string
  >
> = {
  de: {
    title: 'Reservierung abschliessen',
    name: 'Name',
    phone: 'Telefonnummer',
    email: 'E-Mail',
    emailHint: 'Optional — für die Bestätigung per E-Mail',
    guests: 'Personen',
    date: 'Datum',
    time: 'Uhrzeit',
    duration: 'Voraussichtliche Dauer',
    occasion: 'Besonderer Anlass',
    birthday: 'Geburtstag',
    highChair: 'Kinderstuhl benötigt',
    allergies: 'Allergien',
    notes: 'Anmerkungen',
    policy: 'Ich akzeptiere die Reservierungs- und Stornierungsbedingungen.',
    submit: 'Reservierung senden',
    successTitle: 'Reservierung eingegangen!',
    successBody:
      'Ihre Reservierung ist bei uns eingegangen und wird geprüft. Sie ist noch nicht bestätigt.',
    yourCode: 'Ihr Reservierungscode',
    callHint: 'Wir rufen Sie in Kürze zur Bestätigung an.',
    close: 'Schliessen',
  },
  en: {
    title: 'Complete your booking',
    name: 'Name',
    phone: 'Phone number',
    email: 'Email',
    emailHint: 'Optional — for email confirmation',
    guests: 'Guests',
    date: 'Date',
    time: 'Time',
    duration: 'Expected duration',
    occasion: 'Special occasion',
    birthday: 'Birthday',
    highChair: 'High chair needed',
    allergies: 'Allergies',
    notes: 'Notes',
    policy: 'I accept the reservation and cancellation policy.',
    submit: 'Send reservation',
    successTitle: 'Reservation received!',
    successBody: 'We have received your reservation and are reviewing it. It is not confirmed yet.',
    yourCode: 'Your booking code',
    callHint: 'We will call you shortly to confirm.',
    close: 'Close',
  },
  vi: {
    title: 'Hoàn tất đặt bàn',
    name: 'Họ và tên',
    phone: 'Số điện thoại',
    email: 'Email',
    emailHint: 'Không bắt buộc — để nhận email xác nhận',
    guests: 'Số người',
    date: 'Ngày',
    time: 'Giờ',
    duration: 'Thời lượng dự kiến',
    occasion: 'Dịp đặc biệt',
    birthday: 'Sinh nhật',
    highChair: 'Cần ghế trẻ em',
    allergies: 'Dị ứng',
    notes: 'Ghi chú',
    policy: 'Tôi đồng ý với chính sách đặt bàn và huỷ bàn.',
    submit: 'Gửi đặt bàn',
    successTitle: 'Đã nhận yêu cầu đặt bàn!',
    successBody: 'Chúng tôi đã nhận yêu cầu và đang kiểm tra. Đặt bàn chưa được xác nhận.',
    yourCode: 'Mã đặt bàn của bạn',
    callHint: 'Nhà hàng sẽ gọi điện xác nhận trong ít phút.',
    close: 'Đóng',
  },
}

const fieldClass =
  'h-11 w-full rounded-lg border border-gold/25 bg-black/40 px-3 text-[13.5px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none'

function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1 text-[12px] text-danger">{children}</p>
}

/**
 * Booking dialog.
 *
 * The submit button is disabled while a request is in flight, which — together
 * with the server's own conflict check inside a transaction — is what prevents
 * a double submit creating two reservations for the same table.
 */
export function BookingModal({
  open,
  onClose,
  table,
  date,
  time,
  partySize,
  initialNotes,
  onBooked,
}: {
  open: boolean
  onClose: () => void
  table: TableView | null
  date: string
  time: string
  partySize: number
  initialNotes: string
  onBooked?: () => void
}) {
  const { t, locale } = useI18n()
  const copy = COPY[locale]

  const [code, setCode] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      tableId: table?.id ?? '',
      tableNumber: table?.number ?? 0,
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      partySize,
      date,
      time,
      durationMinutes: RESERVATION_DEFAULTS.durationMinutes,
      occasion: '',
      isBirthday: false,
      needsHighChair: false,
      allergyNotes: '',
      notes: initialNotes,
      policyAccepted: false,
    },
  })

  // Keep hidden context fields in sync with the current floor-plan selection.
  useEffect(() => {
    if (!open) return
    setCode(null)
    setServerError(null)
    reset({
      tableId: table?.id ?? '',
      tableNumber: table?.number ?? 0,
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      partySize,
      date,
      time,
      durationMinutes: RESERVATION_DEFAULTS.durationMinutes,
      occasion: '',
      isBirthday: false,
      needsHighChair: false,
      allergyNotes: '',
      notes: initialNotes,
      policyAccepted: false,
    })
  }, [open, table, date, time, partySize, initialNotes, reset])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = (await res.json()) as { code?: string; error?: string }
      if (!res.ok) {
        setServerError(data.error ?? t.common.error)
        return
      }
      setCode(data.code ?? null)
      onBooked?.()
    } catch {
      setServerError(t.common.error)
    }
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <button
            type="button"
            aria-label={copy.close}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gold/25 bg-background-soft p-5 sm:rounded-2xl sm:p-7"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-md border border-gold/35 text-gold hover:bg-gold/10"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            {code ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-success/50 bg-success/12 text-success">
                  <CheckCircle2 className="h-8 w-8" aria-hidden />
                </span>
                <h2 id="booking-title" className="mt-4 font-display text-2xl text-gold-light">
                  {copy.successTitle}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
                  {copy.successBody}
                </p>

                <div className="mx-auto mt-5 max-w-xs rounded-xl border border-gold/30 bg-black/35 px-5 py-4">
                  <p className="text-[11.5px] uppercase tracking-luxe text-muted">
                    {copy.yourCode}
                  </p>
                  <p className="mt-1 font-display text-3xl tracking-wider text-gold-light">
                    {code}
                  </p>
                </div>

                <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-cream/80">
                  <Phone className="h-4 w-4 text-gold" aria-hidden />
                  {copy.callHint}
                </p>
                <a
                  href={site.phone.href}
                  className="mt-1 inline-block text-[13px] font-medium text-gold hover:underline"
                >
                  {site.phone.display}
                </a>

                <Button variant="outline" size="md" className="mt-6" onClick={onClose}>
                  {copy.close}
                </Button>
              </div>
            ) : (
              <>
                <h2 id="booking-title" className="font-display text-2xl text-gold-light">
                  {copy.title}
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  {table ? `Tisch ${table.number} · ${date} · ${time}` : ''}
                </p>

                <form onSubmit={onSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
                  <input type="hidden" {...register('tableId')} />
                  <input type="hidden" {...register('tableNumber', { valueAsNumber: true })} />
                  <input type="hidden" {...register('date')} />
                  <input type="hidden" {...register('time')} />
                  <input type="hidden" {...register('durationMinutes', { valueAsNumber: true })} />

                  <div>
                    <label htmlFor="bk-name" className="mb-1.5 block text-[12px] text-muted">
                      {copy.name} *
                    </label>
                    <input
                      id="bk-name"
                      autoComplete="name"
                      className={fieldClass}
                      aria-invalid={errors.guestName ? true : undefined}
                      {...register('guestName')}
                    />
                    <FieldError>{errors.guestName?.message}</FieldError>
                  </div>

                  <div>
                    <label htmlFor="bk-phone" className="mb-1.5 block text-[12px] text-muted">
                      {copy.phone} *
                    </label>
                    <input
                      id="bk-phone"
                      type="tel"
                      autoComplete="tel"
                      className={fieldClass}
                      aria-invalid={errors.guestPhone ? true : undefined}
                      {...register('guestPhone')}
                    />
                    <FieldError>{errors.guestPhone?.message}</FieldError>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bk-email" className="mb-1.5 block text-[12px] text-muted">
                      {copy.email}
                    </label>
                    <input
                      id="bk-email"
                      type="email"
                      autoComplete="email"
                      className={fieldClass}
                      aria-describedby="bk-email-hint"
                      {...register('guestEmail')}
                    />
                    <p id="bk-email-hint" className="mt-1 text-[11.5px] text-muted/80">
                      {copy.emailHint}
                    </p>
                    <FieldError>{errors.guestEmail?.message}</FieldError>
                  </div>

                  <div>
                    <label htmlFor="bk-party" className="mb-1.5 block text-[12px] text-muted">
                      {copy.guests} *
                    </label>
                    <select
                      id="bk-party"
                      className={cn(fieldClass, 'appearance-none')}
                      {...register('partySize', { valueAsNumber: true })}
                    >
                      {Array.from(
                        { length: RESERVATION_DEFAULTS.maxPartySize },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <option key={n} value={n} className="bg-background-soft">
                          {n}
                        </option>
                      ))}
                    </select>
                    <FieldError>{errors.partySize?.message}</FieldError>
                  </div>

                  <div>
                    <label htmlFor="bk-occasion" className="mb-1.5 block text-[12px] text-muted">
                      {copy.occasion}
                    </label>
                    <input id="bk-occasion" className={fieldClass} {...register('occasion')} />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bk-allergies" className="mb-1.5 block text-[12px] text-muted">
                      {copy.allergies}
                    </label>
                    <input id="bk-allergies" className={fieldClass} {...register('allergyNotes')} />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bk-notes" className="mb-1.5 block text-[12px] text-muted">
                      {copy.notes}
                    </label>
                    <textarea
                      id="bk-notes"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gold/25 bg-black/40 p-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
                      {...register('notes')}
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-cream/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[color:rgb(var(--c-gold))]"
                      {...register('isBirthday')}
                    />
                    {copy.birthday}
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-cream/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[color:rgb(var(--c-gold))]"
                      {...register('needsHighChair')}
                    />
                    {copy.highChair}
                  </label>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-cream/80">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[color:rgb(var(--c-gold))]"
                        aria-invalid={errors.policyAccepted ? true : undefined}
                        {...register('policyAccepted')}
                      />
                      <span>{copy.policy} *</span>
                    </label>
                    <FieldError>{errors.policyAccepted?.message}</FieldError>
                  </div>

                  {serverError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-[13px] text-danger sm:col-span-2"
                    >
                      {serverError}
                    </p>
                  )}

                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting || !table}
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                      {copy.submit}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
