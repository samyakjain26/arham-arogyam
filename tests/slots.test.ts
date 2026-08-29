import { describe, it, expect } from 'vitest'
import { getAvailableSlots, overlaps, nextTuesdays, type SlotParams } from '@/lib/slots'
import { istWallClockToUtc } from '@/lib/time'

const TUESDAY = '2026-09-01'          // a Tuesday
const WEDNESDAY = '2026-09-02'
const RULES = [{ weekday: 2, startTime: '17:00', endTime: '22:00', active: true }]

// Far in the past, so min-lead never filters anything unless a test wants it to.
const LONG_BEFORE = new Date('2026-08-01T00:00:00.000Z')

function params(over: Partial<SlotParams> = {}): SlotParams {
  return {
    dateISO: TUESDAY, rules: RULES, blackouts: [], booked: [],
    slotMinutes: 15, minLeadHours: 2, now: LONG_BEFORE, ...over,
  }
}

describe('overlaps', () => {
  const a1 = new Date('2026-09-01T11:30:00Z')
  const a2 = new Date('2026-09-01T11:45:00Z')

  it('is false for adjacent ranges', () => {
    expect(overlaps(a1, a2, a2, new Date('2026-09-01T12:00:00Z'))).toBe(false)
  })

  it('is true for partial overlap', () => {
    expect(overlaps(a1, a2, new Date('2026-09-01T11:40:00Z'), new Date('2026-09-01T11:55:00Z')))
      .toBe(true)
  })

  it('is true for containment', () => {
    expect(overlaps(a1, new Date('2026-09-01T12:30:00Z'), a2, new Date('2026-09-01T12:00:00Z')))
      .toBe(true)
  })
})

describe('getAvailableSlots — input validation', () => {
  // slotMinutes of 0 or negative makes the generation loop's step never
  // advance (or never satisfy its exit condition), which hangs the process
  // forever instead of failing. Each test carries an explicit timeout so
  // that if this guard ever regresses, the suite fails fast instead of
  // hanging CI indefinitely.
  it('throws for slotMinutes of 0', () => {
    expect(() => getAvailableSlots(params({ slotMinutes: 0 }))).toThrow(RangeError)
  }, 2000)

  it('throws for negative slotMinutes', () => {
    expect(() => getAvailableSlots(params({ slotMinutes: -15 }))).toThrow(RangeError)
  }, 2000)

  it('throws for NaN slotMinutes', () => {
    expect(() => getAvailableSlots(params({ slotMinutes: NaN }))).toThrow(RangeError)
  }, 2000)

  it('throws for Infinity slotMinutes', () => {
    expect(() => getAvailableSlots(params({ slotMinutes: Infinity }))).toThrow(RangeError)
  }, 2000)

  it('throws for NaN minLeadHours', () => {
    expect(() => getAvailableSlots(params({ minLeadHours: NaN }))).toThrow(RangeError)
  }, 2000)

  it('throws for Infinity minLeadHours', () => {
    expect(() => getAvailableSlots(params({ minLeadHours: Infinity }))).toThrow(RangeError)
  }, 2000)

  it('throws for negative minLeadHours', () => {
    expect(() => getAvailableSlots(params({ minLeadHours: -1 }))).toThrow(RangeError)
  }, 2000)

  it('accepts a minLeadHours of exactly 0 (no minimum lead time)', () => {
    expect(() => getAvailableSlots(params({ minLeadHours: 0 }))).not.toThrow()
  }, 2000)
})

describe('getAvailableSlots', () => {
  it('generates 20 fifteen-minute slots for 17:00-22:00', () => {
    const slots = getAvailableSlots(params())
    expect(slots).toHaveLength(20)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:30:00.000Z')  // 17:00 IST
    expect(slots[19].end.toISOString()).toBe('2026-09-01T16:30:00.000Z')   // 22:00 IST
  })

  it('never produces a slot ending after the rule end time', () => {
    // The 17:00-22:00 window is 300 minutes. 300 / 45 = 6 full slots (270 min),
    // leaving a genuine 30-minute tail: a 7th slot would run 21:30-22:15, past
    // the 22:00 window end, so it must be dropped. Last slot ends at 21:30 IST.
    const slots = getAvailableSlots(params({ slotMinutes: 45 }))
    const last = slots[slots.length - 1]
    expect(last.end.getTime()).toBeLessThanOrEqual(
      istWallClockToUtc(TUESDAY, '22:00').getTime())
    expect(last.end.getTime()).toBe(istWallClockToUtc(TUESDAY, '21:30').getTime())
    expect(slots).toHaveLength(6)
  })

  it('returns nothing for a day with no matching rule', () => {
    expect(getAvailableSlots(params({ dateISO: WEDNESDAY }))).toEqual([])
  })

  it('returns nothing when the rule is inactive', () => {
    const rules = [{ ...RULES[0], active: false }]
    expect(getAvailableSlots(params({ rules }))).toEqual([])
  })

  it('drops slots inside the minimum lead time', () => {
    // 16:00 IST on the day itself; with a 2-hour lead, 17:00 and 17:45 are out,
    // so the first bookable slot is 18:00.
    const now = istWallClockToUtc(TUESDAY, '16:00')
    const slots = getAvailableSlots(params({ now, minLeadHours: 2 }))
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:30:00.000Z') // 18:00 IST
  })

  it('returns nothing on a whole-day blackout', () => {
    const blackouts = [{ date: TUESDAY, startTime: null, endTime: null }]
    expect(getAvailableSlots(params({ blackouts }))).toEqual([])
  })

  it('treats a blackout with only one time set as a whole-day blackout (deliberate fail-safe)', () => {
    const blackouts = [{ date: TUESDAY, startTime: '17:00', endTime: null }]
    expect(getAvailableSlots(params({ blackouts }))).toEqual([])
  })

  it('drops only the blacked-out range on a partial blackout', () => {
    // Vaidya arrives an hour late: 17:00-18:00 blocked, 4 slots removed.
    const blackouts = [{ date: TUESDAY, startTime: '17:00', endTime: '18:00' }]
    const slots = getAvailableSlots(params({ blackouts }))
    expect(slots).toHaveLength(16)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:30:00.000Z') // 18:00 IST
  })

  it('ignores a blackout for a different date', () => {
    const blackouts = [{ date: WEDNESDAY, startTime: null, endTime: null }]
    expect(getAvailableSlots(params({ blackouts }))).toHaveLength(20)
  })

  it('removes an exactly-matching booked slot', () => {
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:00'),
      end: istWallClockToUtc(TUESDAY, '17:15'),
    }]
    const slots = getAvailableSlots(params({ booked }))
    expect(slots).toHaveLength(19)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:45:00.000Z') // 17:15 IST
  })

  it('removes every slot a booking partially overlaps', () => {
    // THE load-bearing case. A 17:10-17:25 booking (made when slots were
    // 15 minutes and offset differently) must knock out BOTH the 17:00-17:15
    // and 17:15-17:30 slots. An equality check would wrongly keep both.
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:10'),
      end: istWallClockToUtc(TUESDAY, '17:25'),
    }]
    const slots = getAvailableSlots(params({ booked }))
    expect(slots).toHaveLength(18)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:00:00.000Z') // 17:30 IST
  })

  it('routes around old bookings after the admin changes slot length', () => {
    // Existing 15-minute booking at 17:00-17:15; admin switches to 20 minutes.
    // The 17:00-17:20 slot overlaps it and must be dropped; 17:20 onward stand.
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:00'),
      end: istWallClockToUtc(TUESDAY, '17:15'),
    }]
    const slots = getAvailableSlots(params({ slotMinutes: 20, booked }))
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:50:00.000Z') // 17:20 IST
    expect(slots).toHaveLength(14)
  })

  it('returns nothing when every slot is booked', () => {
    const booked = getAvailableSlots(params()).map((s) => ({ start: s.start, end: s.end }))
    expect(getAvailableSlots(params({ booked }))).toEqual([])
  })

  it('returns slots sorted by start time', () => {
    const slots = getAvailableSlots(params())
    const times = slots.map((s) => s.start.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })
})

describe('getAvailableSlots — overlapping rules', () => {
  it('deduplicates overlapping windows from two active rules on the same weekday', () => {
    // 17:00-20:00 and 19:00-22:00 overlap on 19:00-20:00. Without dedup, the
    // 19:00-20:00 slot would be emitted twice and two patients could be
    // offered the identical time.
    const rules = [
      { weekday: 2, startTime: '17:00', endTime: '20:00', active: true },
      { weekday: 2, startTime: '19:00', endTime: '22:00', active: true },
    ]
    const slots = getAvailableSlots(params({ rules, slotMinutes: 60 }))
    expect(slots).toHaveLength(5)

    const starts = slots.map((s) => s.start.getTime())
    expect(new Set(starts).size).toBe(starts.length) // no duplicate starts

    // no two kept slots may overlap each other
    for (let i = 1; i < slots.length; i++) {
      expect(overlaps(slots[i - 1].start, slots[i - 1].end, slots[i].start, slots[i].end))
        .toBe(false)
    }

    expect(slots[0].start.toISOString()).toBe(istWallClockToUtc(TUESDAY, '17:00').toISOString())
    expect(slots[slots.length - 1].end.toISOString())
      .toBe(istWallClockToUtc(TUESDAY, '22:00').toISOString())
  })

  it('unions two non-overlapping windows from two active rules on the same weekday', () => {
    const rules = [
      { weekday: 2, startTime: '09:00', endTime: '11:00', active: true },
      { weekday: 2, startTime: '17:00', endTime: '19:00', active: true },
    ]
    const slots = getAvailableSlots(params({ rules, slotMinutes: 60 }))
    expect(slots.map((s) => s.start.toISOString())).toEqual([
      istWallClockToUtc(TUESDAY, '09:00').toISOString(),
      istWallClockToUtc(TUESDAY, '10:00').toISOString(),
      istWallClockToUtc(TUESDAY, '17:00').toISOString(),
      istWallClockToUtc(TUESDAY, '18:00').toISOString(),
    ])
  })
})

describe('nextTuesdays', () => {
  it('returns the coming Tuesdays including today when today is Tuesday', () => {
    expect(nextTuesdays('2026-09-01', 4))
      .toEqual(['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22'])
  })

  it('skips forward when today is not Tuesday', () => {
    expect(nextTuesdays('2026-09-03', 2)).toEqual(['2026-09-08', '2026-09-15'])
  })
})
