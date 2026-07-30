'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import type { MenuCategorySeed, MenuItemSeed } from '@/content/menu'
import { useI18n } from '@/i18n/provider'
import { localizedName, localizedSubtitle } from '@/lib/dish'
import { buildTimeSlots } from '@/lib/reservation'
import { cn, formatPrice } from '@/lib/utils'
import { cartSubtotalCents, lineTotalCents, useCart } from '@/store/cart'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

const COPY = {
  de: {
    title: 'Online bestellen',
    lead: 'Zur Abholung im Restaurant. Bezahlung vor Ort.',
    cart: 'Ihre Bestellung',
    empty: 'Ihr Warenkorb ist leer.',
    add: 'Hinzufügen',
    name: 'Name',
    phone: 'Telefon',
    email: 'E-Mail (optional)',
    pickup: 'Abholzeit',
    notes: 'Anmerkungen',
    total: 'Gesamt',
    submit: 'Bestellung senden',
    payAt: 'Zahlung im Restaurant',
    successTitle: 'Bestellung eingegangen!',
    successBody: 'Wir bereiten Ihre Bestellung vor und rufen Sie bei Rückfragen an.',
    yourCode: 'Ihre Bestellnummer',
    soldOut: 'Ausverkauft',
  },
  en: {
    title: 'Order online',
    lead: 'For pickup at the restaurant. Payment on site.',
    cart: 'Your order',
    empty: 'Your basket is empty.',
    add: 'Add',
    name: 'Name',
    phone: 'Phone',
    email: 'Email (optional)',
    pickup: 'Pickup time',
    notes: 'Notes',
    total: 'Total',
    submit: 'Place order',
    payAt: 'Pay at the restaurant',
    successTitle: 'Order received!',
    successBody: 'We are preparing your order and will call if anything is unclear.',
    yourCode: 'Your order number',
    soldOut: 'Sold out',
  },
  vi: {
    title: 'Đặt món online',
    lead: 'Nhận tại nhà hàng. Thanh toán khi lấy món.',
    cart: 'Đơn của bạn',
    empty: 'Giỏ hàng đang trống.',
    add: 'Thêm',
    name: 'Họ và tên',
    phone: 'Điện thoại',
    email: 'Email (tuỳ chọn)',
    pickup: 'Giờ lấy món',
    notes: 'Ghi chú',
    total: 'Tổng cộng',
    submit: 'Gửi đơn hàng',
    payAt: 'Thanh toán tại nhà hàng',
    successTitle: 'Đã nhận đơn hàng!',
    successBody: 'Chúng tôi đang chuẩn bị và sẽ gọi nếu cần xác nhận thêm.',
    yourCode: 'Mã đơn hàng',
    soldOut: 'Hết món',
  },
} as const

const field =
  'h-11 w-full rounded-lg border border-gold/25 bg-black/40 px-3 text-[13.5px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none'

export function OrderPage({
  categories,
  items,
}: {
  categories: MenuCategorySeed[]
  items: MenuItemSeed[]
}) {
  const { locale, intl } = useI18n()
  const copy = COPY[locale]
  const { lines, addLine, setQuantity, removeLine, clear } = useCart()

  const [category, setCategory] = useState(categories[1]?.slug ?? categories[0]?.slug ?? '')
  const [form, setForm] = useState({ name: '', phone: '', email: '', pickup: '18:00', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderCode, setOrderCode] = useState<string | null>(null)

  const slots = useMemo(() => buildTimeSlots(), [])
  const visible = items.filter((i) =>
    category === 'empfehlung' ? i.isSignature : i.category === category,
  )
  const subtotal = cartSubtotalCents(lines)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: form.name,
          guestPhone: form.phone,
          guestEmail: form.email,
          pickupTime: form.pickup,
          notes: form.notes,
          paymentMethod: 'PAY_AT_RESTAURANT',
          items: lines.map((l) => ({
            slug: l.menuItemSlug,
            quantity: l.quantity,
            notes: l.notes,
          })),
        }),
      })
      const data = (await res.json()) as { code?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Bestellung fehlgeschlagen.')
        return
      }
      setOrderCode(data.code ?? null)
      clear()
    } catch {
      setError('Bestellung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  if (orderCode) {
    return (
      <Container className="py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-success/50 bg-success/12 text-success">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-5 font-display text-3xl text-gold-light">{copy.successTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-muted">{copy.successBody}</p>
        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-gold/30 bg-black/35 px-5 py-4">
          <p className="text-[11.5px] uppercase tracking-luxe text-muted">{copy.yourCode}</p>
          <p className="mt-1 font-display text-3xl tracking-wider text-gold-light">{orderCode}</p>
        </div>
      </Container>
    )
  }

  return (
    <Container wide className="py-12 lg:py-16">
      <h1 className="font-display text-[34px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[42px]">
        {copy.title}
      </h1>
      <p className="mt-2 text-[14.5px] text-muted">{copy.lead}</p>

      <div className="divider-lotus my-6 max-w-[320px]">
        <span aria-hidden className="text-base">
          ❦
        </span>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---- Menu ---- */}
        <div>
          <ul className="mb-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    'fx-press rounded-full border px-3.5 py-1.5 text-[12px] uppercase tracking-luxe transition-colors',
                    c.slug === category
                      ? 'border-gold bg-gold/12 text-gold-light'
                      : 'border-gold/25 text-cream/70 hover:border-gold/55 hover:text-gold',
                  )}
                >
                  {locale === 'en' ? c.nameEn : locale === 'vi' ? c.nameVi : c.nameDe}
                </button>
              </li>
            ))}
          </ul>

          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((item) => (
              <li key={item.slug} className="card-lux flex gap-3 p-3">
                <span className="relative h-[70px] w-[80px] shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-[15px] uppercase tracking-wide text-cream">
                    {localizedName(item, locale)}
                  </span>
                  <span className="truncate text-[11.5px] text-muted">
                    {localizedSubtitle(item, locale)}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-1.5">
                    <span className="text-[13.5px] font-medium text-gold">
                      {formatPrice(item.priceCents, intl)}
                    </span>
                    <Button
                      size="sm"
                      disabled={!item.isAvailable}
                      onClick={() =>
                        addLine({
                          menuItemSlug: item.slug,
                          name: localizedName(item, locale),
                          image: item.thumbnail,
                          unitPriceCents: item.priceCents,
                          quantity: 1,
                          options: [],
                          notes: '',
                        })
                      }
                    >
                      {item.isAvailable ? copy.add : copy.soldOut}
                    </Button>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Cart + checkout ---- */}
        <div className="card-lux h-fit p-4 lg:sticky lg:top-[calc(var(--header-h)+16px)]">
          <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-luxe text-gold-light">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {copy.cart}
          </h2>

          {lines.length === 0 ? (
            <p className="mt-4 text-center text-[13px] text-muted">{copy.empty}</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {lines.map((l) => (
                <li key={l.lineId} className="flex items-center gap-2 border-b border-gold/10 pb-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-cream">{l.name}</span>
                    <span className="text-[12px] text-gold">
                      {formatPrice(lineTotalCents(l), intl)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() => setQuantity(l.lineId, l.quantity - 1)}
                      className="grid h-6 w-6 place-items-center rounded border border-gold/30 text-gold hover:bg-gold/10"
                    >
                      <Minus className="h-3 w-3" aria-hidden />
                    </button>
                    <span className="w-5 text-center text-[13px] tabular-nums text-cream">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => setQuantity(l.lineId, l.quantity + 1)}
                      className="grid h-6 w-6 place-items-center rounded border border-gold/30 text-gold hover:bg-gold/10"
                    >
                      <Plus className="h-3 w-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Entfernen"
                      onClick={() => removeLine(l.lineId)}
                      className="ml-1 grid h-6 w-6 place-items-center rounded border border-danger/30 text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-gold/15 pt-3">
            <span className="text-[13px] text-muted">{copy.total}</span>
            <span className="font-display text-xl text-gold-light">
              {formatPrice(subtotal, intl)}
            </span>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-2.5" noValidate>
            <input
              required
              placeholder={copy.name}
              autoComplete="name"
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              required
              type="tel"
              placeholder={copy.phone}
              autoComplete="tel"
              className={field}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="email"
              placeholder={copy.email}
              autoComplete="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-muted">{copy.pickup}</span>
              <select
                className={cn(field, 'appearance-none')}
                value={form.pickup}
                onChange={(e) => setForm({ ...form, pickup: e.target.value })}
              >
                {slots.map((s) => (
                  <option key={s} value={s} className="bg-background-soft">
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              rows={2}
              placeholder={copy.notes}
              className="w-full resize-none rounded-lg border border-gold/25 bg-black/40 p-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <p className="rounded-lg border border-gold/20 bg-black/25 px-3 py-2 text-[12px] text-muted">
              {copy.payAt}
            </p>

            {error && (
              <p role="alert" className="text-[12.5px] text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={busy || lines.length === 0}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {copy.submit}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  )
}
