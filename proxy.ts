import { NextResponse, type NextRequest } from 'next/server'
import { LANGS, DEFAULT_LANG } from '@/lib/i18n'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasLang = LANGS.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLang) return NextResponse.next()

  const preferred = req.cookies.get('lang')?.value
  const lang = LANGS.includes(preferred as never) ? preferred : DEFAULT_LANG
  const url = req.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|admin|_next|favicon.ico|.*\\.).*)'],
}
