import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Dictionary, Lang } from '@/lib/i18n'

// Purely decorative botanical echo of the tree in the logo. A single faint
// leaf silhouette, not a repeating pattern — restraint over clip-art.
function LeafWatermark({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 140"
      className={className}
      fill="none"
    >
      <path
        d="M50 0 C92 22 100 78 50 140 C0 78 8 22 50 0 Z"
        fill="currentColor"
      />
      <path d="M50 14 L50 126" stroke="var(--cream)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Hero({ lang, d }: { lang: Lang; d: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-cream px-6 pt-12 pb-14 text-center md:pt-16 md:pb-20">
      <LeafWatermark
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[300px] -translate-x-1/2 text-green-700 opacity-[0.05] md:h-[520px] md:w-[370px]"
      />

      <div className="relative mx-auto max-w-content">
        {/* Logo: the tri-colour ring, tree and kalash need to be genuinely
            legible at a glance on a cheap Android phone — 140px mobile,
            ~200px desktop, not the 44px header mark. */}
        <div
          className="mx-auto flex h-[140px] w-[140px] items-center justify-center
                     animate-[heroIn_600ms_var(--ease-enter)_both] motion-reduce:animate-none
                     md:h-[200px] md:w-[200px]"
        >
          <Image
            src="/logo.jpg"
            alt=""
            width={400}
            height={400}
            preload
            className="h-full w-full rounded-2xl object-contain shadow-lift"
          />
        </div>

        <div className="mt-7 animate-[wordmarkIn_600ms_var(--ease-enter)_80ms_both] motion-reduce:animate-none">
          {/* The Devanagari wordmark is the single strongest "this is an
              Indian Ayurvedic clinic" signal on the page — it leads on both
              /hi and /en, sized larger than the English name, always set in
              Noto Serif Devanagari regardless of the active locale. */}
          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold text-green-900 [font-family:var(--font-noto-serif-dev)]">
            अर्हम् आरोग्यम्
          </h1>

          <div
            aria-hidden
            className="mx-auto mt-3 h-[3px] w-16 rounded-full bg-[linear-gradient(to_right,var(--magenta-600),var(--gold-500),var(--green-700))]"
          />

          {lang === 'en' && (
            <p className="mt-3 text-2xl font-semibold text-green-800">{d.site.name}</p>
          )}

          <p className="mt-3 text-lg text-ink-muted md:text-xl">{d.site.subtitle}</p>
          <p className="mt-4 text-xl text-ink md:text-2xl">{d.site.tagline}</p>
        </div>

        {/* Tuesday-only timing: the whole point of the clinic's schedule, so
            it gets a large bordered badge above the fold — not a footnote. */}
        <p
          className="mx-auto mt-8 inline-flex max-w-full items-center gap-2 rounded-full
                     border border-green-300 bg-green-50 px-6 py-3 text-xl font-semibold
                     text-green-800 md:text-2xl"
        >
          <ClockIcon />
          {d.hero.timing}
        </p>

        <div className="mt-9">
          <Link href={`/${lang}/book`}>
            <Button variant="primary" size="lg">{d.hero.cta}</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
