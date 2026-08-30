import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'

export function BottomNav({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  // Third slot used to link to /my-appointments, a page that has never
  // existed (there is no backend, so there is nothing to show) — tapping it
  // hit Next's stock, unlocalized 404. `contact` is a real route every
  // patient may need mid-journey (address, hours, directions). The other
  // four content pages (about/services/ayurveda/privacy/terms... plus this
  // one) are all reachable from Footer's nav block on every page instead of
  // competing for one of these three thumb-reachable slots.
  const items = [
    { href: `/${lang}`, label: d.nav.home },
    { href: `/${lang}/book`, label: d.nav.book },
    { href: `/${lang}/contact`, label: d.nav.contact },
  ]

  return (
    <nav
      aria-label={d.a11y.menu}
      className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 border-t border-hairline
                 bg-surface/95 backdrop-blur md:hidden
                 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex min-h-[56px] items-center justify-center text-base
                     font-medium text-green-700 active:bg-green-50"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}
