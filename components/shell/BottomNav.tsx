import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'

export function BottomNav({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  const items = [
    { href: `/${lang}`, label: d.nav.home },
    { href: `/${lang}/book`, label: d.nav.book },
    { href: `/${lang}/my-appointments`, label: d.nav.mine },
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
