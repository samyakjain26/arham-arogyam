'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getDictionary, isLang, DEFAULT_LANG } from '@/lib/i18n'
import { buttonClasses } from '@/components/ui/Button'

// Next's `not-found.js` convention deliberately takes no props (see
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md)
// — even nested under app/[lang], it does not receive the `lang` route
// param. This file still renders as `children` inside app/[lang]/layout.tsx,
// so Header/Footer/BottomNav and <html lang=...> are already correct (that
// layout DID resolve a valid `lang` from the URL — that's the only way
// Next reaches this boundary instead of the layout's own `notFound()` call
// for an invalid top-level segment). For the copy on this page itself, the
// officially documented workaround for path-dependent content in
// not-found.js is a Client Component hook — usePathname() — read on mount,
// so it always matches the segment that's actually in the URL bar.
export default function NotFound() {
  const pathname = usePathname()
  const firstSegment = pathname?.split('/')[1] ?? ''
  const lang = isLang(firstSegment) ? firstSegment : DEFAULT_LANG
  const d = getDictionary(lang)

  return (
    <main className="mx-auto max-w-content px-6 py-16 text-center md:py-24">
      <h1 className="text-4xl md:text-5xl">{d.notFound.title}</h1>
      <p className="mx-auto mt-4 max-w-prose text-lg text-ink">{d.notFound.body}</p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link href={`/${lang}`} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          {d.notFound.home}
        </Link>
        <Link href={`/${lang}/book`} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
          {d.notFound.book}
        </Link>
      </div>
    </main>
  )
}
