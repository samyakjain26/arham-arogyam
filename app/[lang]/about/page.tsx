import { getDictionary, type Lang } from '@/lib/i18n'
import { Prose } from '@/components/Prose'
import { Reveal } from '@/components/motion/Reveal'

export default async function AboutPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.about.title}</h1>

        <Reveal>
          <Prose className="mx-auto mt-8">
            <p>{d.about.mission}</p>
          </Prose>
        </Reveal>

        <Reveal delay={80}>
          <div className="mx-auto mt-10 max-w-prose rounded-card border border-hairline bg-surface p-6 shadow-card md:p-8">
            <p className="text-xl font-semibold text-green-900">{d.hero.vaidya}</p>
            <Prose className="mt-3">
              <p>{d.about.vaidyaBody}</p>
            </Prose>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mx-auto mt-10 max-w-prose">
            <h2 className="text-3xl md:text-4xl">{d.about.accessTitle}</h2>
            <Prose className="mt-4">
              <p>{d.about.accessBody}</p>
            </Prose>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
