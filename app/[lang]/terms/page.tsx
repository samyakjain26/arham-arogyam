import { getDictionary, type Lang } from '@/lib/i18n'
import { Prose } from '@/components/Prose'
import { Reveal } from '@/components/motion/Reveal'

// The medical disclaimer (not for emergencies, no online medical advice,
// consult the Doctor before taking any medicine or remedy) gets the same
// saffron-highlighted treatment as d.ayurveda.notice on /ayurveda — it is
// the one section on this page that must not be skimmed past.
export default async function TermsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.terms.title}</h1>

        <Reveal>
          <Prose className="mx-auto mt-6">
            <p>{d.terms.intro}</p>
          </Prose>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto mt-10 max-w-prose rounded-card border-l-4 border-saffron-500 bg-saffron-100 p-6">
            <h2 className="text-2xl text-green-900 md:text-3xl">{d.terms.disclaimerTitle}</h2>
            <p className="mt-3 text-lg">{d.terms.disclaimerBody}</p>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mx-auto mt-8 max-w-prose">
            <h2 className="text-2xl md:text-3xl">{d.terms.usageTitle}</h2>
            <Prose className="mt-3">
              <p>{d.terms.usageBody}</p>
            </Prose>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="mx-auto mt-8 max-w-prose">
            <h2 className="text-2xl md:text-3xl">{d.terms.changesTitle}</h2>
            <Prose className="mt-3">
              <p>{d.terms.changesBody}</p>
            </Prose>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
