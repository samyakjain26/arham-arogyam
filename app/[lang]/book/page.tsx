'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { getDictionary, isLang, DEFAULT_LANG, type Lang } from '@/lib/i18n'
import { StepIndicator } from '@/components/book/StepIndicator'
import { DatePicker } from '@/components/book/DatePicker'
import { HourGrid } from '@/components/book/HourGrid'
import {
  DetailsForm, EMPTY_BOOKING_DETAILS, type BookingDetails, type BookingResult,
} from '@/components/book/DetailsForm'
import { Confirmation } from '@/components/book/Confirmation'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'

// The wizard host for all four steps: date, slot, details, confirmation.
type WizardStep = 1 | 2 | 3 | 4

export default function BookPage() {
  const routeParams = useParams<{ lang: string }>()
  const lang: Lang = isLang(routeParams.lang) ? routeParams.lang : DEFAULT_LANG
  const d = getDictionary(lang)

  const [step, setStep] = useState<WizardStep>(1)
  // Kept even after navigating back, so re-advancing doesn't lose earlier answers.
  const [dateISO, setDateISO] = useState<string | null>(null)
  const [blockStart, setBlockStart] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)
  // Lifted out of DetailsForm so a block-full bounce back to step 2 doesn't
  // unmount the form and discard everything the patient already typed.
  const [details, setDetails] = useState<BookingDetails>(EMPTY_BOOKING_DETAILS)
  // True only right after a block-full bounce — shown as a banner on step 2,
  // cleared the moment the patient moves off step 2 in any direction.
  const [blockFullNotice, setBlockFullNotice] = useState(false)

  // Steps 1-3 swap subtrees in place (unlike step 4's Confirmation, which
  // mounts as a whole new component) — each step change unmounts the
  // previous <h1> and mounts a fresh one, so a keyboard/screen-reader user's
  // focus falls back to <body> with no announcement of what changed. Moving
  // focus to the incoming step's own heading is the standard wizard pattern:
  // it both places focus where the new content starts and gets the heading's
  // text announced, which doubles as the step-change announcement. Skipped
  // on the very first render so landing on /book doesn't steal focus from
  // wherever the patient's focus already was (e.g. a skip link, or having
  // just tapped "Book Appointment").
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  return (
    // A linear step-by-step flow reads better in a narrower centered column
    // than the site's full max-w-content (1140px) — that width is right for
    // multi-card marketing grids, but stretched a 2-column date/slot grid
    // into sparse, oversized cards on a laptop screen.
    <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <StepIndicator step={step} d={d} />

      {step === 1 && (
        <Reveal>
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl md:text-4xl">{d.book.pickDate}</h1>
          <DatePicker
            lang={lang}
            d={d}
            onPick={(iso) => { setDateISO(iso); setStep(2); setBlockFullNotice(false) }}
          />
        </Reveal>
      )}

      {step === 2 && dateISO && (
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="md" onClick={() => { setStep(1); setBlockFullNotice(false) }}>
              {d.book.back}
            </Button>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl md:text-4xl">{d.book.pickHour}</h1>
          </div>
          {blockFullNotice && (
            <p
              role="alert"
              className="mt-4 rounded-card border border-hairline bg-saffron-100 p-4 text-lg text-ink"
            >
              {d.errors.slotTaken}
            </p>
          )}
          <HourGrid
            dateISO={dateISO}
            lang={lang}
            d={d}
            onPick={(iso) => { setBlockStart(iso); setStep(3); setBlockFullNotice(false) }}
          />
        </Reveal>
      )}

      {step === 3 && dateISO && blockStart && (
        <Reveal>
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl md:text-4xl">{d.book.detailsTitle}</h1>
          <DetailsForm
            lang={lang}
            d={d}
            dateISO={dateISO}
            blockStartISO={blockStart}
            details={details}
            onDetailsChange={(patch) => setDetails((prev) => ({ ...prev, ...patch }))}
            onBack={() => setStep(2)}
            onBlockFull={() => {
              // The chosen hour filled up between step 2 and submit —
              // return to step 2 with the date preserved (and the notice
              // banner shown there) so the (remounted, freshly fetched)
              // grid reflects current availability. `details` is lifted
              // state, so it's untouched by DetailsForm unmounting —
              // everything typed survives.
              setBlockStart(null)
              setBlockFullNotice(true)
              setStep(2)
            }}
            onBooked={(result) => {
              setBooking(result)
              setStep(4)
            }}
          />
        </Reveal>
      )}

      {step === 4 && booking && (
        <Reveal>
          <Confirmation
            lang={lang}
            d={d}
            bookingCode={booking.bookingCode}
            parchiNumber={booking.parchiNumber}
            blockStart={booking.blockStart}
            blockEnd={booking.blockEnd}
          />
        </Reveal>
      )}
    </main>
  )
}
