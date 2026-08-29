# अर्हम् आरोग्यम् — Arham Arogyam Booking Platform
## Design Specification

**Date:** 2026-08-30
**Author:** Samyak Jain
**Client:** Arham Arogyam — Bapu Nagar Aushdhalay, Jaipur
**Practitioner:** Vaidya Rahul Jain (वैद्य राहुल जी जैन)
**Status:** Approved design — ready for implementation planning

---

## 1. Overview

A bilingual (Hindi/English) website for Arham Arogyam, a community Ayurvedic
clinic in Bapu Nagar, Jaipur, with online appointment booking and an admin
portal for the clinic.

The clinic operates **every Tuesday, 5:00 PM – 10:00 PM**, staffed by a single
practitioner. At a 15-minute slot length that is roughly **20 bookings per
week**. The system is therefore designed for correctness, clarity, and
near-zero running cost — not for scale.

### Goals

1. A patient with a mid-range Android phone on 4G can book a slot in under 60 seconds.
2. The clinic can run its Tuesday session entirely from a phone, without calling Samyak.
3. Total running cost stays at ₹0/month plus a domain (~₹1,000/year).
4. The platform survives 5 years with roughly 2 hours of maintenance every 6 months.
5. It is impossible to double-book a slot.

### Non-Goals (explicitly out of v1)

Online payments · SMS or WhatsApp automation · patient medical records,
prescriptions, or history · multiple practitioners · video consultation ·
reviews and ratings · blog or CMS · multiple branches · native mobile app.

Each is additive later without a rewrite. **Medical records are deliberately
excluded** — storing diagnoses or prescriptions moves the project into a much
heavier compliance bracket under India's DPDP Act 2023.

### Hard Constraints

- **Personal GitHub account only.** Nothing in this project touches the
  SolFoundry organisation — not the repo, not CI, not any credential, not the
  git commit identity. The repository-local `user.email` MUST be set to a
  personal address before the first commit.
- **Every third-party account (domain, DNS, database, hosting, email) is
  registered to a clinic-owned email address**, with the clinic holding
  recovery access. Not a personal Gmail. This is a handover requirement, not a
  nicety.
- Free tiers only. Paid services require explicit clinic approval.

---

## 2. Users

| User | Context | Primary need |
|---|---|---|
| **Patient / family member** | Mid-range Android, patchy 4G, often elderly or booking on an elder's behalf. Arrives via a WhatsApp forward or Google search. | Find the clinic, see when it is open, book a slot fast |
| **Vaidya Rahul Jain / clinic staff** | Phone, standing up, between patients | See who is next, mark them done, add a walk-in, block a day |
| **Search engines** | — | Understand this is an Ayurvedic clinic in Bapu Nagar, Jaipur |

**Design for the first row.** Every trade-off resolves in favour of a
non-technical patient on a slow phone.

---

## 3. Brand & Visual Design System

Derived from the clinic logo: a tri-colour ring (gold, magenta, green) around a
green tree of life, a saffron kalash bearing swastik motifs, and a conch, with
the wordmark **अर्हम् आरोग्यम्** in magenta.

### 3.1 Colour tokens

```
--green-900:   #14401A    deepest — display headings
--green-700:   #1B5E20    primary brand
--green-500:   #2E7D32    interactive green
--green-300:   #66BB6A    illustration / leaf accents
--green-50:    #EDF5EE    tinted surfaces

--saffron-600: #C96A10    CTA text-on-light, hover
--saffron-500: #E8871E    PRIMARY CALL TO ACTION
--saffron-100: #FDF0DC    soft highlight fills

--magenta-600: #D81B60    wordmark, section eyebrows only
--magenta-50:  #FCE4EC    rare accent fill

--gold-500:    #F2C230    ring / divider accent only

--cream:       #FFFCF5    page background
--surface:     #FFFFFF    cards
--ink:         #1C1917    body text
--ink-muted:   #57534E    secondary text
--border:      #E7E2D8    hairlines
```

### 3.2 The 60/25/10/5 rule

A three-colour logo becomes garish the moment the three colours are used at
equal weight. Enforced ratio:

- **60% cream** — page ground, whitespace
- **25% green** — headings, nav, structural elements, illustration
- **10% saffron** — calls to action and nothing else
- **5% magenta** — the wordmark, section eyebrows, and the active language pill

Gold appears only as a thin divider rule echoing the logo ring. **The full
tri-colour ring is used exactly once per page, in the logo itself.**

### 3.3 Typography

| Role | Devanagari | Latin | Size |
|---|---|---|---|
| Display | Noto Serif Devanagari 700 | Fraunces 600 | `clamp(2rem, 5vw, 3.25rem)` |
| Heading | Noto Serif Devanagari 600 | Fraunces 600 | `clamp(1.5rem, 3vw, 2rem)` |
| Body | Noto Sans Devanagari 400 | Inter 400 | **18px** minimum |
| Small | Noto Sans Devanagari 400 | Inter 400 | 16px floor — never below |

All four faces from Google Fonts, `font-display: swap`, preloaded, subset to
Devanagari + Latin. **18px body, not 16px** — the audience skews elderly.

Line height 1.7 for Devanagari body (conjuncts need vertical room), 1.6 Latin.
Measure capped at 68 characters.

### 3.4 Shape and depth

- Radius: 20px cards, 12px buttons, 8px inputs — generous and friendly, not clinical
- Shadows warm-tinted, never grey: `0 4px 20px rgba(20, 64, 26, 0.08)`
- Spacing on an 8pt scale; section padding `clamp(3rem, 8vw, 6rem)`
- Content max-width 1140px; prose max-width 680px

### 3.5 Imagery

Real photographs of the centre and of Vaidya Rahul Jain (with his written
consent) over stock imagery. Served as AVIF with WebP fallback, lazy-loaded
below the fold, explicit `width`/`height` on every image to prevent layout
shift.

---

## 4. UX Principles

The users are not technically sound. These are rules, not suggestions.

1. **One primary action per screen.** The home page has exactly one prominent
   button: *अपॉइंटमेंट बुक करें*.
2. **Maximum four fields per form screen.** The booking form is split across
   steps rather than presented as one long page.
3. **Buttons state their outcome.** *"शाम 5:30 बजे का समय बुक करें"* — never
   *Submit*, *Continue*, or *OK*.
4. **Visible progress.** *चरण 2 / 4* on every booking step.
5. **Errors in plain Hindi, with the fix.** *"यह समय अभी-अभी किसी और ने बुक कर
   लिया। कृपया दूसरा समय चुनें।"* Never a code, never a stack trace, never the
   word "error".
6. **No hamburger menu on mobile.** A sticky bottom bar with three
   thumb-reachable destinations: होम · बुक करें · मेरी अपॉइंटमेंट.
7. **Tap targets ≥ 48×48px**, spaced ≥ 8px apart.
8. **Nothing important behind hover.** Touch devices have no hover.
9. **The phone field opens a numeric keypad** (`inputmode="numeric"`) and
   auto-formats.
10. **One-handed operation throughout.** Primary actions in the lower third of
    the viewport.
11. **Destructive actions confirm in plain language** — *"क्या आप वाकई यह
    अपॉइंटमेंट रद्द करना चाहते हैं?"*
12. **No carousels, no autoplay video, no parallax, no scroll-jacking.** These
    break on cheap Android and confuse non-technical users.

### Admin-specific

- Large rows, explicit buttons, **no swipe gestures** — they are undiscoverable.
- Status changes are one tap with an **undo toast**, not a confirm dialog.
  Speed matters mid-clinic; reversibility beats confirmation.
- The list tolerates a dropped network: last-fetched data stays on screen with
  a "showing saved list" banner rather than blanking out.

### Accessibility

WCAG 2.2 AA. Contrast ≥ 4.5:1 for all text (saffron `#E8871E` on cream fails
this for text — it is used for **button fills with white text only**, never as
text on cream). Visible focus rings. Semantic HTML. Alt text and ARIA labels in
the active language. Full keyboard operability.

---

## 5. Motion & Animation

Modern and alive, but **motion never blocks, hides, or delays the booking
flow**.

### 5.1 Global rules

- **`prefers-reduced-motion: reduce` disables all transform and scroll-driven
  motion**, leaving opacity fades only. Non-negotiable.
- Durations — micro 150ms · standard 250ms · section entrance 400ms. Nothing
  exceeds 600ms.
- Easing — entrances `cubic-bezier(0.22, 1, 0.36, 1)`; exits
  `cubic-bezier(0.4, 0, 1, 1)`.
- **No page-transition animations.** On 4G, instant navigation beats animated
  navigation.
- Content is never hidden pending an animation. Scroll-reveal elements start at
  `opacity: 0.001`, not `display: none`, and a `<noscript>` style block reveals
  everything if JS fails.

### 5.2 Specific animations

| Where | What | Duration |
|---|---|---|
| Hero, on load | Logo scales `0.96 → 1` with a fade; the wordmark fades up 12px, 80ms later | 600ms, once |
| Hero tree | Leaf clusters fade in staggered 60ms apart (SVG groups) | 700ms total, once |
| Section entrances | Fade + 16px rise via IntersectionObserver, fires once | 400ms |
| Buttons | Press scales to `0.97`; hover lifts 2px with a deepened shadow | 150ms |
| Slot grid | Slots fade in staggered 30ms apart, capped at 300ms total | ≤300ms |
| Slot selection | Selected slot fills saffron, scales `1 → 1.04 → 1` | 250ms |
| Loading | **Skeleton shimmer, never spinners** — a shimmer communicates "nearly there" | — |
| Booking confirmed | A single SVG checkmark draws on with `stroke-dashoffset` | 400ms |
| Language toggle | Cross-fade of the text layer only; layout never reflows | 200ms |
| Admin status change | Row tints green then settles; undo toast slides up | 250ms |
| Toasts | Slide up 16px with fade; auto-dismiss after 5s, dismissible sooner | 250ms |

The confirmation checkmark is the single deliberate moment of delight. Everything
else is quiet.

### 5.3 Implementation and budget

CSS-first. `Framer Motion` is used **only** for the slot-grid stagger and the
confirmation sequence, imported dynamically so it stays out of the initial
bundle.

Performance budget, enforced in CI with Lighthouse CI:

- LCP < 2.5s on simulated Slow 4G
- CLS < 0.05 · INP < 200ms
- Initial JS < 150KB gzipped
- Any single page < 300KB total

---

## 6. Information Architecture

### 6.1 Public routes (no authentication)

| Route | Contents |
|---|---|
| `/[lang]` | Hero (logo, name, tagline, timing badge, primary CTA) · trust strip (Vaidya photo, name, registration number) · 6–8 service cards · "How it works" in 3 steps · timings · address with map · disclaimer · footer |
| `/[lang]/about` | The community-service mission; who Vaidya Rahul Jain is; why affordable access matters |
| `/[lang]/services` | General health checkups · basic health consultation · consultation with the Vaidya · health and wellness guidance · diet and lifestyle guidance · basic Ayurvedic guidance · guidance on common health concerns · preventive-care advice · simple Ayurvedic and herbal remedies where appropriate · affordable community consultation |
| `/[lang]/ayurveda` | Categories only — Ayurvedic medicines, herbal remedies, natural ingredients, lifestyle guidance, diet recommendations, preventive advice |
| `/[lang]/contact` | Address (C-39, Jyoti Marg, Bapu Nagar, Jaipur), embedded map, tap-to-call, timings, directions |
| `/[lang]/privacy` | DPDP-compliant notice — what is collected, why, retention, deletion |
| `/[lang]/terms` | Terms and medical disclaimer |

**The `/ayurveda` page carries a hard content constraint.** It names no medical
conditions, makes no therapeutic claims, and recommends nothing automatically.
Its required wording:

> "Ayurvedic medicines and remedies may be recommended after consultation with
> the Vaidya, depending on individual requirements. Please consult the Vaidya
> before taking any medicine or remedy."
>
> "आयुर्वेदिक औषधियाँ एवं उपचार वैद्य जी से परामर्श के बाद, व्यक्तिगत
> आवश्यकतानुसार सुझाए जा सकते हैं। कृपया कोई भी औषधि या उपचार लेने से पहले
> वैद्य जी से परामर्श अवश्य करें।"

A site-wide footer disclaimer states that the service is not for medical
emergencies and that no medical advice is provided online.

### 6.2 Booking flow

Authentication is required **only at step 3**, so a patient can see real
availability before being asked to sign in.

| Step | Screen |
|---|---|
| 1 | Choose a Tuesday — the next 4 as cards, each showing "12 समय उपलब्ध" |
| 2 | Slot grid — 5:00, 5:15, 5:30 … booked slots visibly disabled, not hidden |
| 3 | **Sign in with Google** (one tap), then name, age, gender, reason for visit |
| 4 | Confirmed — booking code, **Add to Calendar**, directions, what to bring |

`/[lang]/my-appointments` — upcoming and past visits, with cancel and
reschedule.

### 6.3 Admin routes (`/admin/*`, authenticated, role = admin)

| Route | Purpose |
|---|---|
| `/admin` | This Tuesday's list. Rows: time · name · age · tap-to-call phone · reason · status. One-tap **Arrived / Done / No-show / Cancel**, plus a `wa.me` button opening a pre-filled WhatsApp message |
| `/admin/schedule` | Block a single slot · block a whole day (festival, travel) · change clinic hours · **change slot length** |
| `/admin/walk-in` | Register a patient who arrived without booking, or who has no smartphone |
| `/admin/patients` | Search by phone or name; visit history |
| `/admin/export` | CSV download |

### 6.4 Content ownership

The split that determines whether this survives handover:

| Content | Stored in | Edited by | Rationale |
|---|---|---|---|
| Page copy (hi/en), service list, disclaimers | Git repo, `dictionaries/*.json` | Samyak, via commit | Changes ~twice a year; a CMS is one more thing to break |
| Photos, logo | Git repo, `/public` | Samyak | A handful of assets |
| **Clinic hours, slot length, blackout dates, consultation fee, cancellation window** | **Database** | **The clinic, via `/admin`** | Changes often. The clinic must never need a developer to say "closed next Tuesday" |
| Appointments, patients | Database | The clinic, via `/admin` | |
| API keys, DB credentials | Host environment variables | Samyak | Never in git |

---

## 7. Data Model

```
app_user
  id, google_sub, email, name, phone,
  role ENUM('patient','admin') DEFAULT 'patient',
  created_at

settings                        -- singleton row
  slot_minutes            DEFAULT 15
  booking_window_weeks    DEFAULT 4
  min_lead_hours          DEFAULT 2
  cancel_window_hours     DEFAULT 4
  max_open_per_user       DEFAULT 1
  consultation_fee

availability                    -- seeded: weekday=2, 17:00–22:00
  id, weekday, start_time, end_time, active

blackout
  id, date, start_time NULL, end_time NULL, reason
  -- NULL times mean the entire day is blocked

appointment
  id, booking_code, user_id FK, patient_name, phone, age, gender, reason,
  slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ,
  status ENUM('booked','arrived','completed','no_show','cancelled'),
  source ENUM('online','walk_in'),
  created_at, updated_at

audit_log
  id, actor_id, action, entity, entity_id, at, metadata JSONB
```

**`availability` is a table, not a constant.** The day the clinic adds
Saturdays, that is a row insert — not a code change and a deploy.

`booking_code` is 6 characters drawn from an unambiguous alphabet
(`ABCDEFGHJKMNPQRSTUVWXYZ23456789` — no O/0, I/1) and is random, never
sequential.

---

## 8. The Slot Engine

`lib/slots.ts` — pure functions with no I/O, which makes it exhaustively
testable. This is where scheduling bugs live, so it is the most-tested file in
the project.

`getAvailableSlots(date, rules, blackouts, existingAppointments, settings)`:

1. Select `availability` rules matching the date's weekday.
2. Generate candidate slots from `start_time` to `end_time`, stepping
   `settings.slot_minutes`.
3. Drop slots falling within `settings.min_lead_hours` of now.
4. Drop slots covered by a `blackout` (whole-day, or overlapping its time range).
5. **Drop slots that _overlap_ any existing non-cancelled appointment.**
6. Return the remainder.

**Step 5 is overlap-based, not equality-based, and that is load-bearing.**
Because slot length is admin-configurable, an appointment booked at 15-minute
granularity can straddle two slots after the admin switches to 20 minutes. An
equality check would silently offer a slot that partially overlaps a real
booking. Overlap comparison is the only correct test.

Changing `slot_minutes` never rewrites existing appointments — they keep their
stored `slot_start`/`slot_end`, and the generator routes around them.

**Time handling:** all timestamps are `TIMESTAMPTZ` stored in UTC and rendered
in `Asia/Kolkata`. India observes no DST, which removes the worst category of
scheduling bug, but slot generation still converts explicitly rather than
relying on server locale.

---

## 9. Correctness: No Double-Booking

Enforced by the database, not by application code.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointment ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (tstzrange(slot_start, slot_end) WITH &&)
  WHERE (status <> 'cancelled');
```

When two patients confirm the same slot in the same second, Postgres rejects
one. The API catches the exclusion violation and returns `409` with a
plain-language message; the UI refreshes the grid in place and asks them to
pick again.

A `SELECT`-then-`INSERT` check in application code cannot do this correctly
under concurrency. It will appear to work in testing and fail in production.

---

## 10. Authentication & Authorization

**Patients** sign in with Google via Supabase Auth. Free, unlimited at this
scale, and one tap on an Android device where the account is already present —
lower friction than typing an OTP, and with no SMS cost and no TRAI DLT
registration.

On first sign-in, upsert an `app_user` row keyed by email. **This is our own
table, not merely Supabase's** — so identities survive a future migration off
Supabase Auth.

**Admins** are `app_user` rows with `role = 'admin'`, not a separate system.
`/admin/*` is guarded in `middleware.ts`, and every admin API route re-checks
the role server-side. Middleware alone is never trusted.

**Row Level Security** is enabled on every table. A patient may read only their
own appointments; admins read all. A leaked anon key therefore exposes nothing.

### Abuse controls (all free)

- Google account required to confirm a booking
- `max_open_per_user = 1` open booking per account
- Cloudflare Turnstile on the booking form
- Rate limits on booking, availability lookup, and admin login

---

## 11. API Surface

Reads happen in server components; mutations go through explicit route handlers
— easier to test, rate-limit, and audit than server actions.

```
GET   /api/availability?date=YYYY-MM-DD    → available slots
POST  /api/appointments                    → book   (auth + Turnstile + rate limit)
GET   /api/appointments/mine
POST  /api/appointments/:id/cancel
POST  /api/appointments/:id/reschedule

GET   /api/admin/appointments?date=
POST  /api/admin/appointments/:id/status
POST  /api/admin/walk-in
POST  /api/admin/blackout
PATCH /api/admin/settings
GET   /api/admin/export.csv
```

Every input is validated server-side with Zod. Client-side validation exists
only for user experience and is never trusted.

---

## 12. Notifications (free tier only)

No SMS. No WhatsApp automation. Both cost money and, for WhatsApp, require Meta
business verification.

| Channel | Behaviour | Cost |
|---|---|---|
| **Email confirmation** | Sent on booking. Address comes verified from Google sign-in — no collection step, no bounces | ₹0 (Resend, 3,000/month free) |
| **Email reminder** | Morning of the day before | ₹0 |
| **`.ics` calendar attachment** | Attached to the confirmation and offered on the confirm screen. The patient's own phone then reminds them — no service, no quota, works forever | ₹0 |
| **`wa.me` button in `/admin`** | One tap opens WhatsApp with a pre-filled message. The clinic sends it manually | ₹0 |

Resend requires SPF and DKIM records in Cloudflare DNS, or mail lands in spam.

**Known limitation:** email is weaker than WhatsApp for elderly patients in
Jaipur. The calendar invite is the strongest of the three, because the reminder
fires on the patient's phone without any action from them. Revisit WhatsApp
Cloud API (~₹15/month) after v1 has run long enough to measure real no-show
rates.

---

## 13. Internationalisation

`/hi/...` and `/en/...` route segments — separate URLs, which index far better
than a client-side toggle. Two JSON dictionaries; no i18n library at this size.

Hindi is the default; `/` redirects to `/hi`. `hreflang` tags are set on every
page. The language toggle preserves the current path and persists the choice in
a cookie.

Every string, including error messages, validation text, email bodies, and ARIA
labels, exists in both dictionaries. A CI check fails the build if the two
dictionaries have differing key sets.

---

## 14. Security & Privacy

- HTTPS everywhere; HSTS; CSP; `X-Content-Type-Options`; `Referrer-Policy`
- Zod validation on every route handler
- Rate limiting on booking, lookup, and login
- Turnstile on the booking form
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and never prefixed `NEXT_PUBLIC_`
- RLS on every table
- `audit_log` written on every mutation
- No medical records stored — booking data only, by design

### DPDP Act 2023

The privacy notice states what is collected (name, phone, age, gender, reason
for visit, email), the purpose (scheduling a consultation), the retention
period (24 months from the visit), and how to request deletion. Consent is
captured explicitly at booking, not by pre-ticked checkbox. Patients can delete
their account and data from `/my-appointments`.

---

## 15. Infrastructure & Cost

```
Next.js 15 (App Router) · TypeScript · Tailwind
Prisma → Supabase Postgres
Supabase Auth (Google OAuth)
Resend · Sentry · Cloudflare Turnstile
Hosting: Netlify    DNS: Cloudflare    Code: personal GitHub
```

**Hosting is Netlify, not Cloudflare Pages.** Prisma on Cloudflare's Workers
runtime requires Hyperdrive or driver-adapter workarounds — avoidable friction.
Netlify's free tier runs a Node runtime where Prisma works unmodified, and its
terms permit commercial use (Vercel's Hobby plan does not). Cloudflare still
provides DNS, Turnstile, and email routing.

*Watch:* Netlify free includes 300 build minutes/month. A build takes ~2–3
minutes, so roughly 100 deploys/month. Sufficient, but do not leave a CI loop
running.

| Item | Service | Cost |
|---|---|---|
| Hosting, CDN, SSL | Netlify free | ₹0 |
| Database | Supabase free (500 MB; usage ~5 MB/yr) | ₹0 |
| Auth | Supabase Auth (50,000 MAU; usage ~80) | ₹0 |
| DNS, Turnstile, email routing | Cloudflare free | ₹0 |
| Transactional email | Resend free (3,000/mo; usage ~160) | ₹0 |
| Errors | Sentry free | ₹0 |
| Uptime | UptimeRobot free | ₹0 |
| Analytics | Cloudflare Web Analytics (cookieless — no consent banner) | ₹0 |
| Backups | GitHub Actions + `pg_dump` | ₹0 |
| **Domain** | Cloudflare Registrar, at cost | **₹700–1,100/yr** |

**Total: ₹1,000/year.**

---

## 16. Domain Strategy

Three phases, and the code never learns which one it is in.

1. **Development** — the instant `*.netlify.app` subdomain. Zero setup, zero cost.
2. **Clinic review** — `arhamarogyam.eu.org`. Free forever, but approval is
   manual and volunteer-run and may take weeks or be refused, so it is applied
   for in parallel and adopted only if it arrives. Never a blocker.
3. **Launch** — `arhamarogyam.in`, bought once the clinic approves. First-year
   promotions run ₹99–₹500; transfer to Cloudflare Registrar afterwards for
   at-cost renewal.

**Built for the move from day one:**

- The origin appears in exactly one place, `NEXT_PUBLIC_SITE_URL`
- All internal links are relative
- Canonical tags, `hreflang`, sitemap, and Open Graph URLs derive from that variable
- **`NEXT_PUBLIC_ALLOW_INDEXING=false` until the real domain is live**, so the
  temporary URL is never indexed and never competes with the real one
- Both the temporary and final origins are registered as Google OAuth redirect
  URIs and in Supabase's allowed redirect URLs

Migration is then: change one variable, add a redirect URI, point DNS, redeploy.
No code changes.

**Transliteration note:** अर्हम् आरोग्यम् is commonly written both *Arogyam*
and *Aarogyam*, and patients will type both. Register the primary domain and,
budget permitting, the alternate spelling with a free Cloudflare redirect rule
pointing at the main site.

---

## 17. Reliability & Operations

| Concern | Approach |
|---|---|
| Deploys | Push to `main` → Netlify builds → live in ~2 min. Preview deploys on every PR |
| **Backups** | Nightly GitHub Action runs `pg_dump` into a private repo. **Supabase's free tier has no backups** — this is not optional |
| Project pausing | Supabase pauses free projects after ~7 idle days. The UptimeRobot monitor's 5-minute ping prevents this |
| Errors | Sentry, with alerts to Samyak's email |
| Uptime | UptimeRobot, 5-minute checks |
| Dependency rot | Renovate PRs; pinned Node version; **rebuild and redeploy quarterly even when nothing has changed** |
| Failure containment | React error boundaries per route — a broken services page never takes down booking |
| Degraded network | Admin list serves last-known data with a "saved list" banner rather than blanking |
| JS disabled or failed | All informational pages render server-side and remain fully readable |

### Portability — the insurance policy

**No vendor-specific features.** No Supabase Edge Functions, no Supabase
Realtime, no Netlify-proprietary APIs. Plain Postgres, plain Prisma, standard
SQL, standard Next.js.

If a free tier disappears: `pg_dump`, restore to Neon or Railway, change
`DATABASE_URL`, redeploy. An afternoon, not a rewrite. Portability is what makes
a free stack a five-year stack.

---

## 18. Testing Strategy

| Layer | Tool | Coverage |
|---|---|---|
| Slot engine | Vitest | Generation, blackouts (whole-day and partial), lead time, IST boundaries, slot-length changes with existing bookings, overlap detection, empty and full days |
| Concurrency | Vitest + real Postgres | Two simultaneous `POST`s to one slot → exactly one `201`, one clean `409` |
| API | Vitest | Zod rejection paths, auth guards, role guards, rate limits |
| E2E | Playwright | Book · cancel · reschedule · admin marks done · walk-in · language toggle |
| Accessibility | axe-core in Playwright | Zero critical violations on every public route |
| Performance | Lighthouse CI | Budgets from §5.3, enforced in CI |
| i18n | Custom CI check | `hi.json` and `en.json` key sets are identical |

The concurrency test is the one that must exist before launch. It is the only
proof that §9 actually works.

---

## 19. Build Phases

| # | Phase | Output | Effort |
|---|---|---|---|
| 0 | Accounts & content | Clinic-owned accounts created; personal git identity set; content brief sent to the clinic | ½ day |
| 1 | **Pipeline first** | Repo → Next.js → deployed to `*.netlify.app` with SSL and CI | ½ day |
| 2 | Data layer | Supabase project, Prisma schema, migrations, exclusion constraint, seed data | 1 day |
| 3 | Design system & public site | Tokens, typography, motion primitives, all public pages, bilingual, SEO | 2–3 days |
| 4 | Booking & auth | Slot engine with tests, Google sign-in, 4-step flow, email, `.ics` | 2 days |
| 5 | Admin portal | List, statuses, walk-in, blackouts, settings, CSV | 2 days |
| 6 | Hardening | Rate limits, Turnstile, Sentry, UptimeRobot, backups, Lighthouse budgets, Google Business Profile | 1 day |
| 7 | Launch | Buy `.in`, enable indexing, Hindi handover guide, credential transfer | ½ day |

**~10 working days, realistically 5–7 weekends.**

Phase 1 comes before any feature work — a working deploy pipeline on day one is
the habit that saves the project. Phase 3 begins while waiting on the clinic's
photographs and copy, which is what will actually cause delay.

---

## 20. Handover

Deliverables at phase 7, treated as real scope rather than an afterthought:

1. A one-page guide **in Hindi** covering: how to see Tuesday's list, how to
   mark a patient done, how to add a walk-in, how to block a day.
2. All credentials transferred to the clinic-owned email; recovery access
   confirmed working.
3. A written maintenance expectation: ~2 hours every 6 months for dependency
   updates and a redeploy.
4. A named contact for when something breaks.

---

## 21. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **The clinic keeps using a paper register and ignores the portal** | **High** | The single biggest risk, and it is not technical. Phase 5 gets disproportionate polish; the Hindi handover guide is a real deliverable; the clinic owns hours and blackout dates so the portal is the only place those live |
| Clinic content (photos, copy) arrives late | High | Requested at phase 0; phases 1–2 proceed without it |
| A free tier changes terms or closes | Medium | Portability (§17). No vendor lock-in anywhere |
| Dependency rot after months untouched | Medium | Renovate, pinned Node, quarterly redeploy |
| Elderly patient cannot sign in with Google | Medium | The admin walk-in path covers this without weakening the public form |
| Email reminders under-perform vs WhatsApp | Medium | `.ics` calendar reminder carries most of the load; revisit WhatsApp after measuring real no-show data |
| Work git identity leaks into a personal repo | Low, embarrassing | Repository-local `user.email` set before the first commit |
| `eu.org` application is refused or slow | Low | Never on the critical path; `*.netlify.app` is the working default |

---

## 22. Open Questions for the Clinic

Blocking phase 3, requested at phase 0:

1. Domain preference — `arhamarogyam.in` recommended
2. **A clinic-owned email address to own every account**
3. Photographs — centre exterior and interior; Vaidya Rahul Jain, with consent
4. About and Services copy, in Hindi and English
5. Public phone number, and confirmation it should be displayed
6. Exact Google Maps pin for C-39, Jyoti Marg
7. Consultation fee to display (paid in cash at the clinic)
8. Starting slot length, and the cancellation window
9. Vaidya Rahul Jain's practitioner registration number, if he holds one —
   displaying it meaningfully increases patient trust
10. Written sign-off on the disclaimer wording in §6.1
