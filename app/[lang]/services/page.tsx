import { getDictionary, type Lang } from '@/lib/i18n'
import { Prose } from '@/components/Prose'
import { Card } from '@/components/ui/Card'
import { LeafBullet } from '@/components/home/ServiceCards'
import { Stagger } from '@/components/motion/Stagger'
import { Reveal } from '@/components/motion/Reveal'

export default async function ServicesPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.services.title}</h1>

        <Reveal>
          <Prose className="mx-auto mt-6 text-center">
            <p>{d.services.intro}</p>
          </Prose>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stagger>
            {d.services.items.map((item) => (
              <Card key={item} className="flex h-full flex-col items-center gap-3 text-center">
                <LeafBullet />
                <p className="text-lg text-ink">{item}</p>
              </Card>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  )
}
