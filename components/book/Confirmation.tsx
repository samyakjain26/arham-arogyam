'use client'
import { useEffect, useMemo, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { buttonClasses } from '@/components/ui/Button'
import { buildIcs } from '@/lib/ics'
import { formatIstHourRange, formatIstDateLabel, utcToIstParts } from '@/lib/time'
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

export function Confirmation({
  lang, d, bookingCode, parchiNumber, blockStart, blockEnd,
}: {
  lang: Lang
  d: Dictionary
  bookingCode: string
  parchiNumber: string
  blockStart: Date
  blockEnd: Date
}) {
  // Booking submission is mocked locally (no POST /api/appointments, so no
  // GET .../ics route either) — the .ics is built and served straight from
  // the browser as a downloadable blob. lib/ics.ts's field names are
  // start/end of the calendar event — generic, not slot-specific — so the
  // hour block's start/end pass straight through unchanged; the event now
  // spans the whole hour, not a 15-minute appointment.
  const icsUrl = useMemo(() => {
    const ics = buildIcs({
      bookingCode,
      slotStart: blockStart,
      slotEnd: blockEnd,
      summary: d.site.name,
      location: d.hero.address,
    })
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  }, [bookingCode, blockStart, blockEnd, d.site.name, d.hero.address])

  useEffect(() => () => URL.revokeObjectURL(icsUrl), [icsUrl])

  // Step 4 mounts fresh only when the wizard reaches it, so a mount-only
  // effect is exactly "focus moved to this step" — see book/page.tsx for
  // the equivalent handling of steps 1-3, whose headings remount in place
  // rather than as a whole new component tree.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus() }, [])

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY_ADDRESS)}`

  return (
    <Card className="mt-6 flex flex-col items-center gap-6 py-10 text-center">
      {/* Unmissable: this sits ABOVE the checkmark and heading, so a patient
          cannot reach the "success"-shaped content below without first
          passing this. There is no POST /api/appointments — nothing here
          has been stored anywhere, and the wizard must never let a patient
          leave believing otherwise. role="alert" announces it immediately
          for screen-reader users too. */}
      <div
        role="alert"
        className="w-full rounded-card border-2 border-saffron-700 bg-saffron-100 p-4 text-left"
      >
        <p className="text-lg font-bold text-ink">{d.book.previewTitle}</p>
        <p className="mt-1 text-lg text-ink">{d.book.previewBody}</p>
        <p className="mt-1 text-lg text-ink">{d.book.comingSoon}</p>
      </div>

      <Checkmark />
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl md:text-4xl">
        {d.book.confirmed}
      </h1>

      <div>
        <p className="text-lg text-ink-muted">{d.book.code}</p>
        <p className="mt-1 text-4xl font-bold tracking-[0.2em] text-green-700">{bookingCode}</p>
      </div>

      <div>
        <p className="text-lg text-ink-muted">{d.book.parchiNumber}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{parchiNumber}</p>
      </div>

      {/* An hour RANGE, never a single exact time — the patient may arrive
          any time within it, and the UI must never look like it promises
          one specific minute. */}
      <div>
        <p className="text-xl font-semibold text-ink">
          {formatIstDateLabel(utcToIstParts(blockStart).dateISO, lang)} · {formatIstHourRange(blockStart, blockEnd, lang)}
        </p>
        <p className="mt-1 max-w-prose text-lg text-ink-muted">{d.book.arriveAnytime}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="max-w-prose text-lg text-ink">{d.hero.address}</p>
        {/* Styled directly rather than wrapping a <Button> — nesting
            interactive content inside an <a> is invalid HTML with
            inconsistent assistive-tech exposure (see components/ui/Button.tsx's
            buttonClasses, the single source of these class strings). */}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: 'secondary', size: 'md' })}
        >
          {d.visit.directions}
        </a>
      </div>

      <a
        href={icsUrl}
        download={`arham-arogyam-${bookingCode}.ics`}
        className={buttonClasses({ variant: 'ghost', size: 'md' })}
      >
        {d.book.addCalendar}
      </a>
    </Card>
  )
}
