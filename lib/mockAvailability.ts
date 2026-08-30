import { getAvailableSlots, nextTuesdays, type AvailabilityRule } from '@/lib/slots'
import { utcToIstParts } from '@/lib/time'

/**
 * Stands in for `GET /api/availability?date=...`, which does not exist yet
 * in this frontend-only phase (no database, no backend). Mirrors the
 * clinic's real configuration below and runs it through the REAL slot
 * engine (lib/slots.ts) so the booking wizard is exercised against genuine
 * scheduling output, not fabricated data. When the real API lands, replace
 * the bodies of the two exported functions with fetch calls — every caller
 * already awaits a Promise, so nothing else in the wizard changes.
 *
 * The clinic books by the HOUR, not by individual appointment slots: each
 * Tuesday 5-10pm is five one-hour capacity blocks (5-6, 6-7, 7-8, 8-9,
 * 9-10pm), each holding up to HOUR_CAPACITY patients who each arrive
 * whenever suits them within that hour. `getAvailableSlots` (lib/slots.ts)
 * is reused unmodified to generate the five hour WINDOWS — called with
 * `slotMinutes: 60` — because it already applies the weekday rule,
 * blackouts and the minimum lead time correctly. Capacity accounting is a
 * separate layer on top of that output: `booked: []` is passed deliberately,
 * because the engine's booked-range exclusion (right for one-patient-per-
 * slot) would otherwise drop an entire hour the moment even one patient
 * books it — exactly wrong for a 25-seat shared block.
 */
const CLINIC_RULES: AvailabilityRule[] = [
  { weekday: 2, startTime: '17:00', endTime: '22:00', active: true },
]
export const HOUR_MINUTES = 60
const MIN_LEAD_HOURS = 2

/** Default size of the date-picker's rolling window (step 1). */
export const BOOKING_WINDOW_WEEKS = 4

/** Patients per one-hour block. 5 blocks x 25 = 125 places per Tuesday. */
export const HOUR_CAPACITY = 25

export interface HourBlock {
  start: Date
  end: Date
  capacity: number
  booked: number
  remaining: number
}

/**
 * Small in-memory "already booked" counts, pinned to the first upcoming
 * Tuesday (relative to `now`), purely so the hour grid has real,
 * demonstrable partially- and fully-booked hours to render — there is no
 * database in this phase. Keyed by IST wall-clock hour ("17:00" etc). One
 * hour is deliberately pinned at full capacity so the UI's "full" state is
 * provably exercised, not just theoretically reachable.
 */
function demoBookedCounts(dateISO: string, now: Date): Record<string, number> {
  const [firstTuesday] = nextTuesdays(utcToIstParts(now).dateISO, 1)
  if (dateISO !== firstTuesday) return {}
  return {
    '17:00': 7,  // 18 places remain
    '18:00': 25, // full
    '19:00': 0,  // untouched, all 25 remain
    '20:00': 12, // 13 places remain
    '21:00': 0,  // untouched, all 25 remain
  }
}

/**
 * The clinic's five hourly capacity blocks for `dateISO`, each carrying how
 * many of its HOUR_CAPACITY places are booked and how many remain. Blocks
 * are never removed for being full — same "visibly disabled, not hidden"
 * principle the previous per-slot grid used — the UI decides how to render
 * a `remaining <= 0` block.
 */
export async function getHourBlocksForDate(
  dateISO: string,
  now: Date = new Date(),
): Promise<HourBlock[]> {
  const windows = getAvailableSlots({
    dateISO,
    rules: CLINIC_RULES,
    blackouts: [],
    booked: [],
    slotMinutes: HOUR_MINUTES,
    minLeadHours: MIN_LEAD_HOURS,
    now,
  })
  const counts = demoBookedCounts(dateISO, now)
  return windows.map((w) => {
    const { hhmm } = utcToIstParts(w.start)
    const booked = Math.min(counts[hhmm] ?? 0, HOUR_CAPACITY)
    return { start: w.start, end: w.end, capacity: HOUR_CAPACITY, booked, remaining: HOUR_CAPACITY - booked }
  })
}

/** The next `count` Tuesdays (IST calendar dates), paired with total remaining places across all five hours. */
export async function getUpcomingTuesdaysWithCounts(
  count: number = BOOKING_WINDOW_WEEKS,
  now: Date = new Date(),
): Promise<{ dateISO: string; count: number }[]> {
  const dates = nextTuesdays(utcToIstParts(now).dateISO, count)
  return Promise.all(
    dates.map(async (dateISO) => {
      const blocks = await getHourBlocksForDate(dateISO, now)
      return { dateISO, count: blocks.reduce((sum, b) => sum + b.remaining, 0) }
    }),
  )
}
