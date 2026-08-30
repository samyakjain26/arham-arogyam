import { describe, it, expect } from 'vitest'
import {
  istWallClockToUtc, utcToIstParts, istWeekday, formatIstTime, formatIstDateLabel, formatIstHourRange,
} from '@/lib/time'

describe('IST conversion', () => {
  it('converts 17:00 IST to 11:30 UTC', () => {
    expect(istWallClockToUtc('2026-09-01', '17:00').toISOString())
      .toBe('2026-09-01T11:30:00.000Z')
  })

  it('handles a time that crosses the UTC date boundary backwards', () => {
    // 00:30 IST on the 2nd is 19:00 UTC on the 1st
    expect(istWallClockToUtc('2026-09-02', '00:30').toISOString())
      .toBe('2026-09-01T19:00:00.000Z')
  })

  it('round-trips back to the same IST wall clock', () => {
    const utc = istWallClockToUtc('2026-09-01', '21:45')
    expect(utcToIstParts(utc)).toEqual({ dateISO: '2026-09-01', hhmm: '21:45' })
  })

  it('reports Tuesday as weekday 2', () => {
    expect(istWeekday('2026-09-01')).toBe(2) // 1 Sep 2026 is a Tuesday
  })

  it('formats 5:30 PM for each language', () => {
    const d = istWallClockToUtc('2026-09-01', '17:30')
    expect(formatIstTime(d, 'en')).toBe('5:30 PM')
    expect(formatIstTime(d, 'hi')).toBe('शाम 5:30')
  })

  it('formats the IST calendar date label for each language', () => {
    // 1 Sep 2026 is a Tuesday (see istWeekday test above).
    expect(formatIstDateLabel('2026-09-01', 'en')).toBe('Tuesday, 1 September')
    expect(formatIstDateLabel('2026-09-01', 'hi')).toBe('मंगलवार, 1 सितंबर')
  })

  it('formats an hour capacity block as a range, repeating the period word in Hindi', () => {
    const start = istWallClockToUtc('2026-09-01', '17:00')
    const end = istWallClockToUtc('2026-09-01', '18:00')
    expect(formatIstHourRange(start, end, 'hi')).toBe('शाम 5 – शाम 6')
    expect(formatIstHourRange(start, end, 'en')).toBe('5 PM – 6 PM')
  })
})
