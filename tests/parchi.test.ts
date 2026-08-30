import { describe, it, expect } from 'vitest'
import { isValidParchiNumber, PARCHI_MIN, PARCHI_MAX } from '@/lib/parchi'

describe('isValidParchiNumber', () => {
  it('has the documented range 1-1500', () => {
    expect(PARCHI_MIN).toBe(1)
    expect(PARCHI_MAX).toBe(1500)
  })

  it('rejects empty input', () => {
    expect(isValidParchiNumber('')).toBe(false)
  })

  it('rejects 0 (just below the lower boundary)', () => {
    expect(isValidParchiNumber('0')).toBe(false)
  })

  it('accepts 1 (lower boundary)', () => {
    expect(isValidParchiNumber('1')).toBe(true)
  })

  it('accepts 1500 (upper boundary)', () => {
    expect(isValidParchiNumber('1500')).toBe(true)
  })

  it('rejects 1501 (just above the upper boundary)', () => {
    expect(isValidParchiNumber('1501')).toBe(false)
  })

  it('rejects non-numeric input', () => {
    expect(isValidParchiNumber('abc')).toBe(false)
    expect(isValidParchiNumber('12a')).toBe(false)
  })

  it('rejects a decimal', () => {
    expect(isValidParchiNumber('12.5')).toBe(false)
  })

  it('rejects a negative number', () => {
    expect(isValidParchiNumber('-5')).toBe(false)
  })

  it('rejects whitespace-padded input', () => {
    expect(isValidParchiNumber(' 5 ')).toBe(false)
  })

  it('accepts an ordinary mid-range value', () => {
    expect(isValidParchiNumber('742')).toBe(true)
  })
})
