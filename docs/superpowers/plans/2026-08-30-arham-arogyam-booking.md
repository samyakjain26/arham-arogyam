# Arham Arogyam Booking Platform — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (Hindi/English) website for Arham Arogyam clinic in Bapu Nagar, Jaipur, with Tuesday appointment booking and a phone-first admin portal, running entirely on free tiers.

**Architecture:** A single Next.js 15 App Router application serves the public site, the booking flow, the admin portal, and the API. Prisma talks to Supabase Postgres. Slot availability is computed by a pure, exhaustively tested function; double-booking is prevented by a Postgres exclusion constraint rather than application logic. Patients authenticate with Google; admins are rows with `role = 'admin'`.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · Supabase Postgres + Auth · Resend · Cloudflare Turnstile · Sentry · Vitest · Playwright · Netlify

**Spec:** `docs/superpowers/specs/2026-08-30-arham-arogyam-booking-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Personal GitHub only.** Nothing touches the SolFoundry organisation — not the repo, not CI, not credentials, not the git commit identity. Repo-local `user.email` is already set to `samyakjain26@users.noreply.github.com`; never override it with `samyak.jain@solfoundry.co`.
- **Free tiers only.** No paid service without explicit clinic approval.
- **No vendor-specific features.** No Supabase Edge Functions, no Supabase Realtime, no Netlify-proprietary APIs. Plain Postgres, plain Prisma, standard Next.js — so the whole stack can move hosts in an afternoon.
- **Timezone:** all timestamps `TIMESTAMPTZ` in UTC, rendered `Asia/Kolkata`. IST is a fixed UTC+5:30; never rely on server locale.
- **Hindi is the default language.** `/` redirects to `/hi`. Every user-visible string exists in both `dictionaries/hi.json` and `dictionaries/en.json`, including errors, validation, email bodies, and ARIA labels.
- **Body text is 18px minimum, never below 16px.** Tap targets ≥ 48×48px. Contrast ≥ 4.5:1.
- **Saffron `#E8871E` is used as a button fill with white text only** — never as text on cream (it fails contrast).
- **Colour ratio 60% cream / 25% green / 10% saffron / 5% magenta.** The full tri-colour logo ring appears exactly once per page, in the logo.
- **All motion respects `prefers-reduced-motion: reduce`** — transforms and scroll-driven motion disabled, opacity fades only.
- **No medical records.** Booking data only: name, phone, age, gender, reason for visit, email.
- **Performance budget:** LCP < 2.5s on Slow 4G · CLS < 0.05 · INP < 200ms · initial JS < 150KB gzipped · any page < 300KB.
- **`NEXT_PUBLIC_SITE_URL` is the only place the origin appears.** All internal links relative. `NEXT_PUBLIC_ALLOW_INDEXING=false` until the real domain is live.
- **Commit after every task.** Conventional commit messages.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/[lang]/layout.tsx` | Root shell: fonts, header, bottom nav, footer, dictionary provider |
| `app/[lang]/page.tsx` | Home |
| `app/[lang]/{about,services,ayurveda,contact,privacy,terms}/page.tsx` | Static content pages |
| `app/[lang]/book/page.tsx` | Booking wizard host (steps 1–4) |
| `app/[lang]/my-appointments/page.tsx` | Patient's own bookings |
| `app/admin/**` | Admin portal |
| `app/api/**/route.ts` | All mutations; explicit handlers, never server actions |
| `lib/slots.ts` | **Pure** slot engine. No I/O. Most-tested file in the project |
| `lib/time.ts` | IST ↔ UTC conversion helpers. Pure |
| `lib/db.ts` | Prisma singleton |
| `lib/auth.ts` | Session lookup, `requireUser`, `requireAdmin` |
| `lib/errors.ts` | `isOverlapViolation`, typed API error shapes |
| `lib/email.ts` | Resend templates + `.ics` generation |
| `lib/ratelimit.ts` | In-memory + DB-backed rate limiter |
| `lib/i18n.ts` | Dictionary loading, `getDictionary(lang)` |
| `dictionaries/{hi,en}.json` | Every user-visible string |
| `components/ui/*` | Button, Card, Input, Toast, Skeleton — design system primitives |
| `components/motion/*` | `Reveal`, `Stagger` — the only motion abstractions |
| `prisma/schema.prisma` | Data model |
| `prisma/migrations/*` | Includes the hand-written exclusion-constraint migration |
| `tests/slots.test.ts` | Slot engine unit tests |
| `tests/concurrency.test.ts` | Real-Postgres double-booking proof |
| `tests/e2e/*.spec.ts` | Playwright flows |

---

## Task 1: Project scaffold and live deploy pipeline

Deploy pipeline before any feature. A working URL on day one is what saves this project.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `netlify.toml`, `app/layout.tsx`, `app/page.tsx`, `.env.example`, `.nvmrc`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a deployed Next.js app at `https://<site>.netlify.app`; `npm run dev`, `npm run build`, `npm run test` all work

- [ ] **Step 1: Scaffold the app**

```bash
cd /Users/samyakjain/Documents/arham-arogyam
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*" --no-turbopack
```

Answer "yes" to overwriting only `.gitignore`. Keep the existing `docs/`.

- [ ] **Step 2: Pin the Node version**

```bash
echo "22" > .nvmrc
```

Add to `package.json`:

```json
"engines": { "node": ">=22 <23" }
```

Pinning matters: an unpinned project stops building after 18 months when the host bumps its default Node.

- [ ] **Step 3: Add the Netlify config**

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 4: Install test tooling**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @playwright/test
npx playwright install chromium
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

Add scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 5: Write a smoke test**

Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Verify the toolchain**

Run: `npm run test`
Expected: PASS, 1 test.

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 7: Create the env template**

Create `.env.example`:

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ALLOW_INDEXING=false
```

Confirm `.gitignore` contains `.env` and `.env.local`.

- [ ] **Step 8: Push to personal GitHub and connect Netlify**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Netlify deploy config"
```

Then, manually:
1. Create a **private** repo `arham-arogyam` under the **personal** GitHub account — not SolFoundry.
2. `git remote add origin git@github.com:<personal-username>/arham-arogyam.git && git push -u origin main`
3. In Netlify: New site → import from GitHub → select the repo → deploy.
4. Set `NEXT_PUBLIC_SITE_URL` to the assigned `*.netlify.app` URL in Netlify's environment variables.

- [ ] **Step 9: Verify the deploy**

Open the `*.netlify.app` URL. Expected: the default Next.js page over HTTPS.

Verify the commit identity did not leak:

Run: `git log -1 --format='%ae'`
Expected: `samyakjain26@users.noreply.github.com`

---

## Task 2: Design tokens, typography, and UI primitives

**Files:**
- Create: `app/globals.css` (replace), `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Skeleton.tsx`, `tests/tokens.test.ts`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Produces: CSS custom properties `--green-*`, `--saffron-*`, `--magenta-*`, `--cream`, `--ink`, `--ink-muted`, `--border`; `<Button variant="primary"|"secondary"|"ghost" size="lg"|"md">`; `<Card>`; `<Skeleton className>`

- [ ] **Step 1: Write the token contract test**

Create `tests/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('app/globals.css', 'utf8')

const REQUIRED_TOKENS = [
  '--green-900: #14401A',
  '--green-700: #1B5E20',
  '--green-500: #2E7D32',
  '--green-300: #66BB6A',
  '--green-50: #EDF5EE',
  '--saffron-600: #C96A10',
  '--saffron-500: #E8871E',
  '--saffron-100: #FDF0DC',
  '--magenta-600: #D81B60',
  '--magenta-50: #FCE4EC',
  '--gold-500: #F2C230',
  '--cream: #FFFCF5',
  '--surface: #FFFFFF',
  '--ink: #1C1917',
  '--ink-muted: #57534E',
  '--border: #E7E2D8',
]

describe('design tokens', () => {
  it.each(REQUIRED_TOKENS)('defines %s', (token) => {
    expect(css).toContain(token)
  })

  it('honours prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('sets an 18px body floor', () => {
    expect(css).toMatch(/font-size:\s*18px/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test -- tests/tokens.test.ts`
Expected: FAIL — tokens not found in `globals.css`.

- [ ] **Step 3: Write the stylesheet**

Replace `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Serif+Devanagari:wght@600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --green-900: #14401A;
  --green-700: #1B5E20;
  --green-500: #2E7D32;
  --green-300: #66BB6A;
  --green-50: #EDF5EE;

  --saffron-600: #C96A10;
  --saffron-500: #E8871E;
  --saffron-100: #FDF0DC;

  --magenta-600: #D81B60;
  --magenta-50: #FCE4EC;

  --gold-500: #F2C230;

  --cream: #FFFCF5;
  --surface: #FFFFFF;
  --ink: #1C1917;
  --ink-muted: #57534E;
  --border: #E7E2D8;

  --shadow-card: 0 4px 20px rgba(20, 64, 26, 0.08);
  --shadow-lift: 0 8px 28px rgba(20, 64, 26, 0.14);

  --ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}

html { scroll-behavior: smooth; }

body {
  background: var(--cream);
  color: var(--ink);
  font-size: 18px;
  line-height: 1.6;
  font-family: 'Inter', 'Noto Sans Devanagari', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

:lang(hi) body, [lang='hi'] {
  font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif;
  line-height: 1.7;
}

h1, h2, h3 {
  font-family: 'Fraunces', 'Noto Serif Devanagari', Georgia, serif;
  color: var(--green-900);
  line-height: 1.2;
}

[lang='hi'] h1, [lang='hi'] h2, [lang='hi'] h3 {
  font-family: 'Noto Serif Devanagari', 'Fraunces', Georgia, serif;
}

:focus-visible {
  outline: 3px solid var(--saffron-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Scroll-reveal: content is never display:none, so a JS failure
   still leaves the page fully readable. */
.reveal { opacity: 0.001; transform: translateY(16px); }
.reveal.is-visible {
  opacity: 1;
  transform: none;
  transition: opacity 400ms var(--ease-enter), transform 400ms var(--ease-enter);
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

Add to the very end of `app/layout.tsx`'s `<head>` a `<noscript>` fallback so reveals never hide content:

```tsx
<noscript>
  <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
</noscript>
```

- [ ] **Step 4: Map tokens into Tailwind**

Replace the `theme.extend` block in `tailwind.config.ts`:

```ts
extend: {
  colors: {
    green: {
      900: 'var(--green-900)', 700: 'var(--green-700)',
      500: 'var(--green-500)', 300: 'var(--green-300)', 50: 'var(--green-50)',
    },
    saffron: { 600: 'var(--saffron-600)', 500: 'var(--saffron-500)', 100: 'var(--saffron-100)' },
    magenta: { 600: 'var(--magenta-600)', 50: 'var(--magenta-50)' },
    gold: { 500: 'var(--gold-500)' },
    cream: 'var(--cream)',
    surface: 'var(--surface)',
    ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)' },
    hairline: 'var(--border)',
  },
  borderRadius: { card: '20px', btn: '12px', input: '8px' },
  boxShadow: { card: 'var(--shadow-card)', lift: 'var(--shadow-lift)' },
  maxWidth: { content: '1140px', prose: '68ch' },
}
```

- [ ] **Step 5: Build the Button primitive**

Create `components/ui/Button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'lg' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

// Saffron is a FILL with white text only — never saffron text on cream.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-saffron-500 text-white hover:bg-saffron-600 shadow-card hover:shadow-lift',
  secondary: 'bg-white text-green-700 border-2 border-green-700 hover:bg-green-50',
  ghost: 'bg-transparent text-green-700 hover:bg-green-50',
}

// min-h-[48px] enforces the tap-target floor.
const SIZES: Record<Size, string> = {
  lg: 'min-h-[56px] px-8 text-lg',
  md: 'min-h-[48px] px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-semibold
        transition-all duration-150 ease-[var(--ease-enter)]
        hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0
        disabled:opacity-45 disabled:pointer-events-none
        motion-reduce:transform-none motion-reduce:transition-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
})
```

- [ ] **Step 6: Build Card and Skeleton**

Create `components/ui/Card.tsx`:

```tsx
import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-hairline rounded-card shadow-card p-6 ${className}`}>
      {children}
    </div>
  )
}
```

Create `components/ui/Skeleton.tsx` — shimmer, never a spinner, because a shimmer communicates "nearly there":

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-input bg-green-50 motion-reduce:animate-none ${className}`}
    />
  )
}
```

- [ ] **Step 7: Verify**

Run: `npm run test -- tests/tokens.test.ts`
Expected: PASS, all tokens present.

Run: `npm run build`
Expected: success.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css tailwind.config.ts components/ui tests/tokens.test.ts app/layout.tsx
git commit -m "feat: add design tokens, typography, and UI primitives"
```

---

## Task 3: Bilingual routing and dictionary parity

**Files:**
- Create: `dictionaries/hi.json`, `dictionaries/en.json`, `lib/i18n.ts`, `app/[lang]/layout.tsx`, `app/[lang]/page.tsx`, `middleware.ts`, `tests/i18n.test.ts`
- Delete: `app/page.tsx` (replaced by `app/[lang]/page.tsx`)

**Interfaces:**
- Consumes: Task 2 primitives
- Produces: `type Lang = 'hi' | 'en'`; `getDictionary(lang: Lang): Promise<Dictionary>`; every page receives `params: Promise<{ lang: Lang }>`

- [ ] **Step 1: Write the parity test**

A missing translation must break the build, not ship a blank string.

Create `tests/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import hi from '../dictionaries/hi.json'
import en from '../dictionaries/en.json'

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, key)
      : [key]
  })
}

describe('dictionaries', () => {
  const hiKeys = flatten(hi).sort()
  const enKeys = flatten(en).sort()

  it('have identical key sets', () => {
    expect(hiKeys).toEqual(enKeys)
  })

  it('have no empty values in hi', () => {
    const empties = flatten(hi).filter((k) =>
      k.split('.').reduce<any>((o, p) => o?.[p], hi) === '')
    expect(empties).toEqual([])
  })

  it('have no empty values in en', () => {
    const empties = flatten(en).filter((k) =>
      k.split('.').reduce<any>((o, p) => o?.[p], en) === '')
    expect(empties).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test -- tests/i18n.test.ts`
Expected: FAIL — dictionary files do not exist.

- [ ] **Step 3: Create the dictionaries**

Create `dictionaries/hi.json`:

```json
{
  "site": {
    "name": "अर्हम् आरोग्यम्",
    "subtitle": "बापू नगर औषधालय",
    "tagline": "सबके लिए सुलभ स्वास्थ्य परामर्श"
  },
  "nav": { "home": "होम", "book": "बुक करें", "mine": "मेरी अपॉइंटमेंट", "about": "हमारे बारे में", "services": "सेवाएँ", "ayurveda": "आयुर्वेद", "contact": "संपर्क" },
  "hero": {
    "vaidya": "वैद्य राहुल जी जैन",
    "timing": "हर मंगलवार, शाम 5 – रात 10",
    "cta": "अपॉइंटमेंट बुक करें",
    "address": "सी-39, ज्योति मार्ग, बापू नगर, जयपुर"
  },
  "how": {
    "title": "यह कैसे काम करता है",
    "step1": "समय चुनें",
    "step2": "औषधालय पधारें",
    "step3": "वैद्य जी से परामर्श लें"
  },
  "book": {
    "step": "चरण {n} / 4",
    "pickDate": "मंगलवार चुनें",
    "pickSlot": "समय चुनें",
    "slotsLeft": "{n} समय उपलब्ध",
    "full": "इस दिन कोई समय उपलब्ध नहीं",
    "signIn": "Google से साइन इन करें",
    "confirmCta": "{time} का समय बुक करें",
    "name": "पूरा नाम",
    "age": "आयु",
    "gender": "लिंग",
    "phone": "मोबाइल नंबर",
    "reason": "आने का कारण",
    "consent": "मैं सहमत हूँ कि यह जानकारी केवल अपॉइंटमेंट के लिए उपयोग की जाएगी।",
    "confirmed": "आपकी अपॉइंटमेंट तय हो गई है",
    "code": "बुकिंग कोड",
    "addCalendar": "कैलेंडर में जोड़ें",
    "cancel": "अपॉइंटमेंट रद्द करें",
    "cancelConfirm": "क्या आप वाकई यह अपॉइंटमेंट रद्द करना चाहते हैं?"
  },
  "errors": {
    "slotTaken": "यह समय अभी-अभी किसी और ने बुक कर लिया। कृपया दूसरा समय चुनें।",
    "tooLate": "यह समय अब बुक नहीं किया जा सकता। कृपया आगे का कोई समय चुनें।",
    "alreadyBooked": "आपकी एक अपॉइंटमेंट पहले से तय है। पहले उसे रद्द करें।",
    "network": "इंटरनेट कनेक्शन में समस्या है। कृपया दोबारा प्रयास करें।",
    "generic": "कुछ गड़बड़ हुई। कृपया थोड़ी देर बाद दोबारा प्रयास करें।"
  },
  "ayurveda": {
    "title": "आयुर्वेदिक परामर्श",
    "notice": "आयुर्वेदिक औषधियाँ एवं उपचार वैद्य जी से परामर्श के बाद, व्यक्तिगत आवश्यकतानुसार सुझाए जा सकते हैं। कृपया कोई भी औषधि या उपचार लेने से पहले वैद्य जी से परामर्श अवश्य करें।"
  },
  "disclaimer": "यह सेवा आपातकालीन चिकित्सा के लिए नहीं है। इस वेबसाइट पर ऑनलाइन चिकित्सकीय सलाह नहीं दी जाती।",
  "a11y": { "langToggle": "भाषा बदलें", "menu": "मुख्य मेन्यू", "callClinic": "औषधालय को कॉल करें" }
}
```

Create `dictionaries/en.json` with the identical key structure:

```json
{
  "site": {
    "name": "Arham Arogyam",
    "subtitle": "Bapu Nagar Aushdhalay",
    "tagline": "Accessible health consultation for everyone"
  },
  "nav": { "home": "Home", "book": "Book", "mine": "My Appointments", "about": "About", "services": "Services", "ayurveda": "Ayurveda", "contact": "Contact" },
  "hero": {
    "vaidya": "Vaidya Rahul Jain",
    "timing": "Every Tuesday, 5:00 PM – 10:00 PM",
    "cta": "Book Appointment",
    "address": "C-39, Jyoti Marg, Bapu Nagar, Jaipur"
  },
  "how": {
    "title": "How it works",
    "step1": "Choose a time",
    "step2": "Visit the centre",
    "step3": "Consult the Vaidya"
  },
  "book": {
    "step": "Step {n} of 4",
    "pickDate": "Choose a Tuesday",
    "pickSlot": "Choose a time",
    "slotsLeft": "{n} times available",
    "full": "No times available on this day",
    "signIn": "Sign in with Google",
    "confirmCta": "Book the {time} slot",
    "name": "Full name",
    "age": "Age",
    "gender": "Gender",
    "phone": "Mobile number",
    "reason": "Reason for visit",
    "consent": "I agree that this information will be used only for scheduling my appointment.",
    "confirmed": "Your appointment is confirmed",
    "code": "Booking code",
    "addCalendar": "Add to calendar",
    "cancel": "Cancel appointment",
    "cancelConfirm": "Are you sure you want to cancel this appointment?"
  },
  "errors": {
    "slotTaken": "Someone just booked this time. Please choose another one.",
    "tooLate": "This time can no longer be booked. Please choose a later one.",
    "alreadyBooked": "You already have an appointment booked. Please cancel it first.",
    "network": "There is a problem with your internet connection. Please try again.",
    "generic": "Something went wrong. Please try again in a moment."
  },
  "ayurveda": {
    "title": "Ayurvedic consultation",
    "notice": "Ayurvedic medicines and remedies may be recommended after consultation with the Vaidya, depending on individual requirements. Please consult the Vaidya before taking any medicine or remedy."
  },
  "disclaimer": "This service is not for medical emergencies. No medical advice is provided online through this website.",
  "a11y": { "langToggle": "Change language", "menu": "Main menu", "callClinic": "Call the clinic" }
}
```

- [ ] **Step 4: Run the parity test**

Run: `npm run test -- tests/i18n.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Write the i18n loader**

Create `lib/i18n.ts`:

```ts
import hi from '@/dictionaries/hi.json'
import en from '@/dictionaries/en.json'

export const LANGS = ['hi', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'hi'

export type Dictionary = typeof hi

const DICTS: Record<Lang, Dictionary> = { hi, en: en as Dictionary }

export function getDictionary(lang: Lang): Dictionary {
  return DICTS[lang] ?? DICTS[DEFAULT_LANG]
}

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v)
}

/** Replaces {name} placeholders. t(d.book.step, { n: 2 }) */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
```

- [ ] **Step 6: Redirect `/` to `/hi`**

Create `middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { LANGS, DEFAULT_LANG } from '@/lib/i18n'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasLang = LANGS.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLang) return NextResponse.next()

  const preferred = req.cookies.get('lang')?.value
  const lang = LANGS.includes(preferred as never) ? preferred : DEFAULT_LANG
  const url = req.nextUrl.clone()
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|admin|_next|favicon.ico|.*\\.).*)'],
}
```

- [ ] **Step 7: Build the localised layout**

Delete `app/page.tsx`. Create `app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isLang, LANGS, type Lang } from '@/lib/i18n'
import '../globals.css'

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> },
): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const d = getDictionary(lang)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

  return {
    metadataBase: new URL(base),
    title: `${d.site.name} — ${d.site.subtitle}`,
    description: d.site.tagline,
    // Keeps the temporary domain out of Google so it never competes
    // with the real one later.
    robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: `/${lang}`,
      languages: { hi: '/hi', en: '/en' },
    },
  }
}

export default async function LangLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  return (
    <html lang={lang}>
      <head>
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh bg-cream text-ink">{children}</body>
    </html>
  )
}
```

Create a placeholder `app/[lang]/page.tsx` (fleshed out in Task 13):

```tsx
import { getDictionary, type Lang } from '@/lib/i18n'

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)
  return <main className="mx-auto max-w-content p-6"><h1>{d.site.name}</h1></main>
}
```

- [ ] **Step 8: Verify**

Run: `npm run dev`, open `http://localhost:3000`
Expected: redirects to `/hi` and shows अर्हम् आरोग्यम्. `/en` shows "Arham Arogyam".

Run: `npm run test && npm run build`
Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add dictionaries lib/i18n.ts middleware.ts app tests/i18n.test.ts
git commit -m "feat: add bilingual routing with enforced dictionary parity"
```

---

## Task 4: Database schema and the exclusion constraint

The single most important task in the plan. The exclusion constraint is what makes double-booking impossible.

**Files:**
- Create: `prisma/schema.prisma`, `prisma/migrations/*_init/migration.sql`, `prisma/migrations/*_no_overlap/migration.sql`, `lib/db.ts`, `lib/errors.ts`, `tests/concurrency.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `prisma` client singleton from `@/lib/db`; models `AppUser`, `Settings`, `Availability`, `Blackout`, `Appointment`, `AuditLog`; `isOverlapViolation(e: unknown): boolean`

- [ ] **Step 1: Create the Supabase project**

Manually, signed in with the **clinic-owned** email address:
1. supabase.com → New project, region **Mumbai (ap-south-1)** — lowest latency to Jaipur.
2. Copy the pooled connection string into `DATABASE_URL` and the direct one into `DIRECT_URL` in `.env.local`.
3. Copy the project URL and anon key into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the service-role key into `SUPABASE_SERVICE_ROLE_KEY`.

Never prefix the service-role key with `NEXT_PUBLIC_`.

- [ ] **Step 2: Install Prisma**

```bash
npm i -D prisma
npm i @prisma/client
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 3: Write the schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  patient
  admin
}

enum AppointmentStatus {
  booked
  arrived
  completed
  no_show
  cancelled
}

enum AppointmentSource {
  online
  walk_in
}

model AppUser {
  id           String        @id @default(uuid())
  googleSub    String?       @unique @map("google_sub")
  email        String        @unique
  name         String
  phone        String?
  role         Role          @default(patient)
  createdAt    DateTime      @default(now()) @map("created_at")
  appointments Appointment[]

  @@map("app_user")
}

/// Singleton row, id = 1. Clinic-editable from /admin.
model Settings {
  id                Int   @id @default(1)
  slotMinutes       Int   @default(15) @map("slot_minutes")
  bookingWindowWeeks Int  @default(4)  @map("booking_window_weeks")
  minLeadHours      Int   @default(2)  @map("min_lead_hours")
  cancelWindowHours Int   @default(4)  @map("cancel_window_hours")
  maxOpenPerUser    Int   @default(1)  @map("max_open_per_user")
  consultationFee   Int   @default(0)  @map("consultation_fee")

  @@map("settings")
}

/// A table, not a constant: adding Saturdays is a row, not a deploy.
model Availability {
  id        String  @id @default(uuid())
  weekday   Int     // 0 = Sunday … 2 = Tuesday
  startTime String  @map("start_time") // "17:00" IST wall clock
  endTime   String  @map("end_time")   // "22:00" IST wall clock
  active    Boolean @default(true)

  @@map("availability")
}

/// NULL start/end means the entire day is blocked.
model Blackout {
  id        String  @id @default(uuid())
  date      String  // "YYYY-MM-DD" IST calendar date
  startTime String? @map("start_time")
  endTime   String? @map("end_time")
  reason    String

  @@map("blackout")
}

model Appointment {
  id          String            @id @default(uuid())
  bookingCode String            @unique @map("booking_code")
  userId      String?           @map("user_id")
  user        AppUser?          @relation(fields: [userId], references: [id])
  patientName String            @map("patient_name")
  phone       String
  age         Int
  gender      String
  reason      String
  slotStart   DateTime          @map("slot_start") @db.Timestamptz(3)
  slotEnd     DateTime          @map("slot_end")   @db.Timestamptz(3)
  status      AppointmentStatus @default(booked)
  source      AppointmentSource @default(online)
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  @@index([slotStart])
  @@index([userId, status])
  @@map("appointment")
}

model AuditLog {
  id       String   @id @default(uuid())
  actorId  String?  @map("actor_id")
  action   String
  entity   String
  entityId String   @map("entity_id")
  at       DateTime @default(now())
  metadata Json?

  @@map("audit_log")
}
```

- [ ] **Step 4: Generate and apply the base migration**

```bash
npx prisma migrate dev --name init
```

Expected: tables created in Supabase.

- [ ] **Step 5: Hand-write the exclusion-constraint migration**

Prisma cannot express `EXCLUDE` constraints, so this is written by hand.

```bash
npx prisma migrate dev --create-only --name no_overlap
```

Replace the generated `migration.sql` body with:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    tstzrange("slot_start", "slot_end") WITH &&
  ) WHERE (status <> 'cancelled');
```

Apply it:

```bash
npx prisma migrate dev
```

- [ ] **Step 6: Enable Row Level Security**

Defence in depth. The app already checks ownership in `lib/auth.ts`, but RLS
means a leaked anon key exposes nothing on its own.

```bash
npx prisma migrate dev --create-only --name rls
```

Replace the generated `migration.sql` with:

```sql
ALTER TABLE "app_user"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointment"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackout"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log"    ENABLE ROW LEVEL SECURITY;

-- Anyone may read the schedule; nobody may write it except through our API.
CREATE POLICY settings_read     ON "settings"     FOR SELECT USING (true);
CREATE POLICY availability_read ON "availability" FOR SELECT USING (true);
CREATE POLICY blackout_read     ON "blackout"     FOR SELECT USING (true);

-- A patient sees only their own row and their own appointments.
CREATE POLICY app_user_self ON "app_user" FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY appointment_own ON "appointment" FOR SELECT
  USING (user_id IN (SELECT id FROM "app_user" WHERE email = auth.jwt() ->> 'email'));

-- audit_log has NO select policy: it is write-only from the server role.
```

Apply: `npx prisma migrate dev`

Prisma connects as the table owner, which bypasses RLS — so the application
keeps working while the anon key is locked down. Verify the lockdown:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/appointment?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Expected: `[]` — never patient rows.

- [ ] **Step 7: Write the Prisma singleton and error helper**

Create `lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Create `lib/errors.ts`:

```ts
/**
 * Postgres raises SQLSTATE 23P01 (exclusion_violation) when two
 * appointments overlap. Prisma does not map this to a typed error code,
 * so we detect it from the message. This is the signal that two people
 * booked the same slot simultaneously.
 */
export function isOverlapViolation(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.includes('23P01') || msg.includes('appointment_no_overlap')
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code)
  }
}
```

- [ ] **Step 8: Write the concurrency test**

This is the only proof that the constraint works. It must exist before launch.

Create `tests/concurrency.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/db'
import { isOverlapViolation } from '@/lib/errors'

const SLOT_START = new Date('2026-09-01T11:30:00.000Z') // 17:00 IST
const SLOT_END = new Date('2026-09-01T11:45:00.000Z')

function makeAppointment(name: string, code: string) {
  return prisma.appointment.create({
    data: {
      bookingCode: code, patientName: name, phone: '9999999999',
      age: 40, gender: 'M', reason: 'test',
      slotStart: SLOT_START, slotEnd: SLOT_END,
    },
  })
}

describe('double-booking prevention', () => {
  beforeEach(async () => {
    await prisma.appointment.deleteMany({ where: { reason: 'test' } })
  })

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { reason: 'test' } })
    await prisma.$disconnect()
  })

  it('rejects a second booking for the identical slot', async () => {
    const results = await Promise.allSettled([
      makeAppointment('A', 'TESTAA'),
      makeAppointment('B', 'TESTBB'),
    ])

    const ok = results.filter((r) => r.status === 'fulfilled')
    const failed = results.filter((r) => r.status === 'rejected')

    expect(ok).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect(isOverlapViolation((failed[0] as PromiseRejectedResult).reason)).toBe(true)
  })

  it('rejects a partially overlapping slot', async () => {
    await makeAppointment('A', 'TESTCC')

    // 17:10–17:25 IST overlaps the 17:00–17:15 booking above.
    const overlapping = prisma.appointment.create({
      data: {
        bookingCode: 'TESTDD', patientName: 'B', phone: '9999999999',
        age: 40, gender: 'M', reason: 'test',
        slotStart: new Date('2026-09-01T11:40:00.000Z'),
        slotEnd: new Date('2026-09-01T11:55:00.000Z'),
      },
    })

    await expect(overlapping).rejects.toThrow()
  })

  it('allows an adjacent, non-overlapping slot', async () => {
    await makeAppointment('A', 'TESTEE')

    const adjacent = await prisma.appointment.create({
      data: {
        bookingCode: 'TESTFF', patientName: 'B', phone: '9999999999',
        age: 40, gender: 'M', reason: 'test',
        slotStart: SLOT_END,
        slotEnd: new Date('2026-09-01T12:00:00.000Z'),
      },
    })

    expect(adjacent.bookingCode).toBe('TESTFF')
  })

  it('allows reusing a slot after the first booking is cancelled', async () => {
    const first = await makeAppointment('A', 'TESTGG')
    await prisma.appointment.update({
      where: { id: first.id }, data: { status: 'cancelled' },
    })

    const second = await makeAppointment('B', 'TESTHH')
    expect(second.status).toBe('booked')
  })
})
```

- [ ] **Step 9: Run the concurrency test**

Run: `npm run test -- tests/concurrency.test.ts`
Expected: PASS, 4 tests. If "rejects a second booking" fails, the exclusion constraint did not apply — stop and fix the migration before continuing. Everything downstream depends on this.

- [ ] **Step 10: Commit**

```bash
git add prisma lib/db.ts lib/errors.ts tests/concurrency.test.ts .env.example
git commit -m "feat: add schema with Postgres exclusion constraint preventing double-booking"
```

---

## Task 5: Seed data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: a `settings` row with id 1; one `availability` row for Tuesday 17:00–22:00

- [ ] **Step 1: Write the seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },  // all defaults from the schema
  })

  const tuesday = await prisma.availability.findFirst({ where: { weekday: 2 } })
  if (!tuesday) {
    await prisma.availability.create({
      data: { weekday: 2, startTime: '17:00', endTime: '22:00', active: true },
    })
  }

  console.log('Seeded settings and Tuesday availability.')
}

main().finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Wire it up**

Add to `package.json`:

```json
"prisma": { "seed": "npx tsx prisma/seed.ts" }
```

```bash
npm i -D tsx
```

- [ ] **Step 3: Run and verify**

Run: `npx prisma db seed`
Expected: "Seeded settings and Tuesday availability."

Run: `npx prisma studio` and confirm one `settings` row and one `availability` row with `weekday = 2`.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: seed clinic settings and Tuesday availability"
```

---

## Task 6: IST time helpers

**Files:**
- Create: `lib/time.ts`, `tests/time.test.ts`

**Interfaces:**
- Produces: `istWallClockToUtc(dateISO: string, hhmm: string): Date`; `utcToIstParts(d: Date): { dateISO: string; hhmm: string }`; `istWeekday(dateISO: string): number`; `formatIstTime(d: Date, lang: Lang): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/time.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { istWallClockToUtc, utcToIstParts, istWeekday, formatIstTime } from '@/lib/time'

describe('IST conversion', () => {
  it('converts 17:00 IST to 11:30 UTC', () => {
    expect(istWallClockToUtc('2026-09-01', '17:00').toISOString())
      .toBe('2026-09-01T11:30:00.000Z')
  })

  it('handles a time that crosses the UTC date boundary backwards', () => {
    // 00:30 IST on the 2nd is 19:00 UTC on the 1st
    expect(istWallClockToUtc('2026-09-02', '00:30').toISOString())
      .toBe('2026-09-01T19:00:00.000Z')
  })

  it('round-trips back to the same IST wall clock', () => {
    const utc = istWallClockToUtc('2026-09-01', '21:45')
    expect(utcToIstParts(utc)).toEqual({ dateISO: '2026-09-01', hhmm: '21:45' })
  })

  it('reports Tuesday as weekday 2', () => {
    expect(istWeekday('2026-09-01')).toBe(2) // 1 Sep 2026 is a Tuesday
  })

  it('formats 5:30 PM for each language', () => {
    const d = istWallClockToUtc('2026-09-01', '17:30')
    expect(formatIstTime(d, 'en')).toBe('5:30 PM')
    expect(formatIstTime(d, 'hi')).toBe('शाम 5:30')
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run test -- tests/time.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `lib/time.ts`:

```ts
import type { Lang } from '@/lib/i18n'

/** India observes no DST, so a fixed offset is correct and avoids a tz library. */
const IST_OFFSET_MIN = 330

export function istWallClockToUtc(dateISO: string, hhmm: string): Date {
  const [y, mo, d] = dateISO.split('-').map(Number)
  const [h, mi] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60_000)
}

export function utcToIstParts(d: Date): { dateISO: string; hhmm: string } {
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    dateISO: `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}`,
    hhmm: `${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`,
  }
}

/** 0 = Sunday … 2 = Tuesday. dateISO is already an IST calendar date. */
export function istWeekday(dateISO: string): number {
  const [y, mo, d] = dateISO.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay()
}

const HI_PERIOD = (h: number) =>
  h < 4 ? 'रात' : h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात'

export function formatIstTime(d: Date, lang: Lang): string {
  const { hhmm } = utcToIstParts(d)
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  const mm = String(m).padStart(2, '0')
  return lang === 'hi'
    ? `${HI_PERIOD(h)} ${h12}:${mm}`
    : `${h12}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}
```

- [ ] **Step 4: Verify**

Run: `npm run test -- tests/time.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/time.ts tests/time.test.ts
git commit -m "feat: add IST time conversion helpers"
```

---

## Task 7: The slot engine

The heart of the system. Pure functions, no I/O, exhaustively tested. Most scheduling bugs live here, so the tests come first and cover every edge.

**Files:**
- Create: `lib/slots.ts`, `tests/slots.test.ts`

**Interfaces:**
- Consumes: `istWallClockToUtc`, `istWeekday` from `@/lib/time`
- Produces:
  - `interface Slot { start: Date; end: Date }`
  - `interface AvailabilityRule { weekday: number; startTime: string; endTime: string; active: boolean }`
  - `interface BlackoutRange { date: string; startTime: string | null; endTime: string | null }`
  - `interface BookedRange { start: Date; end: Date }`
  - `getAvailableSlots(params: SlotParams): Slot[]`
  - `overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean`
  - `nextTuesdays(fromISO: string, count: number): string[]`

- [ ] **Step 1: Write the failing tests**

Create `tests/slots.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getAvailableSlots, overlaps, nextTuesdays, type SlotParams } from '@/lib/slots'
import { istWallClockToUtc } from '@/lib/time'

const TUESDAY = '2026-09-01'          // a Tuesday
const WEDNESDAY = '2026-09-02'
const RULES = [{ weekday: 2, startTime: '17:00', endTime: '22:00', active: true }]

// Far in the past, so min-lead never filters anything unless a test wants it to.
const LONG_BEFORE = new Date('2026-08-01T00:00:00.000Z')

function params(over: Partial<SlotParams> = {}): SlotParams {
  return {
    dateISO: TUESDAY, rules: RULES, blackouts: [], booked: [],
    slotMinutes: 15, minLeadHours: 2, now: LONG_BEFORE, ...over,
  }
}

describe('overlaps', () => {
  const a1 = new Date('2026-09-01T11:30:00Z')
  const a2 = new Date('2026-09-01T11:45:00Z')

  it('is false for adjacent ranges', () => {
    expect(overlaps(a1, a2, a2, new Date('2026-09-01T12:00:00Z'))).toBe(false)
  })

  it('is true for partial overlap', () => {
    expect(overlaps(a1, a2, new Date('2026-09-01T11:40:00Z'), new Date('2026-09-01T11:55:00Z')))
      .toBe(true)
  })

  it('is true for containment', () => {
    expect(overlaps(a1, new Date('2026-09-01T12:30:00Z'), a2, new Date('2026-09-01T12:00:00Z')))
      .toBe(true)
  })
})

describe('getAvailableSlots', () => {
  it('generates 20 fifteen-minute slots for 17:00-22:00', () => {
    const slots = getAvailableSlots(params())
    expect(slots).toHaveLength(20)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:30:00.000Z')  // 17:00 IST
    expect(slots[19].end.toISOString()).toBe('2026-09-01T16:30:00.000Z')   // 22:00 IST
  })

  it('never produces a slot ending after the rule end time', () => {
    // 50 minutes into a 5-hour window leaves a 10-minute tail that must be dropped.
    const slots = getAvailableSlots(params({ slotMinutes: 50 }))
    const last = slots[slots.length - 1]
    expect(last.end.getTime()).toBeLessThanOrEqual(
      istWallClockToUtc(TUESDAY, '22:00').getTime())
    expect(slots).toHaveLength(6)
  })

  it('returns nothing for a day with no matching rule', () => {
    expect(getAvailableSlots(params({ dateISO: WEDNESDAY }))).toEqual([])
  })

  it('returns nothing when the rule is inactive', () => {
    const rules = [{ ...RULES[0], active: false }]
    expect(getAvailableSlots(params({ rules }))).toEqual([])
  })

  it('drops slots inside the minimum lead time', () => {
    // 16:00 IST on the day itself; with a 2-hour lead, 17:00 and 17:45 are out,
    // so the first bookable slot is 18:00.
    const now = istWallClockToUtc(TUESDAY, '16:00')
    const slots = getAvailableSlots(params({ now, minLeadHours: 2 }))
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:30:00.000Z') // 18:00 IST
  })

  it('returns nothing on a whole-day blackout', () => {
    const blackouts = [{ date: TUESDAY, startTime: null, endTime: null }]
    expect(getAvailableSlots(params({ blackouts }))).toEqual([])
  })

  it('drops only the blacked-out range on a partial blackout', () => {
    // Vaidya arrives an hour late: 17:00-18:00 blocked, 4 slots removed.
    const blackouts = [{ date: TUESDAY, startTime: '17:00', endTime: '18:00' }]
    const slots = getAvailableSlots(params({ blackouts }))
    expect(slots).toHaveLength(16)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:30:00.000Z') // 18:00 IST
  })

  it('ignores a blackout for a different date', () => {
    const blackouts = [{ date: WEDNESDAY, startTime: null, endTime: null }]
    expect(getAvailableSlots(params({ blackouts }))).toHaveLength(20)
  })

  it('removes an exactly-matching booked slot', () => {
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:00'),
      end: istWallClockToUtc(TUESDAY, '17:15'),
    }]
    const slots = getAvailableSlots(params({ booked }))
    expect(slots).toHaveLength(19)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:45:00.000Z') // 17:15 IST
  })

  it('removes every slot a booking partially overlaps', () => {
    // THE load-bearing case. A 17:10-17:25 booking (made when slots were
    // 15 minutes and offset differently) must knock out BOTH the 17:00-17:15
    // and 17:15-17:30 slots. An equality check would wrongly keep both.
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:10'),
      end: istWallClockToUtc(TUESDAY, '17:25'),
    }]
    const slots = getAvailableSlots(params({ booked }))
    expect(slots).toHaveLength(18)
    expect(slots[0].start.toISOString()).toBe('2026-09-01T12:00:00.000Z') // 17:30 IST
  })

  it('routes around old bookings after the admin changes slot length', () => {
    // Existing 15-minute booking at 17:00-17:15; admin switches to 20 minutes.
    // The 17:00-17:20 slot overlaps it and must be dropped; 17:20 onward stand.
    const booked = [{
      start: istWallClockToUtc(TUESDAY, '17:00'),
      end: istWallClockToUtc(TUESDAY, '17:15'),
    }]
    const slots = getAvailableSlots(params({ slotMinutes: 20, booked }))
    expect(slots[0].start.toISOString()).toBe('2026-09-01T11:50:00.000Z') // 17:20 IST
    expect(slots).toHaveLength(14)
  })

  it('returns nothing when every slot is booked', () => {
    const booked = getAvailableSlots(params()).map((s) => ({ start: s.start, end: s.end }))
    expect(getAvailableSlots(params({ booked }))).toEqual([])
  })

  it('returns slots sorted by start time', () => {
    const slots = getAvailableSlots(params())
    const times = slots.map((s) => s.start.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })
})

describe('nextTuesdays', () => {
  it('returns the coming Tuesdays including today when today is Tuesday', () => {
    expect(nextTuesdays('2026-09-01', 4))
      .toEqual(['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22'])
  })

  it('skips forward when today is not Tuesday', () => {
    expect(nextTuesdays('2026-09-03', 2)).toEqual(['2026-09-08', '2026-09-15'])
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run test -- tests/slots.test.ts`
Expected: FAIL — `@/lib/slots` not found.

- [ ] **Step 3: Implement the engine**

Create `lib/slots.ts`:

```ts
import { istWallClockToUtc, istWeekday } from '@/lib/time'

export interface Slot { start: Date; end: Date }
export interface AvailabilityRule {
  weekday: number; startTime: string; endTime: string; active: boolean
}
export interface BlackoutRange {
  date: string; startTime: string | null; endTime: string | null
}
export interface BookedRange { start: Date; end: Date }

export interface SlotParams {
  dateISO: string
  rules: AvailabilityRule[]
  blackouts: BlackoutRange[]
  booked: BookedRange[]
  slotMinutes: number
  minLeadHours: number
  now: Date
}

/** Half-open interval overlap: touching endpoints do NOT overlap. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()
}

export function getAvailableSlots(p: SlotParams): Slot[] {
  const weekday = istWeekday(p.dateISO)
  const rules = p.rules.filter((r) => r.active && r.weekday === weekday)
  if (rules.length === 0) return []

  const dayBlackouts = p.blackouts.filter((b) => b.date === p.dateISO)

  // A blackout with no times blocks the whole day outright.
  if (dayBlackouts.some((b) => b.startTime === null || b.endTime === null)) return []

  const blackoutRanges = dayBlackouts.map((b) => ({
    start: istWallClockToUtc(p.dateISO, b.startTime as string),
    end: istWallClockToUtc(p.dateISO, b.endTime as string),
  }))

  const leadCutoff = new Date(p.now.getTime() + p.minLeadHours * 3_600_000)
  const stepMs = p.slotMinutes * 60_000

  const slots: Slot[] = []

  for (const rule of rules) {
    const windowStart = istWallClockToUtc(p.dateISO, rule.startTime)
    const windowEnd = istWallClockToUtc(p.dateISO, rule.endTime)

    for (let t = windowStart.getTime(); t + stepMs <= windowEnd.getTime(); t += stepMs) {
      const start = new Date(t)
      const end = new Date(t + stepMs)

      if (start.getTime() < leadCutoff.getTime()) continue
      if (blackoutRanges.some((b) => overlaps(start, end, b.start, b.end))) continue
      // Overlap, not equality: a booking made under a different slot length
      // can straddle two of today's slots, and both must be withheld.
      if (p.booked.some((b) => overlaps(start, end, b.start, b.end))) continue

      slots.push({ start, end })
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Upcoming clinic days, as IST calendar dates. Includes today if it is a Tuesday. */
export function nextTuesdays(fromISO: string, count: number): string[] {
  const [y, mo, d] = fromISO.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, mo - 1, d))
  const out: string[] = []
  const pad = (n: number) => String(n).padStart(2, '0')

  while (out.length < count) {
    if (cursor.getUTCDay() === 2) {
      out.push(
        `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`)
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}
```

- [ ] **Step 4: Verify every edge passes**

Run: `npm run test -- tests/slots.test.ts`
Expected: PASS, 18 tests. Every one must pass — this file is the correctness core.

- [ ] **Step 5: Commit**

```bash
git add lib/slots.ts tests/slots.test.ts
git commit -m "feat: add pure slot engine with overlap-based availability"
```

---

## Task 8: Google authentication and role guards

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/auth.ts`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts`, `tests/auth.test.ts`
- Modify: `middleware.ts`

**Interfaces:**
- Produces: `getCurrentUser(): Promise<AppUser | null>`; `requireUser(): Promise<AppUser>` (throws `ApiError(401)`); `requireAdmin(): Promise<AppUser>` (throws `ApiError(401|403)`)

- [ ] **Step 1: Configure Google OAuth**

Manually:
1. Google Cloud Console → new project → OAuth consent screen (External, app name "Arham Arogyam").
2. Credentials → OAuth client ID → Web application.
3. Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Supabase Dashboard → Authentication → Providers → Google → paste the client ID and secret.
5. Supabase → Authentication → URL Configuration → add **both** origins to the allow-list: the `*.netlify.app` URL and `http://localhost:3000`. Add the `.eu.org` and `.in` origins here later — this is the list that makes the domain move a ten-minute job.

```bash
npm i @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Write the Supabase clients**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // Called from a server component; middleware refreshes instead.
          }
        },
      },
    },
  )
}
```

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 3: Write the auth helpers**

Create `lib/auth.ts`:

```ts
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { ApiError } from '@/lib/errors'
import type { AppUser } from '@prisma/client'

/**
 * Resolves the Supabase session to OUR app_user row, upserting on first
 * sign-in. Keying on email (not the Supabase user id) is deliberate: it
 * means identities survive a future migration off Supabase Auth.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  return prisma.appUser.upsert({
    where: { email: user.email },
    update: { googleSub: user.id },
    create: {
      email: user.email,
      googleSub: user.id,
      name: (user.user_metadata?.full_name as string) ?? user.email.split('@')[0],
    },
  })
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) throw new ApiError(401, 'not_signed_in')
  return user
}

/**
 * Middleware guards /admin for UX, but every admin route re-checks here.
 * Middleware alone is never trusted for authorization.
 */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new ApiError(403, 'not_admin')
  return user
}
```

- [ ] **Step 4: Write the OAuth callback and sign-out routes**

Create `app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/hi'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await getCurrentUser()   // creates the app_user row on first sign-in
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/hi?auth=failed`)
}
```

Create `app/auth/signout/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/hi', req.url), { status: 303 })
}
```

- [ ] **Step 5: Guard `/admin` in middleware**

Add to `middleware.ts`, before the language logic:

```ts
if (pathname.startsWith('/admin')) {
  const supabase = createSupabaseMiddlewareClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/hi?signin=required', req.url))
  return NextResponse.next()
}
```

and change the matcher so `/admin` is included:

```ts
export const config = {
  matcher: ['/admin/:path*', '/((?!api|_next|favicon.ico|.*\\.).*)'],
}
```

Add the middleware Supabase helper to `lib/supabase/server.ts`:

```ts
import { createServerClient as createSSRClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export function createSupabaseMiddlewareClient(req: NextRequest) {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    },
  )
}
```

- [ ] **Step 6: Write the role-guard test**

Create `tests/auth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/lib/errors'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  prisma: { appUser: { upsert: vi.fn() } },
}))

const { createClient } = await import('@/lib/supabase/server')
const { prisma } = await import('@/lib/db')
const { requireUser, requireAdmin } = await import('@/lib/auth')

function mockSession(email: string | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: email ? { id: 'sub', email, user_metadata: {} } : null } }) },
  } as never)
}

describe('auth guards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an anonymous visitor with 401', async () => {
    mockSession(null)
    await expect(requireUser()).rejects.toMatchObject({ status: 401 })
  })

  it('rejects a signed-in patient from admin routes with 403', async () => {
    mockSession('patient@example.com')
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ role: 'patient' } as never)
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 })
  })

  it('admits an admin', async () => {
    mockSession('vaidya@example.com')
    vi.mocked(prisma.appUser.upsert).mockResolvedValue({ role: 'admin' } as never)
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'admin' })
  })
})
```

- [ ] **Step 7: Verify**

Run: `npm run test -- tests/auth.test.ts`
Expected: PASS, 3 tests.

Manually: sign in with Google from `/hi`, then check `npx prisma studio` — one `app_user` row exists with `role = 'patient'`. Promote yourself for testing:

```sql
UPDATE app_user SET role = 'admin' WHERE email = '<your-email>';
```

- [ ] **Step 8: Commit**

```bash
git add lib/supabase lib/auth.ts app/auth middleware.ts tests/auth.test.ts
git commit -m "feat: add Google sign-in with server-side role guards"
```

---

## Task 9: Availability API

**Files:**
- Create: `app/api/availability/route.ts`, `lib/appointments.ts`

**Interfaces:**
- Consumes: `getAvailableSlots`, `prisma`
- Produces: `GET /api/availability?date=YYYY-MM-DD` → `{ slots: { start: string; end: string }[] }`; `loadSlotContext(dateISO): Promise<SlotParams>`

- [ ] **Step 1: Write the context loader**

Create `lib/appointments.ts`:

```ts
import { prisma } from '@/lib/db'
import { getAvailableSlots, type SlotParams, type Slot } from '@/lib/slots'
import { istWallClockToUtc } from '@/lib/time'

export async function loadSlotContext(dateISO: string): Promise<SlotParams> {
  const dayStart = istWallClockToUtc(dateISO, '00:00')
  const dayEnd = new Date(dayStart.getTime() + 86_400_000)

  const [settings, rules, blackouts, booked] = await Promise.all([
    prisma.settings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.availability.findMany({ where: { active: true } }),
    prisma.blackout.findMany({ where: { date: dateISO } }),
    prisma.appointment.findMany({
      where: { slotStart: { gte: dayStart, lt: dayEnd }, status: { not: 'cancelled' } },
      select: { slotStart: true, slotEnd: true },
    }),
  ])

  return {
    dateISO, rules, blackouts,
    booked: booked.map((b) => ({ start: b.slotStart, end: b.slotEnd })),
    slotMinutes: settings.slotMinutes,
    minLeadHours: settings.minLeadHours,
    now: new Date(),
  }
}

export async function availableSlotsFor(dateISO: string): Promise<Slot[]> {
  return getAvailableSlots(await loadSlotContext(dateISO))
}
```

- [ ] **Step 2: Write the route**

Create `app/api/availability/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { availableSlotsFor } from '@/lib/appointments'

const Query = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse({ date: req.nextUrl.searchParams.get('date') })
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad_date' }, { status: 400 })
  }

  const slots = await availableSlotsFor(parsed.data.date)
  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
  })
}
```

```bash
npm i zod
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, then

```bash
curl 'http://localhost:3000/api/availability?date=2026-09-01' | head -c 300
curl -s -o /dev/null -w '%{http_code}\n' 'http://localhost:3000/api/availability?date=nonsense'
```

Expected: a JSON array of 20 slots for the Tuesday; `400` for the bad date.

- [ ] **Step 4: Commit**

```bash
git add lib/appointments.ts app/api/availability package.json package-lock.json
git commit -m "feat: add availability API"
```

---

## Task 10: Booking API with 409 on collision

**Files:**
- Create: `app/api/appointments/route.ts`, `lib/bookingCode.ts`, `tests/bookingCode.test.ts`, `tests/booking-api.test.ts`

**Interfaces:**
- Consumes: `requireUser`, `availableSlotsFor`, `isOverlapViolation`
- Produces: `POST /api/appointments` → `201 { bookingCode, slotStart }` · `409 { error: 'slot_taken' }` · `422 { error: 'already_booked' | 'slot_unavailable' }`; `generateBookingCode(): string`

- [ ] **Step 1: Write the booking-code test**

Create `tests/bookingCode.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { generateBookingCode, CODE_ALPHABET } from '@/lib/bookingCode'

describe('generateBookingCode', () => {
  it('is 6 characters', () => {
    expect(generateBookingCode()).toHaveLength(6)
  })

  it('avoids visually ambiguous characters', () => {
    expect(CODE_ALPHABET).not.toMatch(/[O0I1L]/)
  })

  it('uses only alphabet characters', () => {
    const re = new RegExp(`^[${CODE_ALPHABET}]{6}$`)
    for (let i = 0; i < 200; i++) expect(generateBookingCode()).toMatch(re)
  })

  it('is not sequential across calls', () => {
    const codes = new Set(Array.from({ length: 500 }, generateBookingCode))
    expect(codes.size).toBeGreaterThan(495)
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm run test -- tests/bookingCode.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the code generator**

Create `lib/bookingCode.ts`:

```ts
import { randomInt } from 'node:crypto'

/** No O/0, I/1, or L — patients read these aloud over the phone. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** randomInt is uniform, unlike (byte % alphabet.length). */
export function generateBookingCode(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return out
}
```

Run: `npm run test -- tests/bookingCode.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 4: Write the booking route**

Create `app/api/appointments/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { availableSlotsFor } from '@/lib/appointments'
import { generateBookingCode } from '@/lib/bookingCode'
import { isOverlapViolation, ApiError } from '@/lib/errors'
import { utcToIstParts } from '@/lib/time'

const Body = z.object({
  slotStart: z.string().datetime(),
  patientName: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/),   // Indian mobile
  age: z.number().int().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  reason: z.string().trim().min(2).max(300),
  consent: z.literal(true),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = Body.safeParse(await req.json())
    if (!body.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })

    const openCount = await prisma.appointment.count({
      where: { userId: user.id, status: { in: ['booked', 'arrived'] },
               slotStart: { gte: new Date() } },
    })
    if (openCount >= settings.maxOpenPerUser) {
      return NextResponse.json({ error: 'already_booked' }, { status: 422 })
    }

    // Re-derive the slot server-side. The client is never trusted to say
    // what is available, only which start time it wants.
    const slotStart = new Date(body.data.slotStart)
    const { dateISO } = utcToIstParts(slotStart)
    const slot = (await availableSlotsFor(dateISO))
      .find((s) => s.start.getTime() === slotStart.getTime())

    if (!slot) return NextResponse.json({ error: 'slot_unavailable' }, { status: 422 })

    const appointment = await prisma.appointment.create({
      data: {
        bookingCode: generateBookingCode(),
        userId: user.id,
        patientName: body.data.patientName,
        phone: body.data.phone,
        age: body.data.age,
        gender: body.data.gender,
        reason: body.data.reason,
        slotStart: slot.start,
        slotEnd: slot.end,
        source: 'online',
      },
    })

    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'book', entity: 'appointment',
              entityId: appointment.id },
    })

    return NextResponse.json(
      { bookingCode: appointment.bookingCode, slotStart: appointment.slotStart },
      { status: 201 },
    )
  } catch (e) {
    // The exclusion constraint fired: someone booked this slot microseconds ago.
    if (isOverlapViolation(e)) {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
    }
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.code }, { status: e.status })
    }
    throw e
  }
}
```

- [ ] **Step 5: Write the API behaviour test**

Create `tests/booking-api.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isOverlapViolation } from '@/lib/errors'

describe('overlap detection maps to 409', () => {
  it('recognises the SQLSTATE', () => {
    expect(isOverlapViolation(new Error('… code 23P01 …'))).toBe(true)
  })

  it('recognises the constraint name', () => {
    expect(isOverlapViolation(
      new Error('conflicting key value violates exclusion constraint "appointment_no_overlap"')))
      .toBe(true)
  })

  it('does not misfire on unrelated errors', () => {
    expect(isOverlapViolation(new Error('connection refused'))).toBe(false)
  })
})
```

- [ ] **Step 6: Verify**

Run: `npm run test`
Expected: all suites pass.

Manually, signed in, book a slot then try the same slot again from a second browser: expect `201` then `422 slot_unavailable` (or `409 slot_taken` if simultaneous).

- [ ] **Step 7: Commit**

```bash
git add lib/bookingCode.ts app/api/appointments tests/bookingCode.test.ts tests/booking-api.test.ts
git commit -m "feat: add booking API returning 409 on slot collision"
```

---

## Task 11: Cancel, reschedule, and my-appointments APIs

**Files:**
- Create: `app/api/appointments/mine/route.ts`, `app/api/appointments/[id]/cancel/route.ts`, `app/api/appointments/[id]/reschedule/route.ts`

**Interfaces:**
- Produces: `GET /api/appointments/mine` → `{ upcoming: Appt[]; past: Appt[] }`; `POST /api/appointments/:id/cancel` → `200 | 403 | 422 { error: 'too_late' }`; `POST /api/appointments/:id/reschedule` → `200 | 409 | 422`

- [ ] **Step 1: Write the list route**

Create `app/api/appointments/mine/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'

export async function GET() {
  try {
    const user = await requireUser()
    const all = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { slotStart: 'desc' },
    })
    const now = Date.now()
    return NextResponse.json({
      upcoming: all.filter((a) => a.slotStart.getTime() >= now && a.status !== 'cancelled'),
      past: all.filter((a) => a.slotStart.getTime() < now || a.status === 'cancelled'),
    })
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.code }, { status: e.status })
    throw e
  }
}
```

- [ ] **Step 2: Write the cancel route**

Create `app/api/appointments/[id]/cancel/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { ApiError } from '@/lib/errors'

export async function POST(
  _req: Request, { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const appt = await prisma.appointment.findUnique({ where: { id } })
    if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Ownership is checked here, not only by RLS. Admins may cancel any.
    if (appt.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const settings = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } })
    const cutoff = appt.slotStart.getTime() - settings.cancelWindowHours * 3_600_000
    if (Date.now() > cutoff && user.role !== 'admin') {
      return NextResponse.json({ error: 'too_late' }, { status: 422 })
    }

    await prisma.appointment.update({ where: { id }, data: { status: 'cancelled' } })
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'cancel', entity: 'appointment', entityId: id },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.code }, { status: e.status })
    throw e
  }
}
```

- [ ] **Step 3: Write the reschedule route**

Create `app/api/appointments/[id]/reschedule/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { availableSlotsFor } from '@/lib/appointments'
import { isOverlapViolation, ApiError } from '@/lib/errors'
import { utcToIstParts } from '@/lib/time'

const Body = z.object({ slotStart: z.string().datetime() })

export async function POST(
  req: Request, { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = Body.safeParse(await req.json())
    if (!body.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

    const appt = await prisma.appointment.findUnique({ where: { id } })
    if (!appt) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (appt.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const start = new Date(body.data.slotStart)
    const { dateISO } = utcToIstParts(start)
    const slot = (await availableSlotsFor(dateISO))
      .find((s) => s.start.getTime() === start.getTime())
    if (!slot) return NextResponse.json({ error: 'slot_unavailable' }, { status: 422 })

    await prisma.appointment.update({
      where: { id }, data: { slotStart: slot.start, slotEnd: slot.end },
    })
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'reschedule', entity: 'appointment', entityId: id },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (isOverlapViolation(e)) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
    if (e instanceof ApiError) return NextResponse.json({ error: e.code }, { status: e.status })
    throw e
  }
}
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: success.

Manually: book a slot, `GET /api/appointments/mine` shows it under `upcoming`, cancel it, it moves to `past` with `status: cancelled`, and the slot reappears in `/api/availability`.

- [ ] **Step 5: Commit**

```bash
git add app/api/appointments
git commit -m "feat: add cancel, reschedule, and my-appointments APIs"
```

---

## Task 12: Motion primitives and the app shell

**Files:**
- Create: `components/motion/Reveal.tsx`, `components/motion/Stagger.tsx`, `components/shell/Header.tsx`, `components/shell/BottomNav.tsx`, `components/shell/Footer.tsx`, `components/shell/LangToggle.tsx`, `public/logo.svg`
- Modify: `app/[lang]/layout.tsx`

**Interfaces:**
- Produces: `<Reveal delay?>`, `<Stagger step?>` (children fade in sequentially), `<Header lang>`, `<BottomNav lang>`, `<Footer lang>`

- [ ] **Step 1: Add the logo**

Export the clinic logo as SVG (or optimised PNG at 2x) to `public/logo.svg`. Add `public/logo-192.png` and `public/logo-512.png` for favicons and Open Graph.

The full tri-colour ring appears **only** in this asset — never repeated as page decoration.

- [ ] **Step 2: Build Reveal**

Create `components/motion/Reveal.tsx`:

```tsx
'use client'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Fade + rise on scroll, once. Uses the .reveal class from globals.css,
 * which starts at opacity 0.001 rather than display:none — so if JS never
 * runs, the noscript rule reveals everything and no content is lost.
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setTimeout(() => el.classList.add('is-visible'), delay)
        io.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return <div ref={ref} className="reveal">{children}</div>
}
```

- [ ] **Step 3: Build Stagger**

Create `components/motion/Stagger.tsx`:

```tsx
'use client'
import { Children, type ReactNode } from 'react'
import { Reveal } from './Reveal'

/** Children appear in sequence. Total is capped so a long list never crawls. */
export function Stagger({ children, step = 60, cap = 300 }: {
  children: ReactNode; step?: number; cap?: number
}) {
  return (
    <>
      {Children.map(children, (child, i) => (
        <Reveal delay={Math.min(i * step, cap)}>{child}</Reveal>
      ))}
    </>
  )
}
```

- [ ] **Step 4: Build the language toggle**

Create `components/shell/LangToggle.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Lang } from '@/lib/i18n'

export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname()
  const other: Lang = lang === 'hi' ? 'en' : 'hi'
  // Preserve the current path across the switch.
  const href = pathname.replace(new RegExp(`^/${lang}`), `/${other}`)

  return (
    <Link
      href={href}
      aria-label={label}
      onClick={() => { document.cookie = `lang=${other}; path=/; max-age=31536000` }}
      className="min-h-[48px] inline-flex items-center rounded-full border border-hairline
                 px-4 text-base font-medium text-magenta-600 transition-colors
                 duration-200 hover:bg-magenta-50"
    >
      {other === 'hi' ? 'हिं' : 'EN'}
    </Link>
  )
}
```

- [ ] **Step 5: Build the header, bottom nav, and footer**

Create `components/shell/Header.tsx` — logo, clinic name, language toggle. Desktop shows text links to about/services/ayurveda/contact; mobile shows none (the bottom nav carries navigation).

Create `components/shell/BottomNav.tsx` — **the mobile navigation. No hamburger menu.** Three thumb-reachable destinations:

```tsx
import Link from 'next/link'
import { getDictionary, type Lang } from '@/lib/i18n'

export function BottomNav({ lang }: { lang: Lang }) {
  const d = getDictionary(lang)
  const items = [
    { href: `/${lang}`, label: d.nav.home },
    { href: `/${lang}/book`, label: d.nav.book },
    { href: `/${lang}/my-appointments`, label: d.nav.mine },
  ]

  return (
    <nav
      aria-label={d.a11y.menu}
      className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 border-t border-hairline
                 bg-surface/95 backdrop-blur md:hidden
                 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="flex min-h-[56px] items-center justify-center text-base
                     font-medium text-green-700 active:bg-green-50"
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}
```

Create `components/shell/Footer.tsx` — address, timings, tap-to-call link, and the site-wide disclaimer (`d.disclaimer`), plus links to privacy and terms.

- [ ] **Step 6: Wire them into the layout**

In `app/[lang]/layout.tsx`, wrap `{children}`:

```tsx
<body className="min-h-dvh bg-cream text-ink pb-20 md:pb-0">
  <Header lang={lang} />
  {children}
  <Footer lang={lang} />
  <BottomNav lang={lang} />
</body>
```

The `pb-20` reserves room so the fixed bottom nav never covers page content.

- [ ] **Step 7: Verify**

Run: `npm run dev`, open `/hi` on a mobile viewport (375×667 in devtools).
Expected: bottom nav visible with three items, each ≥ 48px tall, nothing hidden behind it. Toggle to `/en` and back — the path is preserved.

In devtools, enable "Emulate prefers-reduced-motion: reduce" and reload. Expected: content appears immediately with no transforms.

Disable JavaScript and reload. Expected: **all content still visible.**

- [ ] **Step 8: Commit**

```bash
git add components public/logo.svg app/[lang]/layout.tsx
git commit -m "feat: add motion primitives and mobile-first app shell"
```

---

## Task 13: Home page

**Files:**
- Create: `app/[lang]/page.tsx` (replace), `components/home/Hero.tsx`, `components/home/TrustStrip.tsx`, `components/home/ServiceCards.tsx`, `components/home/HowItWorks.tsx`, `components/home/VisitUs.tsx`

**Interfaces:**
- Consumes: `Reveal`, `Stagger`, `Button`, `Card`, dictionaries

- [ ] **Step 1: Build the hero**

Create `components/home/Hero.tsx`. Requirements, all load-bearing:

- Logo, clinic name, subtitle, tagline
- **The timing badge is visible without scrolling** — `हर मंगलवार, शाम 5 – रात 10`
- **Exactly one primary button**, `variant="primary" size="lg"`, linking to `/${lang}/book`
- On load: logo scales `0.96 → 1` with a fade over 600ms; the wordmark fades up 12px starting 80ms later. Once only, and skipped under reduced motion.

```tsx
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Dictionary, Lang } from '@/lib/i18n'

export function Hero({ lang, d }: { lang: Lang; d: Dictionary }) {
  return (
    <section className="mx-auto max-w-content px-6 pt-10 pb-16 text-center">
      <Image
        src="/logo.svg" alt={d.site.name} width={168} height={168} priority
        className="mx-auto animate-[heroIn_600ms_var(--ease-enter)_both]
                   motion-reduce:animate-none"
      />
      <h1 className="mt-6 text-[clamp(2rem,5vw,3.25rem)]">{d.site.name}</h1>
      <p className="mt-1 text-lg text-ink-muted">{d.site.subtitle}</p>
      <p className="mt-4 text-xl">{d.site.tagline}</p>

      <p className="mt-6 inline-block rounded-full bg-green-50 px-5 py-2
                    text-lg font-semibold text-green-700">
        {d.hero.timing}
      </p>

      <div className="mt-8">
        <Link href={`/${lang}/book`}>
          <Button variant="primary" size="lg">{d.hero.cta}</Button>
        </Link>
      </div>
    </section>
  )
}
```

Add the keyframes to `globals.css`:

```css
@keyframes heroIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 2: Build the remaining sections**

- `TrustStrip` — Vaidya Rahul Jain's photo, name, and registration number (rendered only when the number is present in content).
- `ServiceCards` — the eight service items from `d.services.items`, inside `<Stagger>`, each a `<Card>`. **Add the service list to both dictionaries** and re-run the parity test.
- `HowItWorks` — three numbered steps from `d.how`.
- `VisitUs` — address, timings, a `tel:` link with `aria-label={d.a11y.callClinic}`, and a lazy-loaded Google Maps `<iframe>` with `loading="lazy"` so it never blocks LCP.

- [ ] **Step 3: Compose the page**

```tsx
import { getDictionary, type Lang } from '@/lib/i18n'
import { Hero } from '@/components/home/Hero'
import { TrustStrip } from '@/components/home/TrustStrip'
import { ServiceCards } from '@/components/home/ServiceCards'
import { HowItWorks } from '@/components/home/HowItWorks'
import { VisitUs } from '@/components/home/VisitUs'
import { Reveal } from '@/components/motion/Reveal'

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)
  return (
    <main>
      <Hero lang={lang} d={d} />
      <Reveal><TrustStrip d={d} /></Reveal>
      <ServiceCards d={d} />
      <Reveal><HowItWorks d={d} /></Reveal>
      <Reveal><VisitUs d={d} /></Reveal>
    </main>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npm run test -- tests/i18n.test.ts`
Expected: PASS — the new service keys exist in both dictionaries.

Run: `npm run dev`, open `/hi` at 375px width.
Expected: exactly one saffron button above the fold; the timing badge visible without scrolling; nothing overlapping the bottom nav.

- [ ] **Step 5: Commit**

```bash
git add app/[lang]/page.tsx components/home dictionaries app/globals.css
git commit -m "feat: build bilingual home page"
```

---

## Task 14: Content pages

**Files:**
- Create: `app/[lang]/{about,services,ayurveda,contact,privacy,terms}/page.tsx`, `components/Prose.tsx`
- Modify: `dictionaries/hi.json`, `dictionaries/en.json`

**Interfaces:**
- Produces: six statically rendered routes

- [ ] **Step 1: Add page copy to both dictionaries**

Add `about`, `services.items`, `contact`, `privacy`, and `terms` sections to **both** files with identical keys. Run `npm run test -- tests/i18n.test.ts` after each addition.

- [ ] **Step 2: Build the `/ayurveda` page — content-constrained**

This page carries a hard constraint from the spec. It lists **categories only**: Ayurvedic medicines, herbal remedies, natural ingredients, lifestyle guidance, diet recommendations, preventive advice.

It **must not**: name a medical condition, claim a therapeutic effect, or recommend anything automatically.

It **must** render `d.ayurveda.notice` prominently — the exact approved wording, unedited:

```tsx
<div className="mt-8 rounded-card border-l-4 border-saffron-500 bg-saffron-100 p-6">
  <p className="text-lg">{d.ayurveda.notice}</p>
</div>
```

- [ ] **Step 3: Build the privacy page — DPDP compliance**

Must state, in both languages: what is collected (name, phone, age, gender, reason for visit, email), the purpose (scheduling a consultation), the retention period (**24 months from the visit**), and how to request deletion (from `/my-appointments`, or by contacting the clinic).

- [ ] **Step 4: Build the remaining four pages**

`about`, `services`, `contact`, `terms` — each a server component reading its dictionary section and rendering inside `<Prose>` (max-width `68ch`, 18px, line-height 1.7).

- [ ] **Step 5: Verify**

Run: `npm run test && npm run build`
Expected: both pass; all six routes prerender for both languages.

Manually check each of the twelve URLs (`/hi/*` and `/en/*`) renders with no missing-key placeholders.

- [ ] **Step 6: Commit**

```bash
git add app/[lang] components/Prose.tsx dictionaries
git commit -m "feat: add bilingual content pages with constrained Ayurveda copy"
```

---

## Task 15: Booking wizard — date and slot selection

**Files:**
- Create: `app/[lang]/book/page.tsx`, `components/book/BookingWizard.tsx`, `components/book/DatePicker.tsx`, `components/book/SlotGrid.tsx`, `components/book/StepIndicator.tsx`

**Interfaces:**
- Consumes: `GET /api/availability`, `nextTuesdays`
- Produces: wizard state `{ step: 1|2|3|4, dateISO?, slotStart?, bookingCode? }`

- [ ] **Step 1: Build the step indicator**

Create `components/book/StepIndicator.tsx` — renders `t(d.book.step, { n })` plus a progress bar. Visible on every step, because non-technical users need to know how much is left.

- [ ] **Step 2: Build the date picker (step 1)**

`DatePicker` server-renders the next `bookingWindowWeeks` Tuesdays via `nextTuesdays()`, each as a large `<Card>` button showing the date and `t(d.book.slotsLeft, { n })`. A day with zero slots renders **disabled with `d.book.full`** — visibly present but unusable, never hidden. Hiding it would leave the user wondering whether the date exists.

- [ ] **Step 3: Build the slot grid (step 2)**

Create `components/book/SlotGrid.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatIstTime } from '@/lib/time'
import type { Dictionary, Lang } from '@/lib/i18n'

export function SlotGrid({ dateISO, lang, d, onPick }: {
  dateISO: string; lang: Lang; d: Dictionary; onPick: (iso: string) => void
}) {
  const [slots, setSlots] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSlots(null); setError(null)
    fetch(`/api/availability?date=${dateISO}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setSlots(j.slots.map((s: { start: string }) => s.start)) })
      .catch(() => { if (!cancelled) setError(d.errors.network) })
    return () => { cancelled = true }
  }, [dateISO, d.errors.network])

  if (error) return <p role="alert" className="text-lg">{error}</p>

  if (!slots) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    )
  }

  if (slots.length === 0) return <p className="text-lg">{d.book.full}</p>

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((iso, i) => (
        <button
          key={iso}
          onClick={() => onPick(iso)}
          style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          className="min-h-[56px] rounded-btn border-2 border-green-700 bg-white
                     text-lg font-semibold text-green-700
                     animate-[fadeIn_250ms_var(--ease-enter)_both]
                     motion-reduce:animate-none
                     transition-transform duration-150 active:scale-[0.97]
                     focus-visible:outline-saffron-500"
        >
          {formatIstTime(new Date(iso), lang)}
        </button>
      ))}
    </div>
  )
}
```

Add to `globals.css`:

```css
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 4: Build the wizard host**

`BookingWizard` is a client component holding the four-step state and rendering the right child. Selecting a slot advances to step 3; a back button returns to the previous step without losing earlier answers.

- [ ] **Step 5: Verify**

Run: `npm run dev`, open `/hi/book` at 375px.
Expected: four Tuesday cards; tapping one shows skeletons, then a slot grid that fades in over ≤300ms; every slot button ≥ 56px tall; the step indicator reads `चरण 2 / 4`.

Throttle to Slow 4G in devtools and confirm skeletons appear rather than a blank screen.

- [ ] **Step 6: Commit**

```bash
git add app/[lang]/book components/book app/globals.css
git commit -m "feat: add booking wizard date and slot selection"
```

---

## Task 16: Booking wizard — details, confirmation, and calendar invite

**Files:**
- Create: `components/book/DetailsForm.tsx`, `components/book/SignInGate.tsx`, `components/book/Confirmation.tsx`, `lib/ics.ts`, `tests/ics.test.ts`, `app/api/appointments/[id]/ics/route.ts`

**Interfaces:**
- Consumes: `POST /api/appointments`
- Produces: `buildIcs(a: { bookingCode, slotStart, slotEnd, summary, location }): string`

- [ ] **Step 1: Build the sign-in gate (step 3, part 1)**

Create `components/book/SignInGate.tsx`. Authentication is requested **only here**, after the patient has seen real availability:

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function SignInGate({ label, next }: { label: string; next: string }) {
  async function signIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }
  return <Button variant="primary" size="lg" onClick={signIn}>{label}</Button>
}
```

- [ ] **Step 2: Build the details form (step 3, part 2)**

`DetailsForm` collects name, age, gender, phone, reason, and the consent checkbox — **five fields plus consent, presented in one screen but visually grouped in two blocks** so no block exceeds four fields.

Requirements:
- Phone input: `inputMode="numeric"`, `autoComplete="tel"`, `maxLength={10}`
- Name: `autoComplete="name"`
- Consent checkbox is **unchecked by default** (DPDP requires explicit consent, never pre-ticked)
- Submit button reads `t(d.book.confirmCta, { time })` — it states the outcome
- On `409` show `d.errors.slotTaken` **and refresh the grid in place**, returning the user to step 2 with the date preserved
- On `422 already_booked` show `d.errors.alreadyBooked`
- On network failure show `d.errors.network`
- Never surface a status code or raw message to the user

- [ ] **Step 3: Write the `.ics` test**

Create `tests/ics.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildIcs } from '@/lib/ics'

const ics = buildIcs({
  bookingCode: 'K7M2QP',
  slotStart: new Date('2026-09-01T11:30:00.000Z'),
  slotEnd: new Date('2026-09-01T11:45:00.000Z'),
  summary: 'Arham Arogyam — appointment',
  location: 'C-39, Jyoti Marg, Bapu Nagar, Jaipur',
})

describe('buildIcs', () => {
  it('is a well-formed VCALENDAR', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('uses UTC timestamps', () => {
    expect(ics).toContain('DTSTART:20260901T113000Z')
    expect(ics).toContain('DTEND:20260901T114500Z')
  })

  it('carries the booking code as the UID', () => {
    expect(ics).toContain('UID:K7M2QP@arhamarogyam')
  })

  it('sets a reminder the day before', () => {
    expect(ics).toContain('TRIGGER:-PT24H')
  })

  it('uses CRLF line endings as the spec requires', () => {
    expect(ics).toContain('\r\n')
  })
})
```

- [ ] **Step 4: Run and watch it fail**

Run: `npm run test -- tests/ics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `.ics` generation**

Create `lib/ics.ts`:

```ts
interface IcsInput {
  bookingCode: string
  slotStart: Date
  slotEnd: Date
  summary: string
  location: string
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * The calendar invite is the strongest free reminder we have: the patient's
 * own phone fires it 24h ahead with no service, no quota, and no cost.
 */
export function buildIcs(a: IcsInput): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arham Arogyam//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${a.bookingCode}@arhamarogyam`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(a.slotStart)}`,
    `DTEND:${stamp(a.slotEnd)}`,
    `SUMMARY:${a.summary}`,
    `LOCATION:${a.location.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Booking code ${a.bookingCode}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${a.summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
```

Run: `npm run test -- tests/ics.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Serve the `.ics` file**

Create `app/api/appointments/[id]/ics/route.ts` — loads the appointment, checks ownership via `requireUser`, and returns `buildIcs(...)` with:

```ts
return new Response(ics, {
  headers: {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="arham-arogyam-${appt.bookingCode}.ics"`,
  },
})
```

- [ ] **Step 7: Build the confirmation screen (step 4)**

`Confirmation` shows the booking code large and copyable, the date and time in the active language, the address with a directions link, "what to bring", and an **Add to Calendar** link to the `.ics` route.

The single moment of delight — an SVG checkmark that draws itself in 400ms:

```tsx
<svg viewBox="0 0 52 52" className="mx-auto h-20 w-20" aria-hidden>
  <circle cx="26" cy="26" r="24" fill="none" stroke="var(--green-300)" strokeWidth="2" />
  <path
    d="M14 27l8 8 16-16" fill="none" stroke="var(--green-700)"
    strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
    style={{ strokeDasharray: 48, strokeDashoffset: 48,
             animation: 'drawCheck 400ms var(--ease-enter) 120ms forwards' }}
    className="motion-reduce:![stroke-dashoffset:0] motion-reduce:animate-none"
  />
</svg>
```

```css
@keyframes drawCheck { to { stroke-dashoffset: 0; } }
```

- [ ] **Step 8: Verify end to end**

Run: `npm run dev`. Complete a booking from `/hi/book`.
Expected: sign-in → form → `201` → confirmation with a 6-character code and the checkmark drawing in. Download the `.ics` and open it — the event lands on the right date at the right IST time, with a 24-hour reminder.

Try booking the same slot from a second browser: `d.errors.slotTaken` in Hindi, and the grid refreshes without the taken slot.

- [ ] **Step 9: Commit**

```bash
git add components/book lib/ics.ts tests/ics.test.ts app/api/appointments app/globals.css
git commit -m "feat: complete booking flow with confirmation and calendar invite"
```

---

## Task 17: My Appointments

**Files:**
- Create: `app/[lang]/my-appointments/page.tsx`, `components/appointments/AppointmentCard.tsx`, `components/ui/ConfirmDialog.tsx`, `app/api/account/delete/route.ts`

**Interfaces:**
- Consumes: `GET /api/appointments/mine`, cancel and reschedule routes

- [ ] **Step 1: Build the confirm dialog**

`ConfirmDialog` wraps `<dialog>` with a plain-language question, a destructive-styled confirm, and a cancel. Used for `d.book.cancelConfirm`. Focus moves into the dialog on open and returns to the trigger on close.

- [ ] **Step 2: Build the page**

Two sections, **upcoming first**. Each `AppointmentCard` shows the date, time, booking code, and status. Upcoming cards offer Cancel (via `ConfirmDialog`) and Reschedule (reopens the slot grid). Past cards are read-only and visually muted.

When there are no upcoming appointments, show an empty state with a link to `/${lang}/book` — never a blank page.

- [ ] **Step 3: Add account deletion (DPDP)**

`POST /api/account/delete` cancels all future appointments, anonymises past ones (`patientName` → "Deleted", `phone` → `''`, `reason` → `''`, keeping `slotStart` for the clinic's records), deletes the `app_user` row, and signs the user out. A link to it sits at the bottom of the page behind a `ConfirmDialog`.

- [ ] **Step 4: Verify**

Book, view under upcoming, cancel via the dialog, confirm it moves to past with `cancelled` status and the slot returns to `/api/availability`.

- [ ] **Step 5: Commit**

```bash
git add app/[lang]/my-appointments components/appointments components/ui/ConfirmDialog.tsx app/api/account
git commit -m "feat: add my-appointments with cancel, reschedule, and account deletion"
```

---

## Task 18: Admin portal — the daily list

The clinic's daily tool. It gets disproportionate polish because the biggest risk to this project is the clinic reverting to a paper register.

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/AppointmentRow.tsx`, `components/ui/Toast.tsx`, `app/api/admin/appointments/route.ts`, `app/api/admin/appointments/[id]/status/route.ts`

**Interfaces:**
- Produces: `GET /api/admin/appointments?date=` → `{ appointments: Appt[] }`; `POST /api/admin/appointments/:id/status` body `{ status }` → `200`

- [ ] **Step 1: Build the admin layout**

`app/admin/layout.tsx` calls `requireAdmin()` server-side and redirects on failure. **Middleware is not trusted alone.** The admin UI is English-only — the clinic staff using it are consistent, and this halves the surface.

- [ ] **Step 2: Build the status API**

```ts
const Body = z.object({ status: z.enum(['booked','arrived','completed','no_show','cancelled']) })
```

Requires `requireAdmin()`, updates the appointment, writes an `auditLog` row, returns the previous status in the response so the client can offer undo.

- [ ] **Step 3: Build the toast with undo**

`Toast` slides up 16px with a fade, auto-dismisses after 5s, is dismissible sooner, and carries an optional Undo action. `role="status"` and `aria-live="polite"`.

- [ ] **Step 4: Build the appointment row**

Large touch rows — the vaidya is standing up mid-clinic:

- Time (large, bold) · patient name · age · reason
- Phone as a `tel:` link, ≥ 48px
- A `wa.me` button: `https://wa.me/91${phone}?text=${encodeURIComponent(message)}` — the free WhatsApp path, sent manually by the clinic
- Status buttons: **Arrived · Done · No-show · Cancel**
- **One tap, no confirm dialog** — the change applies immediately and a toast offers Undo for 5 seconds. Speed matters more than confirmation here, and reversibility beats interruption.
- **No swipe gestures.** They are undiscoverable for this audience.

- [ ] **Step 5: Handle degraded networks**

Cache the last successful list in `sessionStorage`. If a refetch fails, keep the cached rows on screen with a banner reading "Showing saved list — check your connection." **Never blank the screen mid-clinic.**

- [ ] **Step 6: Verify**

Sign in as the admin user (promoted in Task 8). Open `/admin` at 375px.
Expected: this Tuesday's bookings; tapping "Done" updates instantly with an Undo toast; Undo restores the previous status. Turn off Wi-Fi and reload — the cached list stays with the banner.

Sign in as a patient and open `/admin`. Expected: redirected away.

- [ ] **Step 7: Commit**

```bash
git add app/admin components/admin components/ui/Toast.tsx app/api/admin
git commit -m "feat: add admin daily appointment list with undo"
```

---

## Task 19: Admin portal — schedule, walk-ins, patients, export

**Files:**
- Create: `app/admin/{schedule,walk-in,patients}/page.tsx`, `app/api/admin/blackout/route.ts`, `app/api/admin/settings/route.ts`, `app/api/admin/walk-in/route.ts`, `app/api/admin/export/route.ts`

**Interfaces:**
- Produces: `POST|DELETE /api/admin/blackout`; `PATCH /api/admin/settings`; `POST /api/admin/walk-in`; `GET /api/admin/export.csv`

- [ ] **Step 1: Build blackout management**

`/admin/schedule` lists upcoming Tuesdays with a "Block this day" action (whole-day blackout, reason required) and per-slot blocking (partial blackout).

`POST /api/admin/blackout` requires `requireAdmin()`, validates with Zod, writes an audit row.

**Guard:** if the date already has non-cancelled appointments, respond `409 { error: 'has_bookings', count }`. The UI then warns "3 patients have booked this day. Cancel them first?" and offers to cancel-and-block in one action. Silently orphaning bookings would be the worst possible failure here.

- [ ] **Step 2: Build settings editing**

`PATCH /api/admin/settings` accepts `slotMinutes`, `bookingWindowWeeks`, `minLeadHours`, `cancelWindowHours`, `maxOpenPerUser`, `consultationFee`, and the Tuesday `availability` start and end times.

```ts
const Body = z.object({
  slotMinutes: z.number().int().min(5).max(120).optional(),
  bookingWindowWeeks: z.number().int().min(1).max(12).optional(),
  minLeadHours: z.number().int().min(0).max(72).optional(),
  cancelWindowHours: z.number().int().min(0).max(72).optional(),
  maxOpenPerUser: z.number().int().min(1).max(5).optional(),
  consultationFee: z.number().int().min(0).max(100000).optional(),
})
```

The UI explains the consequence in plain English beside the slot-length field: *"Changing this affects new bookings only. Appointments already booked keep their original times."* That is exactly what the overlap logic in Task 7 guarantees.

- [ ] **Step 3: Build walk-in entry**

`/admin/walk-in` — the accessibility escape hatch for patients with no smartphone. Same fields as the public form, but `userId` is null and `source: 'walk_in'`. It bypasses `maxOpenPerUser` and `minLeadHours` (the patient is standing there) but **still passes through the exclusion constraint**, so a walk-in can never double-book either. On `409`, show "That time is already taken."

- [ ] **Step 4: Build patient search**

`/admin/patients` — search by phone or name, showing visit history grouped by patient phone number. Read-only.

- [ ] **Step 5: Build CSV export**

`GET /api/admin/export.csv?from=&to=` streams a CSV of appointments in the range. Quote every field and escape embedded quotes — a reason field containing a comma must not break the file.

```ts
const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
```

- [ ] **Step 6: Verify**

Block a Tuesday that has bookings → expect the 409 warning, not a silent block. Change slot length from 15 to 20 → existing bookings keep their times and `/api/availability` routes around them. Add a walk-in for an already-taken slot → rejected. Export a CSV and open it in a spreadsheet — columns line up, a comma in a reason field does not break a row.

- [ ] **Step 7: Commit**

```bash
git add app/admin app/api/admin
git commit -m "feat: add admin schedule, walk-in, patient search, and CSV export"
```

---

## Task 20: Email confirmation and reminder

**Files:**
- Create: `lib/email.ts`, `app/api/cron/reminders/route.ts`, `.github/workflows/reminders.yml`, `tests/email.test.ts`
- Modify: `app/api/appointments/route.ts`

**Interfaces:**
- Produces: `sendBookingConfirmation(appt, lang)`, `sendReminder(appt, lang)`

- [ ] **Step 1: Set up Resend**

Manually: create a Resend account on the **clinic-owned** email. Add the domain and its SPF and DKIM records in Cloudflare DNS. Without this, mail lands in spam. Put the API key in `RESEND_API_KEY`.

```bash
npm i resend
```

- [ ] **Step 2: Write the email module**

`lib/email.ts` builds bilingual HTML from the dictionaries — **every string comes from `hi.json`/`en.json`, none inline** — and attaches the `.ics` from `buildIcs()`.

```ts
import { Resend } from 'resend'
import { buildIcs } from '@/lib/ics'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmation(appt: ApptForEmail, lang: Lang) {
  if (!process.env.RESEND_API_KEY) return   // no-op in local dev
  await resend.emails.send({
    from: 'Arham Arogyam <noreply@arhamarogyam.in>',
    to: appt.email,
    subject: /* from dictionary */,
    html: /* from dictionary */,
    attachments: [{
      filename: `arham-arogyam-${appt.bookingCode}.ics`,
      content: Buffer.from(buildIcs(appt)).toString('base64'),
    }],
  })
}
```

- [ ] **Step 3: Send on booking without blocking the response**

In `app/api/appointments/route.ts`, after the successful create:

```ts
// Fire-and-forget: a mail failure must never fail a confirmed booking.
sendBookingConfirmation({ ...appointment, email: user.email }, lang)
  .catch((err) => console.error('confirmation email failed', err))
```

- [ ] **Step 4: Build the reminder cron**

`app/api/cron/reminders/route.ts` finds appointments with `status = 'booked'` starting between 20 and 28 hours from now and sends a reminder to each. Guard it with a shared secret:

```ts
if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
  return new Response('unauthorized', { status: 401 })
}
```

Create `.github/workflows/reminders.yml` running daily at 03:30 UTC (09:00 IST, the morning before Tuesday) that `curl`s the endpoint with the secret from repository secrets.

- [ ] **Step 5: Write the email test**

`tests/email.test.ts` asserts the subject and body strings resolve from both dictionaries with no `{placeholder}` left unreplaced, and that the `.ics` attachment is valid base64 that decodes to a string starting `BEGIN:VCALENDAR`.

- [ ] **Step 6: Verify**

Run: `npm run test -- tests/email.test.ts`
Expected: PASS.

Book a real appointment against a live `RESEND_API_KEY`. Expected: an email arrives in **inbox, not spam**, with the `.ics` attached and the calendar event landing at the right IST time.

Trigger the cron manually with the secret header; confirm a reminder is sent for a booking ~24h out and that a second run does not double-send.

- [ ] **Step 7: Commit**

```bash
git add lib/email.ts app/api/cron .github/workflows/reminders.yml tests/email.test.ts app/api/appointments
git commit -m "feat: add email confirmation and day-before reminder"
```

---

## Task 21: Abuse protection and security headers

**Files:**
- Create: `lib/ratelimit.ts`, `components/book/TurnstileWidget.tsx`, `tests/ratelimit.test.ts`
- Modify: `app/api/appointments/route.ts`, `next.config.ts`, `middleware.ts`

**Interfaces:**
- Produces: `checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean>`; `verifyTurnstile(token: string, ip: string): Promise<boolean>`

- [ ] **Step 1: Write the rate-limit test**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, __resetRateLimits } from '@/lib/ratelimit'

describe('checkRateLimit', () => {
  beforeEach(() => __resetRateLimits())

  it('allows requests up to the limit', async () => {
    for (let i = 0; i < 3; i++) expect(await checkRateLimit('k', 3, 60_000)).toBe(true)
  })

  it('blocks the request past the limit', async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit('k', 3, 60_000)
    expect(await checkRateLimit('k', 3, 60_000)).toBe(false)
  })

  it('keeps separate keys independent', async () => {
    for (let i = 0; i < 3; i++) await checkRateLimit('a', 3, 60_000)
    expect(await checkRateLimit('b', 3, 60_000)).toBe(true)
  })
})
```

- [ ] **Step 2: Implement the limiter**

A fixed-window in-memory counter. At ~200 requests/day across one or two serverless instances this is sufficient, and it adds no dependency and no vendor lock-in.

```ts
const buckets = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count++
  return true
}

export function __resetRateLimits() { buckets.clear() }
```

Run: `npm run test -- tests/ratelimit.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 3: Add Turnstile**

Create a free Cloudflare Turnstile site key. Render the widget in `DetailsForm`; verify the token server-side in `POST /api/appointments`:

```ts
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  })
  return (await res.json()).success === true
}
```

Reject with `403 { error: 'failed_verification' }`.

- [ ] **Step 4: Apply the limits**

In `POST /api/appointments`, before any work: 5 bookings per hour per IP, and 3 per hour per phone number. In `GET /api/availability`: 60 per minute per IP. On the admin sign-in path: 10 attempts per 15 minutes per IP.

- [ ] **Step 5: Add security headers**

In `next.config.ts`:

```ts
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https:",
          "frame-src https://challenges.cloudflare.com https://www.google.com",
          "connect-src 'self' https://*.supabase.co",
        ].join('; ') },
    ],
  }]
}
```

- [ ] **Step 6: Verify**

Run: `npm run test && npm run build`
Expected: both pass.

Submit the booking form 6 times in an hour from one IP → the 6th returns `429` with `d.errors.generic`, not a crash. Submit with a tampered Turnstile token → `403`. Check headers with `curl -I` on the deployed URL. Confirm the site still renders — a CSP that blocks your own fonts is the usual mistake here.

- [ ] **Step 7: Commit**

```bash
git add lib/ratelimit.ts components/book/TurnstileWidget.tsx next.config.ts tests/ratelimit.test.ts app/api
git commit -m "feat: add Turnstile, rate limiting, and security headers"
```

---

## Task 22: Error handling, accessibility, and performance gates

**Files:**
- Create: `app/[lang]/error.tsx`, `app/[lang]/not-found.tsx`, `app/global-error.tsx`, `instrumentation.ts`, `sentry.*.config.ts`, `tests/e2e/booking.spec.ts`, `tests/e2e/a11y.spec.ts`, `lighthouserc.json`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: CI that fails on a broken test, a critical a11y violation, or a blown performance budget

- [ ] **Step 1: Add error boundaries**

`app/[lang]/error.tsx` renders `d.errors.generic` with a "try again" button and a link home. It never shows a stack trace. Because it is per-route-segment, a crash in the services page cannot take down booking.

`app/[lang]/not-found.tsx` — a friendly bilingual 404 linking to home and booking.

- [ ] **Step 2: Add Sentry**

```bash
npx @sentry/wizard@latest -i nextjs
```

Set `tracesSampleRate: 0.1` to stay inside the free tier. Scrub PII: strip `patientName`, `phone`, and `reason` in `beforeSend` — patient data must never leave for a third-party error service.

- [ ] **Step 3: Write the E2E booking test**

`tests/e2e/booking.spec.ts` walks: home → book → pick Tuesday → pick slot → (mocked auth) → fill form → confirm → booking code visible. Then cancel from `/my-appointments` and assert the slot returns to the grid.

- [ ] **Step 4: Write the accessibility test**

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = ['/hi', '/hi/about', '/hi/services', '/hi/ayurveda',
                '/hi/contact', '/hi/book', '/en', '/en/book']

for (const route of ROUTES) {
  test(`${route} has no critical a11y violations`, async ({ page }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa']).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(critical).toEqual([])
  })
}
```

```bash
npm i -D @axe-core/playwright
```

- [ ] **Step 5: Add the performance budget**

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": { "url": ["http://localhost:3000/hi", "http://localhost:3000/hi/book"],
                 "settings": { "preset": "perf", "throttlingMethod": "simulate" } },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
        "total-byte-weight": ["error", { "maxNumericValue": 307200 }]
      }
    }
  }
}
```

- [ ] **Step 6: Wire up CI**

`.github/workflows/ci.yml` on push and pull request: install → `npm run test` → `npm run build` → `npx playwright test` → `npx @lhci/cli autorun`. All four must pass.

- [ ] **Step 7: Verify**

Run: `npm run test && npm run build && npm run e2e && npx @lhci/cli autorun`
Expected: all green. If the performance budget fails, the usual causes are an unoptimised hero image or Framer Motion landing in the initial bundle — check that it is dynamically imported.

- [ ] **Step 8: Commit**

```bash
git add app/[lang]/error.tsx app/[lang]/not-found.tsx app/global-error.tsx sentry.*.config.ts instrumentation.ts tests/e2e lighthouserc.json .github/workflows/ci.yml
git commit -m "feat: add error boundaries, Sentry, and CI accessibility and performance gates"
```

---

## Task 23: Backups, monitoring, and launch

**Files:**
- Create: `.github/workflows/backup.yml`, `app/api/health/route.ts`, `app/sitemap.ts`, `app/robots.ts`, `docs/HANDOVER-hi.md`

**Interfaces:**
- Produces: a nightly off-platform database backup; a health endpoint; indexing controls

- [ ] **Step 1: Add the health endpoint**

`app/api/health/route.ts` runs `SELECT 1` through Prisma and returns `{ ok: true }` or a 503. This is what UptimeRobot pings — and the ping is also what stops Supabase pausing the project after 7 idle days.

- [ ] **Step 2: Add the nightly backup**

**Supabase's free tier has no backups. This is not optional.**

`.github/workflows/backup.yml`, daily at 20:00 UTC (01:30 IST):

```yaml
name: nightly-backup
on:
  schedule: [{ cron: '0 20 * * *' }]
  workflow_dispatch:

jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install postgresql-client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client
      - name: Dump
        env:
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: |
          mkdir -p backups
          pg_dump "$DIRECT_URL" --no-owner --no-acl \
            | gzip > "backups/$(date -u +%Y-%m-%d).sql.gz"
          # Keep 30 days.
          ls -1t backups/*.sql.gz | tail -n +31 | xargs -r rm --
      - name: Commit
        run: |
          git config user.name  "backup-bot"
          git config user.email "backup-bot@users.noreply.github.com"
          git add backups
          git diff --staged --quiet || git commit -m "chore: backup $(date -u +%F)"
          git push
```

The repository must be **private** — it now holds patient data.

- [ ] **Step 3: Verify the backup restores**

A backup you have never restored is not a backup.

```bash
gh workflow run backup.yml
# wait, then pull the artifact and restore into a scratch local database
createdb arham_restore_test
gunzip -c backups/<date>.sql.gz | psql arham_restore_test
psql arham_restore_test -c 'SELECT count(*) FROM appointment;'
```

Expected: the row count matches production. Drop the scratch database afterwards.

- [ ] **Step 4: Add monitoring**

UptimeRobot (free): HTTP monitor on `/api/health`, 5-minute interval, alerting to Samyak's email. Verify it fires by temporarily breaking the endpoint.

- [ ] **Step 5: Add sitemap and robots**

`app/sitemap.ts` lists all public routes in both languages, built from `NEXT_PUBLIC_SITE_URL`.

`app/robots.ts`:

```ts
export default function robots() {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'
  return {
    rules: allow
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

- [ ] **Step 6: Enable Renovate**

Dependency rot is the most likely way this project dies quietly. Create
`renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["before 6am on the first day of the month"],
  "labels": ["dependencies"],
  "packageRules": [
    { "matchUpdateTypes": ["minor", "patch"], "automerge": true },
    { "matchUpdateTypes": ["major"], "automerge": false }
  ]
}
```

Install the Renovate GitHub App on the **personal** repository only — never
org-wide. Minor and patch updates automerge once CI passes; majors open a PR
for review.

- [ ] **Step 7: Write the Hindi handover guide**

`docs/HANDOVER-hi.md`, one page, **in Hindi**, covering: how to open `/admin` and sign in · how to read Tuesday's list · how to mark a patient आया / हो गया / नहीं आया · how to add a walk-in · how to block a day · who to call when something breaks. Written for someone who has never used an admin panel.

- [ ] **Step 8: Launch**

Ordered, because indexing must come last:

1. Buy `arhamarogyam.in`; transfer to Cloudflare Registrar after the first year.
2. Point DNS at Netlify; add the custom domain; wait for SSL to provision.
3. Add the new origin to Google OAuth authorised redirect URIs **and** Supabase's URL allow-list.
4. Update `NEXT_PUBLIC_SITE_URL` to the real origin.
5. Set `NEXT_PUBLIC_ALLOW_INDEXING=true`. **Only now.**
6. Redeploy and verify `/robots.txt` allows crawling and `/sitemap.xml` shows the real domain.
7. Verify the domain in Resend; send a test email and confirm inbox delivery.
8. Create the Google Business Profile for the clinic and link the booking page — for a local clinic this drives more patients than the website itself.
9. Transfer every account credential to the clinic-owned email; confirm recovery access works.
10. Run one real end-to-end booking on production and cancel it.

- [ ] **Step 9: Verify the launch**

Run: `curl -s https://arhamarogyam.in/robots.txt`
Expected: `Allow: /` with `/admin` and `/api` disallowed.

Run Lighthouse against the production URL. Expected: performance ≥ 90, accessibility ≥ 95.

Confirm `/hi` and `/en` both render, sign-in works on the real domain, and a booking completes with an email delivered to the inbox.

- [ ] **Step 10: Commit**

```bash
git add renovate.json .github/workflows/backup.yml app/api/health app/sitemap.ts app/robots.ts docs/HANDOVER-hi.md
git commit -m "feat: add backups, health monitoring, and launch configuration"
```

---

## Post-Launch Maintenance

Not a task — a standing commitment, agreed with the clinic upfront so it is not a surprise.

- **Quarterly:** merge Renovate PRs, rebuild, redeploy. A Next.js app untouched for two years will not build.
- **Quarterly:** confirm a backup restores into a scratch database.
- **Annually:** renew the domain; re-check that every account still sits on the clinic-owned email.

Budget roughly two hours every six months, indefinitely.
