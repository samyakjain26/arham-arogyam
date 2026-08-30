'use client'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { t, type Dictionary, type Lang } from '@/lib/i18n'
import { formatIstTime } from '@/lib/time'
import { getSlotsForDate } from '@/lib/mockAvailability'

// Unambiguous alphabet — no O/0, I/1, L — patients read these aloud over
// the phone. Matches lib/bookingCode.ts's alphabet/length, but this file is
// NOT imported: that one uses node:crypto and is server-only by design.
// There is no POST /api/appointments yet, so the code is generated here,
// client-side, with Web Crypto.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

/**
 * crypto.getRandomValues() bytes are uniform over 0-255, but 256 isn't a
 * multiple of 31 (the alphabet length) — reducing mod 31 would make the
 * first 8 letters ~3% more likely than the rest. Rejection sampling instead:
 * the largest multiple of 31 that fits in a byte is 248, so bytes >= 248 are
 * discarded and redrawn, and every kept byte maps onto the alphabet exactly
 * uniformly.
 */
function generateBookingCode(): string {
  const limit = 256 - (256 % CODE_ALPHABET.length)
  const buf = new Uint8Array(1)
  let code = ''
  while (code.length < CODE_LENGTH) {
    crypto.getRandomValues(buf)
    if (buf[0] >= limit) continue
    code += CODE_ALPHABET[buf[0] % CODE_ALPHABET.length]
  }
  return code
}

export interface BookingResult {
  bookingCode: string
  slotStart: Date
  slotEnd: Date
}

const INPUT_CLASS =
  'min-h-[48px] w-full rounded-input border-2 border-hairline bg-white px-4 text-lg text-ink ' +
  'focus:border-green-700'

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-lg font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  )
}

export function DetailsForm({
  lang, d, dateISO, slotStartISO, onBack, onSlotTaken, onBooked,
}: {
  lang: Lang
  d: Dictionary
  dateISO: string
  slotStartISO: string
  onBack: () => void
  onSlotTaken: () => void
  onBooked: (result: BookingResult) => void
}) {
  const idPrefix = useId()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const slotStart = new Date(slotStartISO)
  const time = formatIstTime(slotStart, lang)

  function validate(): string | null {
    if (!name.trim()) return d.errors.nameRequired
    const ageNum = Number(age)
    if (!age.trim() || !Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120) {
      return d.errors.ageInvalid
    }
    if (!gender) return d.errors.genderRequired
    if (!/^\d{10}$/.test(phone)) return d.errors.phoneInvalid
    if (!reason.trim()) return d.errors.reasonRequired
    if (!consent) return d.errors.consentRequired
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      // Booking submission is mocked locally — there is no POST
      // /api/appointments yet. Re-check the slot against the same source of
      // truth SlotGrid rendered from; it may have been taken between step 2
      // and now (e.g. from another tab or device).
      const slots = await getSlotsForDate(dateISO)
      const slot = slots.find((s) => s.start.toISOString() === slotStartISO)
      if (!slot || !slot.available) {
        onSlotTaken()
        return
      }
      onBooked({ bookingCode: generateBookingCode(), slotStart: slot.start, slotEnd: slot.end })
    } catch {
      setError(d.errors.network)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
      {/* Block 1 of 2 — at most four fields per block. */}
      <Card className="flex flex-col gap-5">
        <Field label={d.book.name} htmlFor={`${idPrefix}-name`}>
          <input
            id={`${idPrefix}-name`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={d.book.age} htmlFor={`${idPrefix}-age`}>
          <input
            id={`${idPrefix}-age`}
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={d.book.gender} htmlFor={`${idPrefix}-gender`}>
          <select
            id={`${idPrefix}-gender`}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">{d.book.selectPlaceholder}</option>
            <option value="female">{d.book.genderFemale}</option>
            <option value="male">{d.book.genderMale}</option>
            <option value="other">{d.book.genderOther}</option>
          </select>
        </Field>
        <Field label={d.book.phone} htmlFor={`${idPrefix}-phone`}>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={INPUT_CLASS}
          />
        </Field>
      </Card>

      {/* Block 2 of 2 — reason plus consent, well under the four-field cap. */}
      <Card className="flex flex-col gap-5">
        <Field label={d.book.reason} htmlFor={`${idPrefix}-reason`}>
          <textarea
            id={`${idPrefix}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className={`${INPUT_CLASS} h-auto py-3`}
          />
        </Field>

        {/* DPDP requires explicit consent — unchecked by default, never pre-ticked. */}
        <label className="flex min-h-[48px] items-center gap-3 text-lg text-ink">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="h-6 w-6 shrink-0 accent-green-700"
          />
          {d.book.consent}
        </label>
      </Card>

      {error && (
        <p role="alert" className="text-lg text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" variant="ghost" size="md" onClick={onBack}>
          {d.book.back}
        </Button>
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {t(d.book.confirmCta, { time })}
        </Button>
      </div>
    </form>
  )
}
