'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import {
  Award,
  Check,
  Flame,
  Grid2x2,
  Heart,
  Leaf,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
  Timer,
  Utensils,
} from 'lucide-react'

import type { MenuCategorySeed, MenuItemSeed } from '@/content/menu'
import type { Locale } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { localizedDescription, localizedName, localizedSubtitle } from '@/lib/dish'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/store/cart'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { SectionFrame } from '@/components/ui/SectionFrame'
import { DishShowcase3D } from './DishShowcase3D'

const COPY: Record<
  Locale,
  {
    title: string
    subtitle: string
    searchPlaceholder: string
    all: string
    noResults: string
    ingredients: string
    allergens: string
    spice: string
    prepTime: string
    calories: string
    ratingSuffix: string
    addToCart: string
    added: string
    soldOut: string
    bestseller: string
    vegetarian: string
    features: { title: string; body: string }[]
  }
> = {
  de: {
    title: 'Smart Menu',
    subtitle: 'Entdecken Sie unsere Gerichte',
    searchPlaceholder: 'Gericht suchen…',
    all: 'Alle Gerichte ansehen',
    noResults: 'Keine Gerichte gefunden.',
    ingredients: 'Hauptzutaten',
    allergens: 'Allergene',
    spice: 'Würzigkeit',
    prepTime: 'Zubereitungszeit',
    calories: 'Kalorien',
    ratingSuffix: 'Bewertungen',
    addToCart: 'In den Warenkorb',
    added: 'Hinzugefügt',
    soldOut: 'Ausverkauft',
    bestseller: 'Bestseller',
    vegetarian: 'Vegetarisch',
    features: [
      { title: 'Frische Zutaten', body: 'Wir verwenden nur frische und hochwertige Zutaten.' },
      { title: 'Authentische Rezepte', body: 'Traditionelle vietnamesische Rezepte mit modernem Touch.' },
      { title: 'Erfahrene Köche', body: 'Unsere Köche bringen die authentischen Aromen Vietnams nach Berlin.' },
      { title: 'Beste Qualität', body: 'Qualität, die man schmeckt und der man vertraut.' },
    ],
  },
  en: {
    title: 'Smart Menu',
    subtitle: 'Discover our dishes',
    searchPlaceholder: 'Search a dish…',
    all: 'See all dishes',
    noResults: 'No dishes found.',
    ingredients: 'Main ingredients',
    allergens: 'Allergens',
    spice: 'Spice level',
    prepTime: 'Preparation time',
    calories: 'Calories',
    ratingSuffix: 'reviews',
    addToCart: 'Add to cart',
    added: 'Added',
    soldOut: 'Sold out',
    bestseller: 'Bestseller',
    vegetarian: 'Vegetarian',
    features: [
      { title: 'Fresh ingredients', body: 'We only use fresh, high-quality ingredients.' },
      { title: 'Authentic recipes', body: 'Traditional Vietnamese recipes with a modern touch.' },
      { title: 'Experienced chefs', body: 'Our chefs bring the authentic flavours of Vietnam to Berlin.' },
      { title: 'Best quality', body: 'Quality you can taste and trust.' },
    ],
  },
  vi: {
    title: 'Smart Menu',
    subtitle: 'Khám phá các món ăn của chúng tôi',
    searchPlaceholder: 'Tìm món ăn…',
    all: 'Xem tất cả món ăn',
    noResults: 'Không tìm thấy món nào.',
    ingredients: 'Nguyên liệu chính',
    allergens: 'Dị ứng',
    spice: 'Độ cay',
    prepTime: 'Thời gian chế biến',
    calories: 'Calo',
    ratingSuffix: 'đánh giá',
    addToCart: 'Thêm vào giỏ',
    added: 'Đã thêm',
    soldOut: 'Hết món',
    bestseller: 'Bán chạy',
    vegetarian: 'Món chay',
    features: [
      { title: 'Nguyên liệu tươi', body: 'Chúng tôi chỉ dùng nguyên liệu tươi và chất lượng cao.' },
      { title: 'Công thức đích thực', body: 'Công thức Việt truyền thống với nét hiện đại.' },
      { title: 'Đầu bếp giàu kinh nghiệm', body: 'Mang hương vị Việt Nam đích thực đến Berlin.' },
      { title: 'Chất lượng hàng đầu', body: 'Chất lượng cảm nhận được và đáng tin cậy.' },
    ],
  },
}

const SPICE_VALUE: Record<MenuItemSeed['spicyLevel'], number> = {
  NONE: 0,
  MILD: 1,
  MEDIUM: 2,
  HOT: 3,
  VERY_HOT: 4,
}

const FEATURE_ICONS = [Leaf, Utensils, Sparkles, Award]

function categoryName(cat: MenuCategorySeed, locale: Locale) {
  return locale === 'en' ? cat.nameEn : locale === 'vi' ? cat.nameVi : cat.nameDe
}

/** Resolve a Lucide icon by name, falling back to a neutral glyph. */
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    name
  ]
  const Resolved = Icon ?? Utensils
  return <Resolved className={className} />
}

export function SmartMenu({
  categories,
  items,
  allergenLabels,
}: {
  categories: MenuCategorySeed[]
  items: MenuItemSeed[]
  allergenLabels: Record<string, string>
}) {
  const { t, locale, intl } = useI18n()
  const copy = COPY[locale]
  const addLine = useCart((s) => s.addLine)

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.slug ?? '')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [activeSlug, setActiveSlug] = useState<string>(items[0]?.slug ?? '')
  const [justAdded, setJustAdded] = useState(false)
  const [favourites, setFavourites] = useState<string[]>([])

  const visibleItems = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return items.filter((item) => {
      // "Recommendations" is a virtual category backed by the signature flag.
      const inCategory =
        activeCategory === 'empfehlung' ? item.isSignature : item.category === activeCategory
      if (!q) return inCategory
      const haystack = [item.nameVi, item.nameDe, item.nameEn].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, activeCategory, deferredQuery])

  const active = useMemo(
    () => items.find((i) => i.slug === activeSlug) ?? visibleItems[0] ?? items[0],
    [items, activeSlug, visibleItems],
  )

  const orbitIngredients = useMemo(
    () =>
      (active?.ingredients ?? [])
        .filter((ing) => Boolean(ing.asset))
        .map((ing) => ({ asset: ing.asset as string, label: ing.nameDe })),
    [active],
  )

  if (!active) return null

  const isFavourite = favourites.includes(active.slug)

  const handleAdd = () => {
    addLine({
      menuItemSlug: active.slug,
      name: localizedName(active, locale),
      image: active.thumbnail,
      unitPriceCents: active.priceCents,
      quantity: 1,
      options: [],
      notes: '',
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1800)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/menu#${active.slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: localizedName(active, locale), url })
        return
      } catch {
        // User dismissed the share sheet — fall through to clipboard.
      }
    }
    await navigator.clipboard?.writeText(url)
  }

  return (
    <SectionFrame
      aria-labelledby="smart-menu-heading"
      className="border-t border-gold/10 bg-background"
    >
      <Container wide className="flex h-full flex-col justify-center py-14 lg:pb-4 lg:pt-[60px]">
        <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,270px)_minmax(0,1fr)] lg:gap-7">
          {/* ---- Column 1: title, search, categories ---- */}
          <div>
            <h2
              id="smart-menu-heading"
              className="font-display text-[30px] uppercase leading-none tracking-wider text-gold-gradient sm:text-[34px]"
            >
              {copy.title}
            </h2>
            <p className="mt-1.5 text-[13px] text-muted">{copy.subtitle}</p>

            <div className="relative mt-5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70"
                aria-hidden
              />
              <label htmlFor="menu-search" className="sr-only">
                {copy.searchPlaceholder}
              </label>
              <input
                id="menu-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-11 w-full rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13.5px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
              />
            </div>

            <ul className="mt-4 space-y-1" role="tablist" aria-orientation="vertical">
              {categories.map((cat) => {
                const selected = cat.slug === activeCategory
                return (
                  <li key={cat.slug}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-medium uppercase tracking-wide transition-all',
                        selected
                          ? 'border-gold/55 bg-gold/12 text-gold-light'
                          : 'border-transparent text-cream/75 hover:border-gold/25 hover:bg-white/[0.03] hover:text-gold',
                      )}
                    >
                      <CategoryIcon name={cat.icon} className="h-4 w-4 shrink-0 text-gold" />
                      <span className="truncate">{categoryName(cat, locale)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ---- Column 2: dish list ---- */}
          <div className="flex flex-col">
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleItems.map((item) => {
                  const selected = item.slug === active.slug
                  return (
                    <motion.li
                      key={item.slug}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSlug(item.slug)}
                        aria-current={selected ? 'true' : undefined}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-all',
                          selected
                            ? 'border-gold bg-gold/[0.07] shadow-gold'
                            : 'border-gold/15 hover:border-gold/45 hover:bg-white/[0.02]',
                        )}
                      >
                        <span className="relative h-[54px] w-[62px] shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={item.thumbnail}
                            alt=""
                            fill
                            loading="lazy"
                            sizes="62px"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block truncate font-display text-[14px] uppercase tracking-wide',
                              selected ? 'text-gold-light' : 'text-cream/90',
                            )}
                          >
                            {localizedName(item, locale)}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">
                            {localizedSubtitle(item, locale)}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] font-medium text-gold">
                            {formatPrice(item.priceCents, intl)}
                          </span>
                        </span>
                        {selected && (
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-[#1a1408]">
                            <Check className="h-3 w-3" aria-hidden />
                          </span>
                        )}
                      </button>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>

            {visibleItems.length === 0 && (
              <p className="rounded-lg border border-gold/15 px-3 py-6 text-center text-[13px] text-muted">
                {copy.noResults}
              </p>
            )}

            <ButtonLink href="/order" variant="outline" size="sm" className="mt-4 w-full">
              <Grid2x2 className="h-4 w-4" aria-hidden />
              {copy.all}
            </ButtonLink>
          </div>

          {/* ---- Column 3: detail + 3D showcase ---- */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-center"
              >
                <div>
                  <div className="flex flex-wrap gap-2">
                    {active.isBestseller && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-gold/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-luxe text-gold-light">
                        <Star className="h-3 w-3 fill-current" aria-hidden />
                        {copy.bestseller}
                      </span>
                    )}
                    {active.isVegetarian && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/45 bg-success/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-luxe text-success">
                        <Leaf className="h-3 w-3" aria-hidden />
                        {copy.vegetarian}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-[34px] uppercase leading-tight tracking-wide text-cream sm:text-[40px]">
                    {localizedName(active, locale)}
                  </h3>
                  <p className="mt-0.5 font-display text-xl text-muted">
                    {localizedSubtitle(active, locale)}
                  </p>

                  <p className="mt-3.5 max-w-lg text-[13.5px] leading-relaxed text-cream/80">
                    {localizedDescription(active, locale)}
                  </p>

                  <div className="mt-4 flex items-center gap-2.5">
                    <span className="flex" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < Math.round(active.rating) ? 'fill-gold text-gold' : 'text-gold/25',
                          )}
                        />
                      ))}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      ({active.ratingCount} {copy.ratingSuffix})
                    </span>
                  </div>

                  <p className="mt-3 font-display text-[34px] leading-none text-gold-light">
                    {formatPrice(active.priceCents, intl)}
                  </p>

                  <dl className="mt-5 space-y-2.5 text-[13px]">
                    <div className="flex items-center gap-3">
                      <dt className="flex w-[150px] shrink-0 items-center gap-2 text-muted">
                        <Flame className="h-4 w-4 text-gold" aria-hidden />
                        {copy.spice}
                      </dt>
                      <dd className="flex gap-1" aria-label={`${SPICE_VALUE[active.spicyLevel]}/4`}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Flame
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < SPICE_VALUE[active.spicyLevel]
                                ? 'fill-danger text-danger'
                                : 'text-muted/35',
                            )}
                            aria-hidden
                          />
                        ))}
                      </dd>
                    </div>
                    {active.preparationMinutes !== null && (
                      <div className="flex items-center gap-3">
                        <dt className="flex w-[150px] shrink-0 items-center gap-2 text-muted">
                          <Timer className="h-4 w-4 text-gold" aria-hidden />
                          {copy.prepTime}
                        </dt>
                        <dd className="text-cream/85">
                          {active.preparationMinutes} {t.common.minutes}
                        </dd>
                      </div>
                    )}
                    {active.calories !== null && (
                      <div className="flex items-center gap-3">
                        <dt className="flex w-[150px] shrink-0 items-center gap-2 text-muted">
                          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
                          {copy.calories}
                        </dt>
                        <dd className="text-cream/85">{active.calories} kcal</dd>
                      </div>
                    )}
                  </dl>

                  <h4 className="mt-5 text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85">
                    {copy.ingredients}
                  </h4>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {active.ingredients.map((ing) => (
                      <li
                        key={ing.nameDe}
                        className="rounded-md border border-gold/22 bg-black/30 px-2.5 py-1 text-[11.5px] text-cream/80"
                      >
                        {locale === 'en' ? ing.nameEn : locale === 'vi' ? ing.nameVi : ing.nameDe}
                      </li>
                    ))}
                  </ul>

                  {active.allergenCodes.length > 0 && (
                    <>
                      <h4 className="mt-4 text-[11.5px] font-semibold uppercase tracking-luxe text-gold/85">
                        {copy.allergens}
                      </h4>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {active.allergenCodes.map((code) => (
                          <li
                            key={code}
                            className="rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1 text-[11.5px] text-danger/90"
                          >
                            {code} — {allergenLabels[code] ?? code}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <Button
                      size="lg"
                      onClick={handleAdd}
                      disabled={!active.isAvailable}
                      className="min-w-[210px]"
                    >
                      {justAdded ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : (
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                      )}
                      {!active.isAvailable
                        ? copy.soldOut
                        : justAdded
                          ? copy.added
                          : copy.addToCart}
                    </Button>

                    <button
                      type="button"
                      onClick={() =>
                        setFavourites((f) =>
                          f.includes(active.slug)
                            ? f.filter((s) => s !== active.slug)
                            : [...f, active.slug],
                        )
                      }
                      aria-pressed={isFavourite}
                      aria-label="Favorit"
                      className={cn(
                        'grid h-[52px] w-[52px] place-items-center rounded-md border transition-colors',
                        isFavourite
                          ? 'border-danger/60 bg-danger/15 text-danger'
                          : 'border-gold/45 text-gold hover:bg-gold/10',
                      )}
                    >
                      <Heart className={cn('h-5 w-5', isFavourite && 'fill-current')} aria-hidden />
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Share"
                      className="grid h-[52px] w-[52px] place-items-center rounded-md border border-gold/45 text-gold transition-colors hover:bg-gold/10"
                    >
                      <Share2 className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                </div>

                <DishShowcase3D
                  image={active.slug === 'pho-bo-dac-biet' ? '/images/menu/pho-bo-bowl.jpg' : active.thumbnail}
                  alt={localizedName(active, locale)}
                  ingredients={orbitIngredients}
                  className="order-first xl:order-none"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ---- Feature strip ---- */}
        <ul className="mt-12 grid gap-6 border-t border-gold/12 pt-8 lg:mt-4 lg:gap-4 lg:pt-3 sm:grid-cols-2 xl:grid-cols-4">
          {copy.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
              <li key={f.title} className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/35 text-gold lg:h-9 lg:w-9">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[17px] uppercase tracking-wide text-cream lg:text-[15px]">
                    {f.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{f.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Container>
    </SectionFrame>
  )
}
