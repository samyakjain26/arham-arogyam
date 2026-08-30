import { t, type Dictionary } from '@/lib/i18n'

/**
 * Visible on every step of the wizard — non-technical, often-elderly users
 * need a constant answer to "how much is left," not just a one-time cue.
 */
export function StepIndicator({ step, d }: { step: 1 | 2 | 3 | 4; d: Dictionary }) {
  return (
    <div className="mb-6">
      <p className="text-lg font-semibold text-green-700">{t(d.book.step, { n: step })}</p>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-green-50"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={4}
      >
        <div
          className="h-full rounded-full bg-saffron-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
    </div>
  )
}
