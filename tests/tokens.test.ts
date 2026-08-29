import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('app/globals.css', 'utf8')

const REQUIRED_TOKENS = [
  '--green-900: #14401A',
  '--green-700: #1B5E20',
  '--green-500: #2E7D32',
  '--green-300: #66BB6A',
  '--green-50: #EDF5EE',
  '--saffron-600: #C96A10',
  '--saffron-500: #E8871E',
  '--saffron-100: #FDF0DC',
  '--magenta-600: #D81B60',
  '--magenta-50: #FCE4EC',
  '--gold-500: #F2C230',
  '--cream: #FFFCF5',
  '--surface: #FFFFFF',
  '--ink: #1C1917',
  '--ink-muted: #57534E',
  '--border: #E7E2D8',
]

describe('design tokens', () => {
  it.each(REQUIRED_TOKENS)('defines %s', (token) => {
    expect(css).toContain(token)
  })

  it('honours prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('sets an 18px body floor', () => {
    expect(css).toMatch(/font-size:\s*18px/)
  })
})
