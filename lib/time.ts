import type { Lang } from '@/lib/i18n'

/** India observes no DST, so a fixed offset is correct and avoids a tz library. */
const IST_OFFSET_MIN = 330

export function istWallClockToUtc(dateISO: string, hhmm: string): Date {
  const [y, mo, d] = dateISO.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60_000)
}

export function utcToIstParts(d: Date): { dateISO: string; hhmm: string } {
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    dateISO: `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}`,
    hhmm: `${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`,
  }
}

/** 0 = Sunday … 2 = Tuesday. dateISO is already an IST calendar date. */
export function istWeekday(dateISO: string): number {
  const [y, mo, d] = dateISO.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
}

const HI_PERIOD = (h: number) =>
  h < 4 ? 'रात' : h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात'

export function formatIstTime(d: Date, lang: Lang): string {
  const { hhmm } = utcToIstParts(d)
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = String(m).padStart(2, '0')
  return lang === 'hi'
    ? `${HI_PERIOD(h)} ${h12}:${mm}`
    : `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}

/**
 * Formats an IST calendar date — e.g. "Tuesday, 1 September" / "मंगलवार, 1 सितंबर".
 * Takes the dateISO itself (already an IST calendar date, no time-of-day) rather
 * than a UTC instant, so callers holding either a bare dateISO (DatePicker) or a
 * real timestamp (Confirmation, via utcToIstParts(d).dateISO) share one
 * implementation instead of each re-deriving the weekday/day/month formatting.
 */
export function formatIstDateLabel(dateISO: string, lang: Lang): string {
  const [y, mo, d] = dateISO.split('-').map(Number)
  const utcMidnight = new Date(Date.UTC(y, mo - 1, d))
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(utcMidnight)
}

const hourLabel = (d: Date, lang: Lang): string => {
  const { hhmm } = utcToIstParts(d)
  const [h] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  return lang === 'hi' ? `${HI_PERIOD(h)} ${h12}` : `${h12} ${h < 12 ? 'AM' : 'PM'}`
}

/**
 * Formats a one-hour capacity block's span as a range, never a single exact
 * instant — patients pick an hour and may arrive any time within it, so the
 * UI must never look like it promises one specific minute. Deliberately
 * repeats the period word on both sides in Hindi (matches how the clinic's
 * own staff phrase it, e.g. "शाम 5 – शाम 6") rather than collapsing to a
 * single trailing "शाम"; English mirrors the same repeated-suffix shape
 * ("5 PM – 6 PM") for consistency between the two languages.
 */
export function formatIstHourRange(start: Date, end: Date, lang: Lang): string {
  return `${hourLabel(start, lang)} – ${hourLabel(end, lang)}`
}
