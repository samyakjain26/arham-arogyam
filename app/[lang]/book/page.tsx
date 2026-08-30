'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { getDictionary, isLang, DEFAULT_LANG, type Lang } from '@/lib/i18n'
import { StepIndicator } from '@/components/book/StepIndicator'
import { DatePicker } from '@/components/book/DatePicker'
import { SlotGrid } from '@/components/book/SlotGrid'
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
  const [slotStart, setSlotStart] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)
  // Lifted out of DetailsForm so a slot-taken bounce back to step 2 doesn't
  // unmount the form and discard everything the patient already typed.
  const [details, setDetails] = useState<BookingDetails>(EMPTY_BOOKING_DETAILS)
  // True only right after a slot-taken bounce — shown as a banner on step 2,
  // cleared the moment the patient moves off step 2 in any direction.
  const [slotTakenNotice, setSlotTakenNotice] = useState(false)

  return (
    // A linear step-by-step flow reads better in a narrower centered column
    // than the site's full max-w-content (1140px) — that width is right for
    // multi-card marketing grids, but stretched a 2-column date/slot grid
    // into sparse, oversized cards on a laptop screen.
    <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <StepIndicator step={step} d={d} />

      {step === 1 && (
        <Reveal>
          <h1 className="text-3xl md:text-4xl">{d.book.pickDate}</h1>
          <DatePicker
            lang={lang}
            d={d}
            onPick={(iso) => { setDateISO(iso); setStep(2); setSlotTakenNotice(false) }}
          />
        </Reveal>
      )}

      {step === 2 && dateISO && (
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="md" onClick={() => { setStep(1); setSlotTakenNotice(false) }}>
              {d.book.back}
            </Button>
            <h1 className="text-3xl md:text-4xl">{d.book.pickSlot}</h1>
          </div>
          {slotTakenNotice && (
            <p
              role="alert"
              className="mt-4 rounded-card border border-hairline bg-saffron-100 p-4 text-lg text-ink"
            >
              {d.errors.slotTaken}
            </p>
          )}
          <SlotGrid
            dateISO={dateISO}
            lang={lang}
            d={d}
            onPick={(iso) => { setSlotStart(iso); setStep(3); setSlotTakenNotice(false) }}
          />
        </Reveal>
      )}

      {step === 3 && dateISO && slotStart && (
        <Reveal>
          <h1 className="text-3xl md:text-4xl">{d.book.detailsTitle}</h1>
          <DetailsForm
            lang={lang}
            d={d}
            dateISO={dateISO}
            slotStartISO={slotStart}
            details={details}
            onDetailsChange={(patch) => setDetails((prev) => ({ ...prev, ...patch }))}
            onBack={() => setStep(2)}
            onSlotTaken={() => {
              // Slot was taken between step 2 and submit — return to step 2
              // with the date preserved (and the notice banner shown there)
              // so the (remounted, freshly fetched) grid reflects current
              // availability. `details` is lifted state, so it's untouched
              // by DetailsForm unmounting — everything typed survives.
              setSlotStart(null)
              setSlotTakenNotice(true)
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
            slotStart={booking.slotStart}
            slotEnd={booking.slotEnd}
          />
        </Reveal>
      )}
    </main>
  )
}
