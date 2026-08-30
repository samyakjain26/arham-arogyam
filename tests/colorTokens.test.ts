import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

// Cheap guard for the class of bug behind IMPORTANT 6: `text-green-800` isn't
// one of our brand shades (app/globals.css only defines green
// 900/700/500/300/50), so Tailwind silently falls through to its own
// built-in green-800 (#016630) — a colour nobody chose, and tests/tokens.test.ts
// can't catch it because it only checks that our own tokens are *defined*,
// not that every usage in components/app actually names one of them.
//
// This scans every source file for our brand colour families used with a
// numeric Tailwind shade and fails if that shade isn't one we've minted in
// app/globals.css's `@theme inline` block. It won't catch every possible
// misuse (arbitrary values, computed class names), but it catches exactly
// the "used a plausible-looking default-palette shade we never defined"
// mistake cheaply, with no new dependency.
const ALLOWED_SHADES: Record<string, number[]> = {
  green: [900, 700, 500, 300, 50],
  saffron: [800, 700, 600, 500, 100],
  magenta: [600, 50],
  gold: [500],
}

const SCAN_DIRS = ['app', 'components']
const SOURCE_EXTS = new Set(['.ts', '.tsx'])

function listFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...listFiles(full))
    else if (SOURCE_EXTS.has(extname(full))) out.push(full)
  }
  return out
}

// Matches e.g. `text-green-800`, `bg-saffron-400`, `border-magenta-300` —
// any Tailwind colour-utility prefix paired with one of our brand family
// names and a numeric shade.
const UTILITY_PREFIXES =
  'text|bg|border|ring|from|via|to|decoration|fill|stroke|accent|caret|outline|divide|placeholder'
const COLOR_CLASS_RE = new RegExp(
  `\\b(?:${UTILITY_PREFIXES})-(green|saffron|magenta|gold)-(\\d+)\\b`, 'g',
)

describe('brand colour tokens are used, not guessed', () => {
  const files = SCAN_DIRS.flatMap((dir) => listFiles(dir))

  it('every green/saffron/magenta/gold utility class names a defined shade', () => {
    const violations: string[] = []
    for (const file of files) {
      const contents = readFileSync(file, 'utf8')
      for (const match of contents.matchAll(COLOR_CLASS_RE)) {
        const [full, family, shadeStr] = match
        const shade = Number(shadeStr)
        if (!ALLOWED_SHADES[family]?.includes(shade)) {
          violations.push(`${file}: ${full}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
