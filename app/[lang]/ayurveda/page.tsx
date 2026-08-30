import { getDictionary, type Lang } from '@/lib/i18n'
import { Prose } from '@/components/Prose'
import { Card } from '@/components/ui/Card'
import { LeafBullet } from '@/components/home/ServiceCards'
import { Stagger } from '@/components/motion/Stagger'
import { Reveal } from '@/components/motion/Reveal'

// Content-constrained page (see design doc): this page lists categories of
// support only — Ayurvedic medicines, herbal remedies, natural ingredients,
// lifestyle guidance, diet recommendations, preventive advice — all sourced
// from d.ayurveda.categories. It must never name a medical condition, claim
// a therapeutic/curative effect, recommend a specific remedy, suggest a
// dosage, or imply an outcome. d.ayurveda.notice is rendered verbatim below,
// unedited — it is approved legal text, not to be retranslated or reworded.
export default async function AyurvedaPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.ayurveda.title}</h1>

        <Reveal>
          <Prose className="mx-auto mt-6 text-center">
            <p>{d.ayurveda.intro}</p>
          </Prose>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Stagger>
            {d.ayurveda.categories.map((category) => (
              <Card key={category} className="flex flex-row items-center gap-3">
                <LeafBullet />
                <p className="text-lg text-ink">{category}</p>
              </Card>
            ))}
          </Stagger>
        </div>

        <Reveal delay={240}>
          <div className="mt-8 rounded-card border-l-4 border-saffron-500 bg-saffron-100 p-6">
            <p className="text-lg">{d.ayurveda.notice}</p>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
