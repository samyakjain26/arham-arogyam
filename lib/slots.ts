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
  // slotMinutes drives the loop increment below. A non-positive or non-finite
  // value (0 from a bad admin config, a stray NaN/Infinity) would either never
  // advance `t` or never satisfy the loop's exit condition, hanging the process
  // forever. Fail loudly and immediately rather than returning an empty array,
  // which would be indistinguishable from "no availability today" and hide a
  // misconfiguration behind a silent, confusing bug.
  if (!Number.isFinite(p.slotMinutes) || p.slotMinutes <= 0) {
    throw new RangeError(`slotMinutes must be a positive finite number, got ${p.slotMinutes}`)
  }
  // minLeadHours can't hang the loop (it only shifts the lead-time cutoff), but
  // a NaN/Infinity value makes every comparison against leadCutoff silently
  // false, which disables the minimum-lead-time safety check entirely without
  // any signal. Fail loudly here too, for the same "don't hide a misconfig"
  // reason as above. Zero is a legitimate "no minimum lead time" setting.
  if (!Number.isFinite(p.minLeadHours) || p.minLeadHours < 0) {
    throw new RangeError(`minLeadHours must be a non-negative finite number, got ${p.minLeadHours}`)
  }

  const weekday = istWeekday(p.dateISO)
  const rules = p.rules.filter((r) => r.active && r.weekday === weekday)
  if (rules.length === 0) return []

  const dayBlackouts = p.blackouts.filter((b) => b.date === p.dateISO)

  // A blackout with no times blocks the whole day outright. A blackout with
  // only ONE of startTime/endTime set is ambiguous input (ill-formed data,
  // not a valid partial range) — deliberately fail safe by treating it the
  // same as a whole-day blackout rather than guessing which half was meant.
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

  // Two active rules for the same weekday can have overlapping windows (e.g.
  // while an admin is mid-edit), which would otherwise emit the same or an
  // overlapping slot twice — two patients could be offered the identical
  // time. Sort by start, then keep only slots that don't overlap one already
  // kept; since input is sorted ascending, the earliest-starting slot in any
  // overlapping cluster is always the one kept. Ordinary back-to-back slots
  // within a single rule only touch endpoints (half-open intervals), so they
  // never overlap each other and are never dropped by this pass.
  const sorted = slots.sort((a, b) => a.start.getTime() - b.start.getTime())
  const deduped: Slot[] = []
  for (const s of sorted) {
    if (deduped.some((kept) => overlaps(s.start, s.end, kept.start, kept.end))) continue
    deduped.push(s)
  }
  return deduped
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
