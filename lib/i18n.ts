import hi from '@/dictionaries/hi.json'
import en from '@/dictionaries/en.json'

export const LANGS = ['hi', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'hi'

export type Dictionary = typeof hi

const DICTS: Record<Lang, Dictionary> = { hi, en: en as Dictionary }

export function getDictionary(lang: Lang): Dictionary {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG]
}

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v)
}

/** Replaces {name} placeholders. t(d.book.step, { n: 2 }) */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
