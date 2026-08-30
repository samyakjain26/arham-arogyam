import Image from 'next/image'
import { t, type Dictionary } from '@/lib/i18n'

// The clinic has not supplied a photo of Vaidya Rahul Jain (design doc, open
// question #3). A stock photo of any person standing in for him would
// misrepresent who treats you — worse than no photo. Swap in a real src here
// once one exists; nothing else in this component needs to change.
const VAIDYA_PHOTO_SRC: string | null = null

// Not yet supplied by the clinic. Render nothing until a real value lands
// here — never a placeholder like "Reg. No. XXXXX".
const REGISTRATION_NUMBER = ''

export function TrustStrip({ d }: { d: Dictionary }) {
  return (
    <section className="mx-auto max-w-content px-6 py-10 md:py-14">
      <div
        className="flex flex-col items-center gap-5 rounded-card border border-hairline
                   bg-surface p-6 text-center shadow-card sm:flex-row sm:text-left md:p-8"
      >
        {/* Ring echoes the logo's tri-colour ring rather than a photo. */}
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-[3px]
                     bg-[conic-gradient(var(--magenta-600),var(--gold-500),var(--green-700),var(--magenta-600))]
                     md:h-28 md:w-28"
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-green-50">
            {VAIDYA_PHOTO_SRC ? (
              <Image
                src={VAIDYA_PHOTO_SRC}
                alt={d.hero.vaidya}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="text-3xl font-bold text-green-900 [font-family:var(--font-noto-serif-dev)] md:text-4xl"
              >
                रा
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold text-green-900 md:text-2xl">{d.hero.vaidya}</p>
          <p className="mt-1 text-lg text-ink-muted">{d.trust.title}</p>
          {REGISTRATION_NUMBER && (
            <p className="mt-2 text-lg text-ink-muted">
              {t(d.trust.regLabel, { n: REGISTRATION_NUMBER })}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
