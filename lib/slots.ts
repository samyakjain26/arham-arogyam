import { istWallClockToUtc, istWeekday } from '@/lib/time'

export interface Slot { start: Date; end: Date }
export interface AvailabilityRule {
  weekday: number; startTime: string; endTime: string; active: boolean
}
export interface BlackoutRange {
  date: string; startTime: string | null; endTime: string | null
}
export interface BookedRange { start: Date; end: Date }

export interface SlotParams {
  dateISO: string
  rules: AvailabilityRule[]
  blackouts: BlackoutRange[]
  booked: BookedRange[]
  slotMinutes: number
  minLeadHours: number
  now: Date
}

/** Half-open interval overlap: touching endpoints do NOT overlap. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()
}

export function getAvailableSlots(p: SlotParams): Slot[] {
  const weekday = istWeekday(p.dateISO)
  const rules = p.rules.filter((r) => r.active && r.weekday === weekday)
  if (rules.length === 0) return []

  const dayBlackouts = p.blackouts.filter((b) => b.date === p.dateISO)

  // A blackout with no times blocks the whole day outright.
  if (dayBlackouts.some((b) => b.startTime === null || b.endTime === null)) return []

  const blackoutRanges = dayBlackouts.map((b) => ({
    start: istWallClockToUtc(p.dateISO, b.startTime as string),
    end: istWallClockToUtc(p.dateISO, b.endTime as string),
  }))

  const leadCutoff = new Date(p.now.getTime() + p.minLeadHours * 3_600_000)
  const stepMs = p.slotMinutes * 60_000

  const slots: Slot[] = []

  for (const rule of rules) {
    const windowStart = istWallClockToUtc(p.dateISO, rule.startTime)
    const windowEnd = istWallClockToUtc(p.dateISO, rule.endTime)

    for (let t = windowStart.getTime(); t + stepMs <= windowEnd.getTime(); t += stepMs) {
      const start = new Date(t)
      const end = new Date(t + stepMs)

      if (start.getTime() < leadCutoff.getTime()) continue
      if (blackoutRanges.some((b) => overlaps(start, end, b.start, b.end))) continue
      // Overlap, not equality: a booking made under a different slot length
      // can straddle two of today's slots, and both must be withheld.
      if (p.booked.some((b) => overlaps(start, end, b.start, b.end))) continue

      slots.push({ start, end })
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Upcoming clinic days, as IST calendar dates. Includes today if it is a Tuesday. */
export function nextTuesdays(fromISO: string, count: number): string[] {
  const [y, mo, d] = fromISO.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, mo - 1, d))
  const out: string[] = []
  const pad = (n: number) => String(n).padStart(2, '0')

  while (out.length < count) {
    if (cursor.getUTCDay() === 2) {
      out.push(
        `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`)
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}
