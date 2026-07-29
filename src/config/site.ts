/**
 * Static brand + contact facts. These are the only values that legitimately
 * live in code (they are legal identity data, not editable content); everything
 * a manager may change lives in the `RestaurantSetting` table instead.
 */
export const site = {
  name: 'VIET RICE',
  tagline: 'Vietnamesisches Restaurant & Sushi Berlin',
  legalName: 'Viet Rice Restaurant & Sushi Berlin',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vietrice-restaurant.de',
  domain: 'vietrice-restaurant.de',
  address: {
    street: 'Otto-Weidt-Platz 11',
    postalCode: '10557',
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    full: 'Otto-Weidt-Platz 11, 10557 Berlin, Germany',
  },
  geo: {
    // Otto-Weidt-Platz, Berlin-Moabit / Europacity.
    lat: 52.5299,
    lng: 13.3661,
  },
  phone: {
    display: '030 55476585',
    href: 'tel:+493055476585',
  },
  email: 'info@vietrice-restaurant.de',
  social: {
    instagram: 'https://instagram.com/vietrice.berlin',
    facebook: 'https://facebook.com/vietrice.berlin',
    tiktok: 'https://tiktok.com/@vietrice.berlin',
    googleMaps:
      'https://www.google.com/maps/search/?api=1&query=Otto-Weidt-Platz+11,+10557+Berlin,+Germany',
    googleReviews:
      'https://www.google.com/maps/search/?api=1&query=Viet+Rice+Restaurant+Sushi+Berlin',
  },
} as const

export type Site = typeof site

/** Public navigation, rendered by the header and the footer quick links. */
export const mainNav = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'menu', href: '/menu' },
  { key: 'reservation', href: '/reservation' },
  { key: 'order', href: '/order' },
  { key: 'events', href: '/promotions' },
  { key: 'gallery', href: '/gallery' },
  { key: 'contact', href: '/contact' },
] as const

export type NavKey = (typeof mainNav)[number]['key']
