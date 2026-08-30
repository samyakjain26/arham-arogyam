'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { LeafBullet } from '@/components/home/ServiceCards'
import { t, type Dictionary, type Lang } from '@/lib/i18n'
import { formatIstDateLabel } from '@/lib/time'
import { getUpcomingTuesdaysWithCounts, BOOKING_WINDOW_WEEKS } from '@/lib/mockAvailability'

type TuesdayOption = { dateISO: string; count: number }

export function DatePicker({ lang, d, onPick }: {
  lang: Lang; d: Dictionary; onPick: (dateISO: string) => void
}) {
  const [dates, setDates] = useState<TuesdayOption[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getUpcomingTuesdaysWithCounts()
      .then((result) => { if (!cancelled) setDates(result) })
      .catch(() => { if (!cancelled) setError(d.errors.network) })
    return () => { cancelled = true }
  }, [d.errors.network])

  if (error) return <p role="alert" className="mt-6 text-lg">{error}</p>

  if (!dates) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: BOOKING_WINDOW_WEEKS }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {dates.map(({ dateISO, count }, i) => {
        const full = count === 0
        return (
          <button
            key={dateISO}
            type="button"
            disabled={full}
            aria-disabled={full}
            onClick={() => onPick(dateISO)}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            className={`flex min-h-[72px] items-center gap-3 rounded-card border p-6 text-left
              shadow-card transition-transform duration-150
              animate-[fadeIn_250ms_var(--ease-enter)_both]
              motion-reduce:animate-none motion-reduce:transform-none
              disabled:pointer-events-none disabled:opacity-45
              ${full ? 'border-hairline bg-green-50' : 'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-lift'}`}
          >
            <LeafBullet />
            <span>
              <span className="block text-lg font-semibold text-ink">
                {formatIstDateLabel(dateISO, lang)}
              </span>
              <span className="block text-base text-ink-muted">
                {full ? d.book.full : t(d.book.placesLeft, { n: count })}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
