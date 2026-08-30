import type { ReactNode } from 'react'
import type { Dictionary } from '@/lib/i18n'
import { Card } from '@/components/ui/Card'
import { Stagger } from '@/components/motion/Stagger'

// Small botanical bullet echoing the logo's tree — a single leaf, not a
// repeating pattern, so it stays a quiet accent rather than clip-art.
// Still used by the standalone /services listing page.
export function LeafBullet() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-green-600" fill="none">
      <path d="M4 20c8-1 14-7 15-16-9 1-15 7-16 16Z" fill="currentColor" />
      <path d="M6 18c4-4 8-8 12-12" stroke="var(--cream)" strokeWidth="1.1" opacity="0.6" />
    </svg>
  )
}

// One small line icon per service, in services.items order (index-matched,
// not dictionary-keyed — same 8-item shape in both hi.json and en.json).
// Same restrained stroke style as Hero's ClockIcon: currentColor, no fill
// photorealism, nothing that reads as clip-art.
const SERVICE_ICONS: ReactNode[] = [
  // General health checkups — vitals line
  <path key="pulse" d="M3 12h4l2-5 4 10 2-5h6" />,
  // Basic health consultation — conversation
  <path key="chat" d="M4 5h16v10H9l-4 4v-4H4Z" strokeLinejoin="round" />,
  // Consultation with the Vaidya — a book of traditional knowledge
  <path
    key="book"
    d="M12 7c-2-1.2-5-1.6-8-.8v12.6c3-.8 6-.4 8 .8 2-1.2 5-1.6 8-.8V6.2c-3-.8-6-.4-8 .8Zm0 0v12.6"
    strokeLinejoin="round"
  />,
  // Health and wellness guidance — sun
  <g key="sun">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 4v2M12 18v2M5 5l1.4 1.4M17.6 17.6L19 19M4 12h2M18 12h2M5 19l1.4-1.4M17.6 6.4 19 5" strokeLinecap="round" />
  </g>,
  // Diet and lifestyle guidance — sprout
  <g key="sprout" strokeLinecap="round">
    <path d="M12 20v-7" />
    <path d="M12 13c0-3.5-2.5-5.5-6-5.5C6 11 8.5 13 12 13Z" fill="currentColor" stroke="none" />
    <path d="M12 10.5c0-2.8 1.9-4.5 5-4.5.4 2.8-1.9 4.5-5 4.5Z" fill="currentColor" stroke="none" />
  </g>,
  // Basic Ayurvedic guidance — mortar and pestle
  <g key="mortar" strokeLinecap="round">
    <path d="M5 13a7 7 0 0 0 14 0" />
    <path d="M3.5 13h17" />
    <path d="M9 9.5 15 4" />
  </g>,
  // Guidance on common health concerns — shield
  <path key="shield" d="M12 3.5 19 6v6c0 5-3 7.7-7 8.5-4-.8-7-3.5-7-8.5V6Z" strokeLinejoin="round" />,
  // Preventive health advice — checked shield
  <g key="shield-check" strokeLinejoin="round">
    <path d="M12 3.5 19 6v6c0 5-3 7.7-7 8.5-4-.8-7-3.5-7-8.5V6Z" />
    <path d="M9 12.2 11 14.2 15.5 9.8" strokeLinecap="round" />
  </g>,
]

function ServiceIcon({ index }: { index: number }) {
  const glyph = SERVICE_ICONS[index % SERVICE_ICONS.length]
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      {glyph}
    </svg>
  )
}

export function ServiceCards({ d }: { d: Dictionary }) {
  return (
    <section className="mx-auto max-w-content px-6 py-10 md:py-14">
      <h2 className="text-center text-3xl md:text-4xl">{d.services.title}</h2>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stagger>
          {d.services.items.map((item, i) => (
            <Card key={item} className="relative flex h-full flex-col items-center gap-3 text-center">
              {/* Decorative index — a quiet editorial flourish, not a
                  numbered-list semantic (order isn't meaningful here), so
                  it's aria-hidden and never the only cue: the icon and
                  text both stand on their own. */}
              <span aria-hidden className="absolute top-4 right-5 text-lg font-semibold tracking-wide text-green-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
                <ServiceIcon index={i} />
              </span>
              <p className="text-lg text-ink">{item}</p>
            </Card>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
