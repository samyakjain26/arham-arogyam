import { getDictionary, type Lang } from '@/lib/i18n'
import { Prose } from '@/components/Prose'
import { Stagger } from '@/components/motion/Stagger'
import { Reveal } from '@/components/motion/Reveal'

// DPDP Act 2023-aligned notice. Every claim here must be backed by the
// dictionary copy (dictionaries/{hi,en}.json → privacy.*), which states:
// what is collected (name, mobile number, and parchi number — matches
// DetailsForm.tsx's actual fields exactly; no email is collected, since the
// Google sign-in that would have supplied one was removed), the purpose
// (scheduling a consultation only), retention (24 months from the visit),
// that consent is explicit at booking and never pre-ticked, and the
// deletion route (contacting the clinic directly — there is no My
// Appointments page). No certification, audit, or security-measure claim
// is made — none exist.
export default async function PrivacyPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params
  const d = getDictionary(lang)

  const sections = [
    { title: d.privacy.collectedTitle, body: d.privacy.collectedBody },
    { title: d.privacy.purposeTitle, body: d.privacy.purposeBody },
    { title: d.privacy.retentionTitle, body: d.privacy.retentionBody },
    { title: d.privacy.consentTitle, body: d.privacy.consentBody },
    { title: d.privacy.deletionTitle, body: d.privacy.deletionBody },
  ]

  return (
    <main>
      <section className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-center text-4xl md:text-5xl">{d.privacy.title}</h1>

        <Reveal>
          <Prose className="mx-auto mt-6">
            <p>{d.privacy.intro}</p>
          </Prose>
        </Reveal>

        <div className="mx-auto mt-10 max-w-prose space-y-8">
          <Stagger>
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl md:text-3xl">{section.title}</h2>
                <Prose className="mt-3">
                  <p>{section.body}</p>
                </Prose>
              </div>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  )
}
