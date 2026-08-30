'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatIstTime } from '@/lib/time'
import type { Dictionary, Lang } from '@/lib/i18n'
import { getSlotsForDate, type SlotWithStatus } from '@/lib/mockAvailability'

export function SlotGrid({ dateISO, lang, d, onPick }: {
  dateISO: string; lang: Lang; d: Dictionary; onPick: (startISO: string) => void
}) {
  const [slots, setSlots] = useState<SlotWithStatus[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSlotsForDate(dateISO)
      .then((result) => { if (!cancelled) setSlots(result) })
      .catch(() => { if (!cancelled) setError(d.errors.network) })
    return () => { cancelled = true }
  }, [dateISO, d.errors.network])

  if (error) return <p role="alert" className="mt-6 text-lg">{error}</p>

  if (!slots) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    )
  }

  if (slots.length === 0) return <p className="mt-6 text-lg">{d.book.full}</p>

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {slots.map((slot, i) => {
        const iso = slot.start.toISOString()
        return (
          <button
            key={iso}
            type="button"
            disabled={!slot.available}
            aria-disabled={!slot.available}
            onClick={() => onPick(iso)}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            className="min-h-[56px] rounded-btn border-2 border-green-700 bg-white
                       text-lg font-semibold text-green-700
                       animate-[fadeIn_250ms_var(--ease-enter)_both]
                       motion-reduce:animate-none motion-reduce:transform-none
                       transition-transform duration-150 active:scale-[0.97]
                       disabled:pointer-events-none disabled:border-hairline
                       disabled:bg-green-50 disabled:text-ink-muted"
          >
            {formatIstTime(slot.start, lang)}
          </button>
        )
      })}
    </div>
  )
}
