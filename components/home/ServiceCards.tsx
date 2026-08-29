import type { Dictionary } from '@/lib/i18n'
import { Card } from '@/components/ui/Card'
import { Stagger } from '@/components/motion/Stagger'

// Small botanical bullet echoing the logo's tree — a single leaf, not a
// repeating pattern, so it stays a quiet accent rather than clip-art.
function LeafBullet() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-green-600" fill="none">
      <path d="M4 20c8-1 14-7 15-16-9 1-15 7-16 16Z" fill="currentColor" />
      <path d="M6 18c4-4 8-8 12-12" stroke="var(--cream)" strokeWidth="1.1" opacity="0.6" />
    </svg>
  )
}

export function ServiceCards({ d }: { d: Dictionary }) {
  return (
    <section className="mx-auto max-w-content px-6 py-10 md:py-14">
      <h2 className="text-center text-3xl md:text-4xl">{d.services.title}</h2>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stagger>
          {d.services.items.map((item) => (
            <Card key={item} className="flex h-full flex-col items-center gap-3 text-center">
              <LeafBullet />
              <p className="text-lg text-ink">{item}</p>
            </Card>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
