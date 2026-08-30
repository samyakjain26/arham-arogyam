import { describe, it, expect } from 'vitest'
import { getHourBlocksForDate, getUpcomingTuesdaysWithCounts, HOUR_CAPACITY } from '@/lib/mockAvailability'

// Fixed "now", far before any lead-time cutoff could filter an hour out —
// mirrors tests/slots.test.ts's LONG_BEFORE convention.
const LONG_BEFORE = new Date('2026-08-01T00:00:00.000Z')

// With now = 2026-08-01 (a Saturday, IST), the first upcoming Tuesday is
// 2026-08-04 — the date lib/mockAvailability.ts's demo booked-count map
// pins its numbers to. 2026-08-11 is the Tuesday after that (no demo
// bookings). 2026-08-05 is a Wednesday — not a clinic day at all.
const FIRST_TUESDAY = '2026-08-04'
const SECOND_TUESDAY = '2026-08-11'
const A_WEDNESDAY = '2026-08-05'

describe('getHourBlocksForDate', () => {
  it('returns the five hourly blocks, all at full capacity, for a Tuesday with no demo bookings', async () => {
    const blocks = await getHourBlocksForDate(SECOND_TUESDAY, LONG_BEFORE)
    expect(blocks).toHaveLength(5)
    for (const b of blocks) {
      expect(b.capacity).toBe(HOUR_CAPACITY)
      expect(b.booked).toBe(0)
      expect(b.remaining).toBe(HOUR_CAPACITY)
    }
  })

  it('computes remaining as capacity minus booked for a partially-booked hour', async () => {
    const blocks = await getHourBlocksForDate(FIRST_TUESDAY, LONG_BEFORE)
    const fivePm = blocks.find((b) => b.start.toISOString() === '2026-08-04T11:30:00.000Z')
    expect(fivePm).toBeDefined()
    expect(fivePm!.booked).toBe(7)
    expect(fivePm!.remaining).toBe(18)
  })

  it('renders a full block (remaining 0) when booked reaches capacity', async () => {
    const blocks = await getHourBlocksForDate(FIRST_TUESDAY, LONG_BEFORE)
    const sixPm = blocks.find((b) => b.start.toISOString() === '2026-08-04T12:30:00.000Z')
    expect(sixPm).toBeDefined()
    expect(sixPm!.booked).toBe(HOUR_CAPACITY)
    expect(sixPm!.remaining).toBe(0)
    // Proves the "at least one hour is full" requirement is actually met,
    // not just theoretically reachable.
    expect(blocks.some((b) => b.remaining === 0)).toBe(true)
  })

  it('returns no blocks on a day the clinic is not open (empty day)', async () => {
    const blocks = await getHourBlocksForDate(A_WEDNESDAY, LONG_BEFORE)
    expect(blocks).toEqual([])
  })

  it('never lets booked exceed capacity even if demo data over-specifies it', async () => {
    // 18:00 is deliberately pinned to exactly HOUR_CAPACITY in the demo map;
    // this guards against a future edit accidentally pushing it past that
    // and remaining going negative.
    const blocks = await getHourBlocksForDate(FIRST_TUESDAY, LONG_BEFORE)
    for (const b of blocks) {
      expect(b.booked).toBeLessThanOrEqual(HOUR_CAPACITY)
      expect(b.remaining).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('getUpcomingTuesdaysWithCounts', () => {
  it('sums remaining places across all five hours, not a slot count', async () => {
    const dates = await getUpcomingTuesdaysWithCounts(2, LONG_BEFORE)
    expect(dates[0]).toEqual({ dateISO: FIRST_TUESDAY, count: 18 + 0 + 25 + 13 + 25 })
    expect(dates[1]).toEqual({ dateISO: SECOND_TUESDAY, count: 5 * HOUR_CAPACITY })
  })
})
