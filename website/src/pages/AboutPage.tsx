import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { school } from "@/content/site";

export function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About"
        title="Who we are"
        arabic={school.nameArabic}
      />

      {/* History */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          align="start"
          eyebrow="Madrasa history"
          title={`From a saddle of few pupils to a full madrasa — since ${school.foundedYear}`}
        />
        <div className="mt-8 space-y-5">
          {school.history.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink-700">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Mission / vision */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <article className="rounded-card border border-ink-100 bg-forest-50/60 p-8">
            <h2 className="font-arabic text-xl text-gold-700" dir="rtl">
              الرسالة
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-800">Mission</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{school.mission}</p>
          </article>
          <article className="rounded-card border border-ink-100 bg-forest-50/60 p-8">
            <h2 className="font-arabic text-xl text-gold-700" dir="rtl">
              الرؤية
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-800">Vision</p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{school.vision}</p>
          </article>
        </div>
      </section>

      {/* Principal's welcome */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <article className="rounded-card border border-ink-100 bg-white p-8 shadow-card sm:p-10">
          <span className="flex size-10 items-center justify-center rounded-full bg-gold-500/15 text-gold-600 ring-1 ring-gold-500/30">
            <Quote className="size-5" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink-900">Principal's welcome</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{school.principalWelcome}</p>
          <p className="mt-6 text-sm font-bold text-ink-900">{school.principalName}</p>
          <p className="text-xs text-ink-500">{school.principalTitle}</p>
        </article>
      </section>

      {/* Values */}
      <section className="bg-forest-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Our values</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">The carriage we hope your child walks away with</h2>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {school.values.map((value) => (
              <li key={value.title}>
                <p className="font-arabic text-4xl text-gold-400" dir="rtl">
                  {value.titleArabic}
                </p>
                <h3 className="mt-2 text-sm font-bold uppercase tracking-wide">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-100/80">{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-12 text-center">
        <Link
          to="/academics"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600 hover:text-primary-800"
        >
          See how we teach
        </Link>
      </section>
    </PageShell>
  );
}

export function PageHero({ eyebrow, title, arabic }: { eyebrow: string; title: string; arabic?: string }) {
  return (
    <section className="border-b border-forest-800 bg-forest-950 py-14 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {arabic && (
            <span className="font-arabic text-2xl text-gold-400/90" dir="rtl">
              {arabic}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
