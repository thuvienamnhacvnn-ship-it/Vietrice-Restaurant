import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Dancing_Script, Inter } from 'next/font/google'

import '@/styles/globals.css'

import { site } from '@/config/site'
import { getDictionary, getLocale } from '@/i18n'
import { I18nProvider } from '@/i18n/provider'

const display = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
})

const script = Dancing_Script({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-script',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    'Authentische vietnamesische Küche und frisches Sushi im Herzen von Berlin. Tisch reservieren, online bestellen oder unser Menü entdecken.',
  applicationName: site.name,
  icons: { icon: '/images/logo-mark.svg' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    url: site.url,
    title: `${site.name} — ${site.tagline}`,
    images: ['/images/hero/hero-pho-bo.jpg'],
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#080806',
  colorScheme: 'dark',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const dictionary = getDictionary(locale)

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
