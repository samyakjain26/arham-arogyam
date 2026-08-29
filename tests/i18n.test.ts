import { describe, it, expect } from 'vitest'
import hi from '../dictionaries/hi.json'
import en from '../dictionaries/en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, key)
      : [key]
  })
}

describe('dictionaries', () => {
  const hiKeys = flatten(hi).sort()
  const enKeys = flatten(en).sort()

  it('have identical key sets', () => {
    expect(hiKeys).toEqual(enKeys)
  })

  it('have no empty values in hi', () => {
    const empties = flatten(hi).filter((k) =>
      k.split('.').reduce<any>((o, p) => o?.[p], hi) === '')
    expect(empties).toEqual([])
  })

  it('have no empty values in en', () => {
    const empties = flatten(en).filter((k) =>
      k.split('.').reduce<any>((o, p) => o?.[p], en) === '')
    expect(empties).toEqual([])
  })
})
