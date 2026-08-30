'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { t, type Dictionary, type Lang } from '@/lib/i18n'
import { formatIstHourRange } from '@/lib/time'
import { getHourBlocksForDate, type HourBlock } from '@/lib/mockAvailability'

// Renamed from SlotGrid: the clinic no longer offers individual appointment
// slots, only five one-hour capacity blocks. A block card shows an hour
// RANGE plus how many of its 25 places remain, not a single exact time.
export function HourGrid({ dateISO, lang, d, onPick }: {
  dateISO: string; lang: Lang; d: Dictionary; onPick: (startISO: string) => void
}) {
  const [blocks, setBlocks] = useState<HourBlock[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getHourBlocksForDate(dateISO)
      .then((result) => { if (!cancelled) setBlocks(result) })
      .catch(() => { if (!cancelled) setError(d.errors.network) })
    return () => { cancelled = true }
  }, [dateISO, d.errors.network])

  if (error) return <p role="alert" className="mt-6 text-lg">{error}</p>

  if (!blocks) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  if (blocks.length === 0) return <p className="mt-6 text-lg">{d.book.full}</p>

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {blocks.map((block, i) => {
        const iso = block.start.toISOString()
        const full = block.remaining <= 0
        return (
          <button
            key={iso}
            type="button"
            // Full blocks must stay "visibly disabled, never hidden" — a
            // native `disabled` button is pulled out of the tab order
            // entirely, so a keyboard/screen-reader user can't discover it
            // exists at all. aria-disabled keeps it focusable and announced
            // as unavailable; the click is guarded below instead of relying
            // on the browser to block it (aria-disabled doesn't).
            aria-disabled={full}
            onClick={() => { if (!full) onPick(iso) }}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            className={`flex min-h-[72px] flex-col items-start justify-center gap-1 rounded-card border p-6 text-left
              shadow-card transition-transform duration-150
              animate-[fadeIn_250ms_var(--ease-enter)_both]
              motion-reduce:animate-none motion-reduce:transform-none
              aria-disabled:pointer-events-none
              ${full ? 'border-hairline bg-green-50' : 'border-hairline bg-surface hover:-translate-y-0.5 hover:shadow-lift'}`}
          >
            <span className="block text-lg font-semibold text-ink">
              {formatIstHourRange(block.start, block.end, lang)}
            </span>
            <span className="block text-base text-ink-muted">
              {full ? d.book.blockFull : t(d.book.placesLeft, { n: block.remaining })}
            </span>
          </button>
        )
      })}
    </div>
  )
}
