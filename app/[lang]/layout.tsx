import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLang, LANGS, type Lang } from '@/lib/i18n'
import { fraunces, inter, notoSansDev, notoSerifDev } from '../fonts'
import { Header } from '@/components/shell/Header'
import { Footer } from '@/components/shell/Footer'
import { BottomNav } from '@/components/shell/BottomNav'
import '../globals.css'

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
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
      icon: '/logo-192.png',
      apple: '/logo-192.png',
    },
    openGraph: {
      images: ['/logo-512.png'],
    },
  }
}

export default async function LangLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

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
      <body className="min-h-dvh bg-cream text-ink pb-20 md:pb-0">
        <Header lang={lang} />
        {children}
        <Footer lang={lang} />
        <BottomNav lang={lang} />
      </body>
    </html>
  )
}
