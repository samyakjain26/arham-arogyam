import { getDictionary, type Lang } from '@/lib/i18n'
import { Hero } from '@/components/home/Hero'
import { TrustStrip } from '@/components/home/TrustStrip'
import { ServiceCards } from '@/components/home/ServiceCards'
import { HowItWorks } from '@/components/home/HowItWorks'
import { VisitUs } from '@/components/home/VisitUs'
import { Reveal } from '@/components/motion/Reveal'

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)
  return (
    <main>
      <Hero lang={lang} d={d} />
      <Reveal><TrustStrip d={d} /></Reveal>
      <ServiceCards d={d} />
      <Reveal><HowItWorks d={d} /></Reveal>
      <Reveal><VisitUs d={d} /></Reveal>
    </main>
  )
}
