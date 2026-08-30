import Link from 'next/link'
import { lang as rootLang } from 'next/root-params'
import { getDictionary, isLang, DEFAULT_LANG } from '@/lib/i18n'
import { buttonClasses } from '@/components/ui/Button'

// `[lang]` is this app's ROOT parameter — app/[lang]/layout.tsx IS the root
// layout, so `lang` qualifies for next/root-params (introduced Next 16.3,
// see node_modules/next/dist/docs/.../functions/next-root-params.md). That
// lets this stay a plain Server Component instead of a Client Component
// reading usePathname(): not-found.js takes no props (even nested under a
// dynamic segment), but a root parameter getter works from any Server
// Component in the tree, no prop-drilling required. This also means the
// page's own copy is part of the server-rendered HTML in the initial
// response, rather than a client-hydrated component reference — confirmed
// by comparing raw (curl, no JS) output before/after this change.
export default async function NotFound() {
  const raw = await rootLang()
  const lang = isLang(raw) ? raw : DEFAULT_LANG
  const d = getDictionary(lang)

  return (
    <main className="mx-auto max-w-content px-6 py-16 text-center md:py-24">
      <h1 className="text-4xl md:text-5xl">{d.notFound.title}</h1>
      <p className="mx-auto mt-4 max-w-prose text-lg text-ink">{d.notFound.body}</p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link href={`/${lang}`} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
          {d.notFound.home}
        </Link>
        <Link href={`/${lang}/book`} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
          {d.notFound.book}
        </Link>
      </div>
    </main>
  )
}
