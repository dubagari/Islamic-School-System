import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, ListOrdered } from "lucide-react";
import { useState } from "react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { school } from "@/content/site";

type Faq = { q: string; a: string };

function FaqItem({ faq, open, onToggle }: { faq: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-card border border-ink-100 bg-white shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
      >
        <span className="text-sm font-semibold text-ink-900">{faq.q}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && <p className="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-600">{faq.a}</p>}
    </div>
  );
}

export function AdmissionsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PageShell>
      <PageHero
        eyebrow="Admissions"
        title="Bringing your child to the madrasa"
        arabic="التسجيل"
      />

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="The process"
          title="Four steps from application to first day"
          description="It all starts with a short form — and an application number you can track from this website."
        />
        <ol className="mt-12 space-y-4">
          {school.admissionsSteps.map((step, index) => (
            <li
              key={step.title}
              className="flex items-start gap-4 rounded-card border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-950 text-sm font-bold text-gold-400">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Fees */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Fees"
            title="Fee structure"
            description={school.feesNote}
          />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/apply"
              className="rounded-lg bg-forest-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-900"
            >
              Start an application
            </Link>
            <Link
              to="/application-status"
              className="rounded-lg border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600 hover:text-primary-800"
            >
              Track your application
            </Link>
          </div>
        </div>
      </section>

      {/* Requirements checklist */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <article className="rounded-card border border-ink-100 bg-forest-50/60 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
            <ListOrdered className="size-5 text-primary-800" aria-hidden />
            What the application asks for
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {[
              "Child's full name, gender, and date of birth",
              "Contact address and child's phone (optional)",
              "Parent/guardian name, phone, and relationship",
              "Current school level (transfer students: last madrasa)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <SectionHeading eyebrow="FAQ" title="Questions parents ask" />
        <div className="mt-10 space-y-3">
          {school.faqs.map((faq, index) => (
            <FaqItem
              key={faq.q}
              faq={faq}
              open={openFaq === index}
              onToggle={() => setOpenFaq(openFaq === index ? null : index)}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
