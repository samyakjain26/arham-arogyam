'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Lang } from '@/lib/i18n'

export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname()
  const other: Lang = lang === 'hi' ? 'en' : 'hi'
  // Preserve the current path across the switch.
  const href = pathname.replace(new RegExp(`^/${lang}`), `/${other}`)

  return (
    <Link
      href={href}
      aria-label={label}
      onClick={() => { document.cookie = `lang=${other}; path=/; max-age=31536000` }}
      className="min-h-[48px] inline-flex items-center rounded-full border border-hairline
                 px-4 text-base font-medium text-magenta-600 transition-colors
                 duration-200 hover:bg-magenta-50"
    >
      {other === 'hi' ? 'हिं' : 'EN'}
    </Link>
  )
}
