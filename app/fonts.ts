import { Fraunces, Inter, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from 'next/font/google'

// --- Task F9 perf pass -----------------------------------------------------
// This app has one shared dynamic layout (app/[lang]/layout.tsx) for both
// locales, so `next/font/google`'s preload analysis is per-*file*, not
// per-render: every font called here gets a <link rel=preload> on *every*
// route this layout serves, regardless of which locale branch actually
// applies its .variable class at runtime (verified by inspecting the built
// hi.html/en.html — identical preload sets either way). A true per-locale
// split would need separate route trees (app/en/…, app/hi/…), which is a
// much bigger restructure than this pass — see the task report.
//
// Given that constraint, the two real levers are:
//   1. `subsets`: which glyph ranges exist at all (Noto Serif Devanagari
//      never renders a Latin character on either locale, so its 'latin'
//      subset is pure waste — dropped).
//   2. `preload`: whether a font is *force*-fetched via <link rel=preload>
//      regardless of whether the current page ever uses it. Fraunces/Inter
//      are Latin-only design elements only /en's CSS resolves to; Noto Sans
//      Devanagari is only /hi's. Turning preload off for those three means
//      the browser never fetches the one a given locale's CSS doesn't
//      reference (no @font-face gets matched, so no fetch — see
//      app/globals.css's fallback chains, which are written so neither
//      locale's *winning* declaration ever names an unused family).
//      Noto Serif Devanagari stays preloaded (default): it's needed on
//      both locales immediately, for the hero's अर्हम् आरोग्यम् wordmark,
//      which is the LCP candidate on both.
export const fraunces = Fraunces({
  subsets: ['latin'], weight: ['600'], variable: '--font-fraunces', display: 'swap', preload: false,
})
export const inter = Inter({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap', preload: false,
})
export const notoSansDev = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'], weight: ['400', '500', '600'], variable: '--font-noto-sans-dev', display: 'swap', preload: false,
})
// 'latin' subset dropped: this face is only ever selected for pure-Devanagari
// text (the hardcoded अर्हम् आरोग्यम् wordmark and वैद्य initial, plus Hindi
// h1/h2/h3 headings) — no heading or hardcoded string here ever embeds a
// Latin character, so the Latin chunk would only add preload weight, never
// actually render anything.
export const notoSerifDev = Noto_Serif_Devanagari({
  subsets: ['devanagari'], weight: ['600', '700'], variable: '--font-noto-serif-dev', display: 'swap',
})
