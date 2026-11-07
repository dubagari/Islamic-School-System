import { Link } from "react-router-dom";
import { BookOpenCheck, Clock, MoonStar, ScrollText } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { school } from "@/content/site";

export function AcademicsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Academics"
        title="What your child will learn"
        arabic="طلبة العلم"
      />

      {/* Programs */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <ul className="grid gap-6 md:grid-cols-2">
          {school.programs.map((program, index) => (
            <li
              key={program.name}
              className="flex gap-5 rounded-card border border-ink-100 bg-white p-6 shadow-card sm:p-8"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-950 text-sm font-bold text-gold-400"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <p className="font-arabic text-lg text-gold-700" dir="rtl">
                  {program.nameArabic}
                </p>
                <h2 className="text-lg font-bold tracking-tight text-ink-900">{program.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{program.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Levels */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Levels"
            title="A clear ladder from Kindergarten to Thanawiyya"
            description="Each level builds on the last — private instruction pace for Tahfeez and government-standard academics."
          />
          <ol className="mt-10 flex flex-wrap items-stretch justify-center gap-3">
            {school.levels.map((level) => (
              <li
                key={level}
                className="rounded-card border border-ink-100 bg-forest-50/60 px-5 py-4 text-center"
              >
                <p className="font-arabic text-sm text-gold-700" dir="rtl">
                  {level}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-800">{level}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Day in the life */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="A day in the madrasa"
          title="Discipline that carries worship and learning"
        />
        <div className="mt-10 space-y-4">
          {[
            { icon: MoonStar, time: "7:00 – 9:00", title: "Morning Qur'an & tajweed", text: "Revision tasme' of the student's current juz' in small recitation circles, followed by new memorization with a Hawza." },
            { icon: Clock, time: "9:15 – 12:30", title: "Modern academic lessons", text: "English, mathematics, sciences, and social studies in furnished classrooms with a strong insistence on focus and adab." },
            { icon: ScrollText, time: "12:30 – 1:30", title: "Lunch & dhuhr prayer", text: "Washing hands before eating, shared meals, and congregational dhuhr in the school masjid." },
            { icon: BookOpenCheck, time: "1:45 – 3:00", title: "Islamic sciences & Arabic", text: "Fiqh, hadith, seerah, and Arabic grammar — nahw and sarf taught with classical diagrams and spoken practice." },
          ].map((item) => (
            <article
              key={item.time}
              className="flex items-start gap-4 rounded-card border border-ink-100 bg-white p-5 shadow-card"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div className="grid gap-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-400">{item.time}</p>
                <h3 className="text-sm font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-forest-950 py-14 text-center text-white">
        <p className="mx-auto max-w-xl px-4 text-sm leading-relaxed text-forest-100/80">
          {school.feesNote}
        </p>
        <Link
          to="/admissions"
          className="mt-6 inline-block rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-gold-400"
        >
          Admissions & fees
        </Link>
      </section>
    </PageShell>
  );
}
