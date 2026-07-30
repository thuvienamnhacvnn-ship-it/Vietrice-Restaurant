'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'

import type { MenuCategorySeed, MenuItemSeed } from '@/content/menu'
import { useI18n } from '@/i18n/provider'
import { localizedDescription, localizedName, localizedSubtitle } from '@/lib/dish'
import { buildTimeSlots } from '@/lib/reservation'
import { cn, formatPrice } from '@/lib/utils'
import { cartSubtotalCents, lineTotalCents, useCart } from '@/store/cart'
import { useMobileActionBar } from '@/hooks/useMobileActionBar'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'

const COPY = {
  de: {
    title: 'Online bestellen',
    lead: 'Zur Abholung im Restaurant. Bezahlung vor Ort.',
    cart: 'Ihre Bestellung',
    empty: 'Ihr Warenkorb ist leer.',
    emptyCategory: 'In dieser Kategorie ist derzeit nichts hinterlegt.',
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
    viewCart: 'Warenkorb ansehen',
    items: 'Artikel',
    closeCart: 'Schließen',
  },
  en: {
    title: 'Order online',
    lead: 'For pickup at the restaurant. Payment on site.',
    cart: 'Your order',
    empty: 'Your basket is empty.',
    emptyCategory: 'Nothing is listed in this category yet.',
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
    viewCart: 'View basket',
    items: 'items',
    closeCart: 'Close',
  },
  vi: {
    title: 'Đặt món online',
    lead: 'Nhận tại nhà hàng. Thanh toán khi lấy món.',
    cart: 'Đơn của bạn',
    empty: 'Giỏ hàng đang trống.',
    emptyCategory: 'Danh mục này hiện chưa có món nào.',
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
    viewCart: 'Xem giỏ hàng',
    items: 'món',
    closeCart: 'Đóng',
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
  /** Mobile only: the cart is a sheet rather than a column beside the menu. */
  const [cartOpen, setCartOpen] = useState(false)

  const slots = useMemo(() => buildTimeSlots(), [])
  const visible = items.filter((i) =>
    category === 'empfehlung' ? i.isSignature : i.category === category,
  )
  const subtotal = cartSubtotalCents(lines)
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0)

  useMobileActionBar(lines.length > 0 && !cartOpen)

  // A sheet you can scroll *past* feels broken; lock the page behind it.
  useEffect(() => {
    if (!cartOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [cartOpen])

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
      setCartOpen(false)
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
    <Container wide className="py-8 pb-28 sm:py-12 lg:py-16 lg:pb-16">
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
          <ul className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {categories.map((c) => (
              <li key={c.slug} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    'fx-press min-h-[38px] rounded-full border px-4 py-2 text-[12px] uppercase tracking-luxe transition-colors sm:min-h-0 sm:px-3.5 sm:py-1.5',
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

          {visible.length === 0 && (
            <p className="card-lux p-6 text-center text-[13px] text-muted">{copy.emptyCategory}</p>
          )}

          <ul className="grid content-start gap-3 sm:grid-cols-2">
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
                  {/* In Vietnamese the subtitle *is* the dish name, so it would
                      print twice; the description is the useful line there. */}
                  <span className="truncate text-[11.5px] text-muted">
                    {locale === 'vi'
                      ? localizedDescription(item, locale)
                      : localizedSubtitle(item, locale)}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-1.5">
                    <span className="text-[13.5px] font-medium text-gold">
                      {formatPrice(item.priceCents, intl)}
                    </span>
                    <Button
                      size="sm"
                      className="h-10 px-5 text-[11.5px] sm:h-8 sm:px-4 sm:text-[10.5px]"
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

        {/* ---- Cart + checkout ----
            Desktop: a sticky column beside the menu.
            Mobile: a sheet over the menu, because a cart below a long list is
            a cart nobody sees — you add a dish and nothing appears to happen. */}
        <div
          id="order-cart"
          className={cn(
            'card-lux p-4 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:h-fit',
            'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[86svh]',
            'max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:rounded-b-none',
            'max-lg:pb-[calc(16px+env(safe-area-inset-bottom))] max-lg:transition-transform',
            'max-lg:duration-300 max-lg:ease-out',
            cartOpen ? 'max-lg:translate-y-0' : 'max-lg:translate-y-full',
          )}
          aria-hidden={undefined}
        >
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label={copy.closeCart}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-gold lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
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
                      className="grid h-9 w-9 place-items-center rounded border border-gold/30 text-gold hover:bg-gold/10 lg:h-7 lg:w-7"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="w-6 text-center text-[14px] tabular-nums text-cream">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() => setQuantity(l.lineId, l.quantity + 1)}
                      className="grid h-9 w-9 place-items-center rounded border border-gold/30 text-gold hover:bg-gold/10 lg:h-7 lg:w-7"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Entfernen"
                      onClick={() => removeLine(l.lineId)}
                      className="ml-1 grid h-9 w-9 place-items-center rounded border border-danger/30 text-danger hover:bg-danger/10 lg:h-7 lg:w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
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

      {/* Dim the menu behind the open sheet and give a tap-anywhere escape. */}
      {cartOpen && (
        <button
          type="button"
          aria-label={copy.closeCart}
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Persistent summary bar: the running total stays in view while the
          guest browses, which is the whole point of ordering on a phone. */}
      {lines.length > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-background-soft/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="fx-press flex h-12 w-full items-center justify-between rounded-lg border border-gold/55 bg-gold/12 px-4 text-gold-light"
          >
            <span className="flex items-center gap-2 text-[13px]">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {itemCount} {copy.items}
            </span>
            <span className="flex items-center gap-3">
              <span className="font-display text-lg">{formatPrice(subtotal, intl)}</span>
              <span className="text-[12px] uppercase tracking-luxe">{copy.viewCart}</span>
            </span>
          </button>
        </div>
      )}
    </Container>
  )
}
