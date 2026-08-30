'use client'
import { useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { buildIcs } from '@/lib/ics'
import { formatIstTime } from '@/lib/time'
import type { Dictionary, Lang } from '@/lib/i18n'

// Canonical English form of the address, used only to build the maps query
// — matches components/home/VisitUs.tsx's MAPS_QUERY_ADDRESS verbatim, kept
// stable across locales because a plain-English street query geocodes more
// reliably than a transliterated Hindi one. The address shown to the
// patient is still the localized d.hero.address.
const MAPS_QUERY_ADDRESS = 'C-39, Jyoti Marg, Bapu Nagar, Jaipur'

/**
 * The single deliberate moment of delight on the site: a checkmark that
 * draws itself in 400ms via stroke-dashoffset. app/globals.css's
 * prefers-reduced-motion block already forces every animation-duration to
 * ~0 globally, so this settles instantly to its finished (drawn) state
 * under reduced motion rather than animating — belt-and-suspenders classes
 * below make that explicit for this element too.
 */
function Checkmark() {
  return (
    <svg viewBox="0 0 52 52" className="mx-auto h-20 w-20" aria-hidden>
      <circle cx="26" cy="26" r="24" fill="none" stroke="var(--green-300)" strokeWidth="2" />
      <path
        d="M14 27l8 8 16-16"
        fill="none"
        stroke="var(--green-700)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 48,
          strokeDashoffset: 48,
          animation: 'drawCheck 400ms var(--ease-enter) 120ms forwards',
        }}
        className="motion-reduce:![stroke-dashoffset:0] motion-reduce:animate-none"
      />
    </svg>
  )
}

/** dateISO is derived from slotStart's IST calendar date, formatted as a UTC-midnight instant. */
function formatIstDateLabel(date: Date, lang: Lang): string {
  const IST_OFFSET_MIN = 330
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60_000)
  const utcMidnight = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()))
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(utcMidnight)
}

export function Confirmation({
  lang, d, bookingCode, slotStart, slotEnd,
}: {
  lang: Lang
  d: Dictionary
  bookingCode: string
  slotStart: Date
  slotEnd: Date
}) {
  // Booking submission is mocked locally (no POST /api/appointments, so no
  // GET .../ics route either) — the .ics is built and served straight from
  // the browser as a downloadable blob.
  const icsUrl = useMemo(() => {
    const ics = buildIcs({
      bookingCode,
      slotStart,
      slotEnd,
      summary: d.site.name,
      location: d.hero.address,
    })
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  }, [bookingCode, slotStart, slotEnd, d.site.name, d.hero.address])

  useEffect(() => () => URL.revokeObjectURL(icsUrl), [icsUrl])

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY_ADDRESS)}`

  return (
    <Card className="mt-6 flex flex-col items-center gap-6 py-10 text-center">
      <Checkmark />
      <h1 className="text-3xl md:text-4xl">{d.book.confirmed}</h1>

      <div>
        <p className="text-lg text-ink-muted">{d.book.code}</p>
        <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-green-700">{bookingCode}</p>
      </div>

      <p className="text-xl font-semibold text-ink">
        {formatIstDateLabel(slotStart, lang)} · {formatIstTime(slotStart, lang)}
      </p>

      <div className="flex flex-col items-center gap-3">
        <p className="max-w-prose text-lg text-ink">{d.hero.address}</p>
        <a href={mapsHref} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="md">{d.visit.directions}</Button>
        </a>
      </div>

      <a href={icsUrl} download={`arham-arogyam-${bookingCode}.ics`}>
        <Button variant="ghost" size="md">{d.book.addCalendar}</Button>
      </a>
    </Card>
  )
}
