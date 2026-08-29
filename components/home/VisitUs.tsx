import type { Dictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'

// Canonical English form of the address, used only to build the maps query.
// Matches dictionaries/en.json's hero.address verbatim; kept stable across
// locales because a plain-English street query geocodes more reliably than
// a transliterated Hindi one. The address show to the user is still
// d.hero.address, localized.
const MAPS_QUERY_ADDRESS = 'C-39, Jyoti Marg, Bapu Nagar, Jaipur'

// Public phone number not yet supplied by the clinic (design doc, "Open
// Questions for the Clinic", item 5 — the same open item
// components/shell/Footer.tsx gates its tap-to-call link on). Render
// nothing until a real number lands here; a wrong number sent to a patient
// calling ahead is worse than none.
const CLINIC_PHONE = ''

// No Google Maps iframe: the address is real and known, so a maps SEARCH
// link built from it is legitimate, but an embedded iframe pinned to a
// guessed place ID would fabricate a location, and a third-party iframe is
// the heaviest thing that could land on a page with an LCP budget.
export function VisitUs({ d }: { d: Dictionary }) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY_ADDRESS)}`

  return (
    <section className="mx-auto max-w-content px-6 py-12 md:py-16">
      <div className="rounded-card border border-hairline bg-surface p-6 shadow-card md:p-10">
        <h2 className="text-3xl md:text-4xl">{d.visit.title}</h2>
        <p className="mt-4 max-w-prose text-lg text-ink">{d.hero.address}</p>
        <p className="mt-2 text-lg font-semibold text-green-800">{d.hero.timing}</p>

        <div className="mt-6 flex flex-wrap gap-4">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="md">{d.visit.directions}</Button>
          </a>

          {CLINIC_PHONE && (
            <a href={`tel:${CLINIC_PHONE}`} aria-label={d.a11y.callClinic}>
              <Button variant="ghost" size="md">{CLINIC_PHONE}</Button>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
