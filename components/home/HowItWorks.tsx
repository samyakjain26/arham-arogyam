import type { Dictionary } from '@/lib/i18n'

export function HowItWorks({ d }: { d: Dictionary }) {
  const steps = [d.how.step1, d.how.step2, d.how.step3]

  return (
    <section className="bg-green-50 py-12 md:py-16">
      <div className="mx-auto max-w-content px-6">
        <h2 className="text-center text-3xl md:text-4xl">{d.how.title}</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-xl font-bold text-white">
                {i + 1}
              </span>
              <p className="text-lg text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
