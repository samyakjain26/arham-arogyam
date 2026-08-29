import { getDictionary, type Lang } from '@/lib/i18n'

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)
  return <main className="mx-auto max-w-content p-6"><h1>{d.site.name}</h1></main>
}
