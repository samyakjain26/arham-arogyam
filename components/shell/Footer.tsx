import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'

// The clinic's public phone number is an open question for the clinic
// (design doc, "Open Questions for the Clinic", item 5) — not yet supplied.
// A wrong or placeholder tap-to-call number is worse than none for patients
// calling ahead, so the link only renders once a real number lands here.
const CLINIC_PHONE = ''

// Task 14 (content pages) adds `privacy` / `terms` dictionary sections.
// Until then these two labels are inlined by language rather than reaching
// into dictionaries this task does not own — swap for d.privacy.title /
// d.terms.title once Task 14 lands.
const FOOTER_LINK_LABELS = {
  hi: { privacy: 'गोपनीयता नीति', terms: 'नियम व शर्तें' },
  en: { privacy: 'Privacy Policy', terms: 'Terms' },
} as const

export function Footer({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  const labels = FOOTER_LINK_LABELS[lang]

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

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href={`/${lang}/privacy`}
            className="inline-flex min-h-[48px] items-center text-base font-medium
                       text-green-700 hover:text-green-900"
          >
            {labels.privacy}
          </Link>
          <Link
            href={`/${lang}/terms`}
            className="inline-flex min-h-[48px] items-center text-base font-medium
                       text-green-700 hover:text-green-900"
          >
            {labels.terms}
          </Link>
        </div>
      </div>
    </footer>
  )
}
