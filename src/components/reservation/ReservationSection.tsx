'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, CheckCircle2, Clock, Phone, ShieldCheck, Users, XCircle } from 'lucide-react'

import { RESERVATION_DEFAULTS } from '@/content/tables'
import { site } from '@/config/site'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import {
  buildTimeSlots,
  combineDateTime,
  isSelectable,
  toDateInput,
  type TableView,
} from '@/lib/reservation'
import { cn } from '@/lib/utils'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { SectionFrame } from '@/components/ui/SectionFrame'
import { BookingModal } from './BookingModal'
import { FloorDecor } from './FloorDecor'
import { TableCard } from './TableCard'

const COPY: Record<
  Locale,
  {
    title: string
    chooseTable: string
    stepDate: string
    stepTime: string
    stepGuests: string
    stepWishes: string
    wishesPlaceholder: string
    findTable: string
    legendAvailable: string
    legendOccupied: string
    legendSelected: string
    yourSelection: string
    table: string
    notSelected: string
    date: string
    time: string
    guests: string
    total: string
    continue: string
    eventsTitle: string
    eventsBody: string
    available: string
    occupied: string
    pending: string
    blocked: string
    seats: string
    tooSmall: string
    noneFree: string
    trust: { title: string; body: string }[]
  }
> = {
  de: {
    title: 'Online Reservation',
    chooseTable: 'Wählen Sie Ihren Tisch',
    stepDate: '1. Datum wählen',
    stepTime: '2. Uhrzeit wählen',
    stepGuests: '3. Personen',
    stepWishes: '4. Besondere Wünsche (Optional)',
    wishesPlaceholder: 'z.B. Geburtstag, Allergien, Kinderstuhl…',
    findTable: 'Tisch finden',
    legendAvailable: 'Verfügbar',
    legendOccupied: 'Besetzt',
    legendSelected: 'Ausgewählt',
    yourSelection: 'Ihre Auswahl',
    table: 'Tisch',
    notSelected: 'Noch nicht ausgewählt',
    date: 'Datum',
    time: 'Uhrzeit',
    guests: 'Personen',
    total: 'Gesamt',
    continue: 'Reservierung weiter',
    eventsTitle: 'Feiern Sie besondere Momente bei Viet Rice',
    eventsBody: 'Geburtstage, Firmenfeiern oder private Events – wir machen es unvergesslich.',
    available: 'verfügbar',
    occupied: 'besetzt',
    pending: 'reserviert',
    blocked: 'nicht verfügbar',
    seats: 'Plätze',
    tooSmall: 'zu klein',
    noneFree: 'Für diese Zeit ist kein passender Tisch frei. Bitte wählen Sie eine andere Uhrzeit.',
    trust: [
      { title: 'Sicher & einfach', body: 'Ihre Daten sind sicher. Reservierung in wenigen Klicks.' },
      { title: 'Sofort Bestätigung', body: 'Wir rufen Sie zur Bestätigung an.' },
      { title: 'Kostenlos stornieren', body: 'Bis 4 Stunden vor Ihrer Reservierung kostenlos stornieren.' },
      { title: 'Brauchen Sie Hilfe?', body: `Rufen Sie uns an: ${site.phone.display}` },
    ],
  },
  en: {
    title: 'Online Reservation',
    chooseTable: 'Choose your table',
    stepDate: '1. Choose a date',
    stepTime: '2. Choose a time',
    stepGuests: '3. Guests',
    stepWishes: '4. Special requests (optional)',
    wishesPlaceholder: 'e.g. birthday, allergies, high chair…',
    findTable: 'Find a table',
    legendAvailable: 'Available',
    legendOccupied: 'Occupied',
    legendSelected: 'Selected',
    yourSelection: 'Your selection',
    table: 'Table',
    notSelected: 'Not selected yet',
    date: 'Date',
    time: 'Time',
    guests: 'Guests',
    total: 'Total',
    continue: 'Continue booking',
    eventsTitle: 'Celebrate special moments at Viet Rice',
    eventsBody: 'Birthdays, company events or private parties — we make them unforgettable.',
    available: 'available',
    occupied: 'occupied',
    pending: 'on hold',
    blocked: 'unavailable',
    seats: 'seats',
    tooSmall: 'too small',
    noneFree: 'No suitable table is free at this time. Please choose another slot.',
    trust: [
      { title: 'Safe & simple', body: 'Your data is secure. Book in just a few clicks.' },
      { title: 'Fast confirmation', body: 'We call you to confirm your booking.' },
      { title: 'Free cancellation', body: 'Cancel free of charge up to 4 hours before.' },
      { title: 'Need help?', body: `Call us: ${site.phone.display}` },
    ],
  },
  vi: {
    title: 'Đặt bàn trực tuyến',
    chooseTable: 'Chọn bàn của bạn',
    stepDate: '1. Chọn ngày',
    stepTime: '2. Chọn giờ',
    stepGuests: '3. Số người',
    stepWishes: '4. Yêu cầu đặc biệt (tuỳ chọn)',
    wishesPlaceholder: 'VD: sinh nhật, dị ứng, ghế trẻ em…',
    findTable: 'Tìm bàn',
    legendAvailable: 'Còn trống',
    legendOccupied: 'Đang bận',
    legendSelected: 'Đã chọn',
    yourSelection: 'Lựa chọn của bạn',
    table: 'Bàn',
    notSelected: 'Chưa chọn',
    date: 'Ngày',
    time: 'Giờ',
    guests: 'Số người',
    total: 'Tổng',
    continue: 'Tiếp tục đặt bàn',
    eventsTitle: 'Tổ chức khoảnh khắc đặc biệt tại Viet Rice',
    eventsBody: 'Sinh nhật, tiệc công ty hay sự kiện riêng — chúng tôi làm nên kỷ niệm đáng nhớ.',
    available: 'còn trống',
    occupied: 'đang bận',
    pending: 'đang giữ',
    blocked: 'không khả dụng',
    seats: 'chỗ',
    tooSmall: 'quá nhỏ',
    noneFree: 'Không có bàn phù hợp vào giờ này. Vui lòng chọn giờ khác.',
    trust: [
      { title: 'An toàn & dễ dàng', body: 'Dữ liệu của bạn được bảo mật. Đặt bàn chỉ vài cú nhấp.' },
      { title: 'Xác nhận nhanh', body: 'Chúng tôi sẽ gọi điện để xác nhận.' },
      { title: 'Huỷ miễn phí', body: 'Huỷ miễn phí trước giờ đặt 4 tiếng.' },
      { title: 'Cần hỗ trợ?', body: `Gọi cho chúng tôi: ${site.phone.display}` },
    ],
  },
}

const TRUST_ICONS = [ShieldCheck, CheckCircle2, XCircle, Phone]

/**
 * Reservation section, matching mockup 2: filter panel on the left, the twelve
 * tables laid out 4x3 in the middle, and the live selection summary on the right.
 *
 * Selecting a slot re-queries availability from the server; the countdown on
 * busy tables ticks against server time, never the visitor's clock.
 */
export function ReservationSection({
  initialTables,
  serverNowIso,
  initialDate,
  initialTime,
}: {
  initialTables: TableView[]
  serverNowIso: string
  initialDate: string
  initialTime: string
}) {
  const { t, locale } = useI18n()
  const copy = COPY[locale]

  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [partySize, setPartySize] = useState(2)
  const [wishes, setWishes] = useState('')

  const [tables, setTables] = useState<TableView[]>(initialTables)
  const [nowIso, setNowIso] = useState(serverNowIso)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<TableView | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const timeSlots = useMemo(() => buildTimeSlots(), [])
  const minDate = toDateInput(new Date(serverNowIso))
  const maxDate = useMemo(() => {
    const d = new Date(serverNowIso)
    d.setDate(d.getDate() + RESERVATION_DEFAULTS.maxAdvanceDays)
    return toDateInput(d)
  }, [serverNowIso])

  const anySelectable = tables.some((tb) => isSelectable(tb, partySize))

  /** Re-query the floor plan for the chosen slot. */
  const refresh = async () => {
    setLoading(true)
    setSelected(null)
    try {
      const params = new URLSearchParams({ date, time, partySize: String(partySize) })
      const res = await fetch(`/api/tables?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('lookup failed')
      const data = (await res.json()) as { tables: TableView[]; serverNow: string }
      setTables(data.tables)
      setNowIso(data.serverNow)
    } catch {
      // Keep the previous floor plan on failure rather than blanking the map.
    } finally {
      setLoading(false)
    }
  }

  const rows = [1, 2, 3]

  return (
    <SectionFrame
      aria-labelledby="reservation-heading"
      className="border-t border-gold/10 bg-background"
    >
      <Container wide className="flex h-full flex-col justify-center py-14 lg:py-4">
        <div className="grid gap-7 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
          {/* ---- Filter panel ---- */}
          <div>
            <h2
              id="reservation-heading"
              className="font-display text-[30px] uppercase leading-none tracking-wider text-gold-gradient sm:text-[38px]"
            >
              {copy.title}
            </h2>
            <div className="divider-lotus my-4 max-w-[280px]">
              <span aria-hidden className="text-sm">
                ❦
              </span>
            </div>
            <p className="mb-4 text-center text-[13px] text-muted xl:text-left">
              {copy.chooseTable}
            </p>

            <div className="card-lux space-y-4 p-4">
              <div>
                <label
                  htmlFor="res-date"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85"
                >
                  {copy.stepDate}
                </label>
                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
                    aria-hidden
                  />
                  <input
                    id="res-date"
                    type="date"
                    value={date}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13.5px] text-cream focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="res-time"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85"
                >
                  {copy.stepTime}
                </label>
                <div className="relative">
                  <Clock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
                    aria-hidden
                  />
                  <select
                    id="res-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13.5px] text-cream focus:border-gold focus:outline-none"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot} className="bg-background-soft">
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="res-party"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85"
                >
                  {copy.stepGuests}
                </label>
                <div className="relative">
                  <Users
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
                    aria-hidden
                  />
                  <select
                    id="res-party"
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="h-11 w-full appearance-none rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13.5px] text-cream focus:border-gold focus:outline-none"
                  >
                    {Array.from({ length: RESERVATION_DEFAULTS.maxPartySize }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n} className="bg-background-soft">
                          {n} {n === 1 ? t.common.person : t.common.persons}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="res-wishes"
                  className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85"
                >
                  {copy.stepWishes}
                </label>
                <textarea
                  id="res-wishes"
                  rows={4}
                  maxLength={200}
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                  placeholder={copy.wishesPlaceholder}
                  className="w-full resize-none rounded-lg border border-gold/25 bg-black/40 p-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
                />
                <p className="mt-1 text-right text-[11px] text-muted">{wishes.length}/200</p>
              </div>

              <Button size="lg" className="w-full" onClick={refresh} disabled={loading}>
                {loading ? t.common.loading : copy.findTable}
              </Button>
            </div>
          </div>

          {/* ---- Floor plan ---- */}
          <div>
            <ul className="mb-4 flex flex-wrap items-center justify-center gap-5 text-[12.5px]">
              <li className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-cream/80">{copy.legendAvailable}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-danger/60 text-danger">
                  <Clock className="h-3 w-3" aria-hidden />
                </span>
                <span className="text-cream/80">{copy.legendOccupied}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full border-2 border-gold bg-gold/20" aria-hidden />
                <span className="text-cream/80">{copy.legendSelected}</span>
              </li>
            </ul>

            <div className="relative overflow-hidden rounded-2xl border border-gold/20 px-12 py-5 sm:px-16 sm:py-7">
              {/* Dining-room floor: planks, side rails with banquette seating,
                  and corner foliage — see FloorDecor for why it is drawn
                  rather than cropped from the mockup. */}
              <FloorDecor />

              <div
                className="relative space-y-4 sm:space-y-6"
                role="radiogroup"
                aria-label={copy.chooseTable}
              >
                {rows.map((row) => (
                  <div key={row} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                    {tables
                      .filter((tb) => tb.gridRow === row)
                      .sort((a, b) => a.gridCol - b.gridCol)
                      .map((tb) => (
                        <TableCard
                          key={tb.id}
                          table={tb}
                          partySize={partySize}
                          selected={selected?.id === tb.id}
                          serverNowIso={nowIso}
                          onSelect={setSelected}
                          labels={{
                            available: copy.available,
                            occupied: copy.occupied,
                            pending: copy.pending,
                            blocked: copy.blocked,
                            seats: copy.seats,
                            tooSmall: copy.tooSmall,
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {!anySelectable && (
              <p
                role="status"
                className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-center text-[13px] text-warning"
              >
                {copy.noneFree}
              </p>
            )}
          </div>

          {/* ---- Selection summary ---- */}
          <div className="space-y-4">
            <div className="card-lux p-4">
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-luxe text-gold-light">
                {copy.yourSelection}
              </h3>
              <dl className="space-y-3 text-[13px]">
                <div className="flex items-start gap-2.5">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div>
                    <dt className="text-muted">{copy.table}</dt>
                    <dd className={cn(selected ? 'text-gold-light' : 'text-muted/70')}>
                      {selected ? `${copy.table} ${selected.number}` : copy.notSelected}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div>
                    <dt className="text-muted">{copy.date}</dt>
                    <dd className="text-cream/85">{date}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div>
                    <dt className="text-muted">{copy.time}</dt>
                    <dd className="text-cream/85">{time}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div>
                    <dt className="text-muted">{copy.guests}</dt>
                    <dd className="text-cream/85">
                      {partySize} {partySize === 1 ? t.common.person : t.common.persons}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-gold/15 pt-3">
                <span className="text-[13px] text-muted">{copy.total}</span>
                <span className="font-display text-xl text-cream">€0.00</span>
              </div>

              <Button
                size="lg"
                className="mt-3 w-full"
                disabled={!selected}
                onClick={() => setModalOpen(true)}
              >
                {copy.continue}
              </Button>
            </div>

            <div className="card-lux overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/images/reservation/events.jpg"
                  alt=""
                  fill
                  loading="lazy"
                  sizes="300px"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-background-soft to-transparent"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-gold-light">
                  {copy.eventsTitle}
                </h3>
                <p className="mt-2 text-[12.5px] leading-snug text-muted">{copy.eventsBody}</p>
                <ButtonLink href="/contact" variant="outline" size="sm" className="mt-3 w-full">
                  {t.common.learnMore}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Trust strip ---- */}
        <ul className="mt-12 grid gap-6 border-t border-gold/12 pt-8 lg:mt-6 lg:gap-5 lg:pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {copy.trust.map((item, i) => {
            const Icon = TRUST_ICONS[i]
            return (
              <li key={item.title} className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/35 text-gold">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[17px] uppercase tracking-wide text-cream">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{item.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Container>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        table={selected}
        date={date}
        time={time}
        partySize={partySize}
        initialNotes={wishes}
        onBooked={refresh}
      />
    </SectionFrame>
  )
}
