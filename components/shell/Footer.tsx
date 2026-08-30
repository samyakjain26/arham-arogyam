import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'

// The clinic's public phone number is an open question for the clinic
// (design doc, "Open Questions for the Clinic", item 5) — not yet supplied.
// A wrong or placeholder tap-to-call number is worse than none for patients
// calling ahead, so the link only renders once a real number lands here.
const CLINIC_PHONE = ''

// Mobile has no hamburger menu — Header's text links are `hidden md:flex`
// and BottomNav only carries three thumb-reachable items (home/book/contact).
// This footer nav is therefore the ONLY mobile route to about/services/
// ayurveda (the page carrying the approved medical notice) on every page —
// it's reachable by scrolling, present in every render of this component,
// and lists every content page site-wide alongside privacy/terms.
const NAV_KEYS = ['about', 'services', 'ayurveda', 'contact'] as const

export function Footer({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  const links = [
    ...NAV_KEYS.map((key) => ({ href: `/${lang}/${key}`, label: d.nav[key] })),
    { href: `/${lang}/privacy`, label: d.privacy.title },
    { href: `/${lang}/terms`, label: d.terms.title },
  ]

  return (
    <footer className="border-t border-hairline bg-green-50">
      <div className="mx-auto max-w-content px-6 py-10">
        <p className="text-lg font-semibold text-green-900">{d.site.name}</p>
        {/* No explicit text-* size here: inherits the 18px body floor
            (address/timing are read content, not UI chrome). */}
        <p className="mt-2 text-ink-muted">{d.hero.address}</p>
        <p className="mt-1 text-ink-muted">{d.hero.timing}</p>

        {CLINIC_PHONE && (
          <a
            href={`tel:${CLINIC_PHONE}`}
            aria-label={d.a11y.callClinic}
            className="mt-3 inline-flex min-h-[48px] items-center text-base font-medium
                       text-green-700 underline underline-offset-4 hover:text-green-900"
          >
            {CLINIC_PHONE}
          </a>
        )}

        <p className="mt-6 max-w-prose text-ink-muted">{d.disclaimer}</p>

        <nav aria-label={d.a11y.siteLinks} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[48px] items-center text-base font-medium
                         text-green-700 hover:text-green-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
