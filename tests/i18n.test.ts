import { describe, it, expect } from 'vitest'
import hi from '../dictionaries/hi.json'
import en from '../dictionaries/en.json'

// Arrays are flattened by index (e.g. `services.items.0`, `services.items.1`)
// rather than treated as opaque leaves. That way a missing/extra array
// element, or an element count mismatch between languages, shows up as a
// key-set diff instead of silently passing.
function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (Array.isArray(v)) {
      return v.flatMap((el, i) => {
        const arrKey = `${key}.${i}`
        return el !== null && typeof el === 'object'
          ? flatten(el as Record<string, unknown>, arrKey)
          : [arrKey]
      })
    }
    return v !== null && typeof v === 'object'
      ? flatten(v as Record<string, unknown>, key)
      : [key]
  })
}

function getPath(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined),
    obj,
  )
}

describe('dictionaries', () => {
  const hiKeys = flatten(hi).sort()
  const enKeys = flatten(en).sort()

  it('have identical key sets', () => {
    expect(hiKeys).toEqual(enKeys)
  })

  it('have no empty values in hi', () => {
    const empties = hiKeys.filter((k) => getPath(hi, k) === '')
    expect(empties).toEqual([])
  })

  it('have no empty values in en', () => {
    const empties = enKeys.filter((k) => getPath(en, k) === '')
    expect(empties).toEqual([])
  })
})
