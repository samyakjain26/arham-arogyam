import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLang, LANGS } from '@/lib/i18n'
import { asset } from '@/lib/asset'
import { fraunces, inter, notoSansDev, notoSerifDev } from '../fonts'
import { Header } from '@/components/shell/Header'
import { Footer } from '@/components/shell/Footer'
import { BottomNav } from '@/components/shell/BottomNav'
import '../globals.css'

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

// viewport-fit=cover is required for env(safe-area-inset-*) to resolve to
// anything but 0 — without it BottomNav's safe-area padding is inert on
// notched/gesture-nav phones.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> },
): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const d = getDictionary(lang)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

  return {
    metadataBase: new URL(base),
    title: `${d.site.name} — ${d.site.subtitle}`,
    description: d.site.tagline,
    // Keeps the temporary domain out of Google so it never competes
    // with the real one later.
    robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: `/${lang}`,
      languages: { hi: '/hi', en: '/en' },
    },
    icons: {
      icon: asset('/logo-192.png'),
      apple: asset('/logo-192.png'),
    },
    openGraph: {
      images: [asset('/logo-512.png')],
    },
  }
}

export default async function LangLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  // Tried per-locale conditional application of these .variable classes
  // (skip Fraunces/Inter on /hi, skip Noto Sans Devanagari on /en) to avoid
  // preloading fonts a given locale never renders. Measured no effect: this
  // layout is the single shared route for both /en and /hi, and Next
  // preloads every font/font a layout calls on every route it serves,
  // regardless of which locale branch actually applies the class at
  // runtime (confirmed identical <link rel=preload> sets on built hi.html
  // and en.html either way). See task report for the byte accounting and
  // what a real per-locale split would require (separate route trees).
  // Applying all four unconditionally is therefore just as cheap and
  // avoids a genuine risk: an unapplied variable referenced by
  // app/globals.css's font-family fallback chains invalidates the whole
  // declaration, not just that one name.
  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${notoSansDev.variable} ${notoSerifDev.variable} h-full antialiased`}
    >
      <head>
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-cream text-ink pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] md:pb-0">
        <Header lang={lang} />
        {children}
        <Footer lang={lang} />
        <BottomNav lang={lang} />
      </body>
    </html>
  )
}
