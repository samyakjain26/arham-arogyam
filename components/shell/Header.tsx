import Image from 'next/image'
import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'
import { LangToggle } from './LangToggle'

// Desktop-only text links. Mobile has no menu at all — BottomNav carries
// navigation there, per the "no hamburger" constraint.
const NAV_KEYS = ['about', 'services', 'ayurveda', 'contact'] as const

export function Header({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  const links = NAV_KEYS.map((key) => ({ href: `/${lang}/${key}`, label: d.nav[key] }))

  return (
    <header className="border-b border-hairline bg-cream">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${lang}`} className="flex min-h-[48px] items-center gap-3">
          {/* alt="" — decorative here, the clinic name is announced by the
              adjacent text so the image would otherwise be read out twice. */}
          <Image
            src="/logo.jpg"
            alt=""
            width={44}
            height={44}
            priority
            className="rounded-lg"
          />
          <span className="text-lg font-semibold text-green-900 sm:text-xl">
            {d.site.name}
          </span>
        </Link>

        <nav aria-label={d.a11y.menu} className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[48px] items-center text-base font-medium
                         text-green-700 transition-colors duration-150 hover:text-green-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <LangToggle lang={lang} label={d.a11y.langToggle} />
      </div>
    </header>
  )
}
