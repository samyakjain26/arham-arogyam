'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { getDictionary, isLang, DEFAULT_LANG, type Lang } from '@/lib/i18n'
import { StepIndicator } from '@/components/book/StepIndicator'
import { DatePicker } from '@/components/book/DatePicker'
import { SlotGrid } from '@/components/book/SlotGrid'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/motion/Reveal'
import { formatIstTime } from '@/lib/time'

// The wizard host for steps 1 (date) and 2 (slot). Steps 3–4 (details form,
// confirmation) are a separate task — this only advances to a clearly
// marked placeholder so the flow doesn't dead-end.
type WizardStep = 1 | 2 | 3

export default function BookPage() {
  const routeParams = useParams<{ lang: string }>()
  const lang: Lang = isLang(routeParams.lang) ? routeParams.lang : DEFAULT_LANG
  const d = getDictionary(lang)

  const [step, setStep] = useState<WizardStep>(1)
  // Kept even after navigating back, so re-advancing doesn't lose earlier answers.
  const [dateISO, setDateISO] = useState<string | null>(null)
  const [slotStart, setSlotStart] = useState<string | null>(null)

  return (
    <main className="mx-auto max-w-content px-6 py-12 md:py-16">
      <StepIndicator step={step} d={d} />

      {step === 1 && (
        <Reveal>
          <h1 className="text-3xl md:text-4xl">{d.book.pickDate}</h1>
          <DatePicker
            lang={lang}
            d={d}
            onPick={(iso) => { setDateISO(iso); setStep(2) }}
          />
        </Reveal>
      )}

      {step === 2 && dateISO && (
        <Reveal>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              {d.book.back}
            </Button>
            <h1 className="text-3xl md:text-4xl">{d.book.pickSlot}</h1>
          </div>
          <SlotGrid
            dateISO={dateISO}
            lang={lang}
            d={d}
            onPick={(iso) => { setSlotStart(iso); setStep(3) }}
          />
        </Reveal>
      )}

      {step === 3 && dateISO && slotStart && (
        <Reveal>
          <Card className="mt-6 flex flex-col items-start gap-4">
            <p className="text-lg text-ink">{d.book.comingSoon}</p>
            <p className="text-base text-ink-muted">{formatIstTime(new Date(slotStart), lang)}</p>
            <Button variant="ghost" size="md" onClick={() => setStep(2)}>
              {d.book.back}
            </Button>
          </Card>
        </Reveal>
      )}
    </main>
  )
}
