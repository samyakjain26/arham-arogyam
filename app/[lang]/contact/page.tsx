import { getDictionary, type Lang } from '@/lib/i18n'
import { buttonClasses } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'

// Canonical English form of the address, used only to build the maps query.
// Matches components/home/VisitUs.tsx and dictionaries/en.json's hero.address
// verbatim; kept stable across locales because a plain-English street query
// geocodes more reliably than a transliterated Hindi one.
const MAPS_QUERY_ADDRESS = 'C-39, Jyoti Marg, Bapu Nagar, Jaipur'

// Public phone number not yet supplied by the clinic (design doc, "Open
// Questions for the Clinic", item 5 — the same open item
// components/shell/Footer.tsx and components/home/VisitUs.tsx gate their
// tap-to-call link on). Render nothing until a real number lands here.
const CLINIC_PHONE = ''

export default async function ContactPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY_ADDRESS)}`

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.contact.title}</h1>

        <Reveal>
          <div className="mx-auto mt-10 max-w-prose rounded-card border border-hairline bg-surface p-6 shadow-card md:p-8">
            <h2 className="text-2xl md:text-3xl">{d.contact.addressTitle}</h2>
            <p className="mt-3 max-w-prose text-lg text-ink">{d.hero.address}</p>

            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: 'secondary', size: 'md' })}
              >
                {d.visit.directions}
              </a>

              {CLINIC_PHONE && (
                <a
                  href={`tel:${CLINIC_PHONE}`}
                  aria-label={d.a11y.callClinic}
                  className={buttonClasses({ variant: 'ghost', size: 'md' })}
                >
                  {CLINIC_PHONE}
                </a>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto mt-8 max-w-prose rounded-card border border-hairline bg-surface p-6 shadow-card md:p-8">
            <h2 className="text-2xl md:text-3xl">{d.contact.timingsTitle}</h2>
            <p className="mt-3 text-xl font-semibold text-green-900">{d.hero.timing}</p>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
