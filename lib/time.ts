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
