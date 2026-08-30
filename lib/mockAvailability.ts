import {
  getAvailableSlots, nextTuesdays,
  type AvailabilityRule, type BookedRange,
} from '@/lib/slots'
import { istWallClockToUtc, utcToIstParts } from '@/lib/time'

/**
 * Stands in for `GET /api/availability?date=...`, which does not exist yet
 * in this frontend-only phase (no database, no backend). Mirrors the
 * clinic's real configuration below and runs it through the REAL slot
 * engine (lib/slots.ts) so the booking wizard is exercised against genuine
 * scheduling output, not fabricated data. When the real API lands, replace
 * the bodies of the two exported functions with fetch calls — every caller
 * already awaits a Promise, so nothing else in the wizard changes.
 */
const CLINIC_RULES: AvailabilityRule[] = [
  { weekday: 2, startTime: '17:00', endTime: '22:00', active: true },
]
const SLOT_MINUTES = 15
const MIN_LEAD_HOURS = 2

/** Default size of the date-picker's rolling window (step 1). */
export const BOOKING_WINDOW_WEEKS = 4

export interface SlotWithStatus {
  start: Date
  end: Date
  available: boolean
}

/**
 * Small in-memory "already booked" list, pinned to the first upcoming
 * Tuesday (relative to `now`) purely so the slot grid has real, demonstrable
 * unavailable slots to render — there is no database in this phase.
 */
function demoBookedRanges(dateISO: string, now: Date): BookedRange[] {
  const [firstTuesday] = nextTuesdays(utcToIstParts(now).dateISO, 1)
  if (dateISO !== firstTuesday) return []
  return [
    { start: istWallClockToUtc(dateISO, '17:00'), end: istWallClockToUtc(dateISO, '17:30') },
    { start: istWallClockToUtc(dateISO, '18:30'), end: istWallClockToUtc(dateISO, '18:45') },
    { start: istWallClockToUtc(dateISO, '20:15'), end: istWallClockToUtc(dateISO, '20:30') },
  ]
}

/**
 * Every slot in the clinic's window for `dateISO` that isn't excluded by the
 * weekday/blackout/lead-time rules, each flagged `available: false` if it's
 * already booked — so the UI can render taken slots as visibly disabled
 * rather than silently dropping them. Runs `getAvailableSlots` twice (once
 * against the demo bookings, once against none) rather than reinventing
 * slot generation.
 */
export async function getSlotsForDate(
  dateISO: string,
  now: Date = new Date(),
): Promise<SlotWithStatus[]> {
  const base = {
    dateISO,
    rules: CLINIC_RULES,
    blackouts: [],
    slotMinutes: SLOT_MINUTES,
    minLeadHours: MIN_LEAD_HOURS,
    now,
  }
  const all = getAvailableSlots({ ...base, booked: [] })
  const available = getAvailableSlots({ ...base, booked: demoBookedRanges(dateISO, now) })
  const availableStarts = new Set(available.map((s) => s.start.getTime()))
  return all.map((s) => ({ ...s, available: availableStarts.has(s.start.getTime()) }))
}

/** The next `count` Tuesdays (IST calendar dates), paired with how many slots are still bookable. */
export async function getUpcomingTuesdaysWithCounts(
  count: number = BOOKING_WINDOW_WEEKS,
  now: Date = new Date(),
): Promise<{ dateISO: string; count: number }[]> {
  const dates = nextTuesdays(utcToIstParts(now).dateISO, count)
  return Promise.all(
    dates.map(async (dateISO) => {
      const slots = await getSlotsForDate(dateISO, now)
      return { dateISO, count: slots.filter((s) => s.available).length }
    }),
  )
}
