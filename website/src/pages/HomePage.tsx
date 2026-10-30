import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Megaphone } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { school } from "@/content/site";
import { fetchPublicAnnouncements, type PublicAnnouncement } from "@/lib/api";

const whyIcon: Record<string, typeof BookOpen> = {
  book: BookOpen,
  graduation: GraduationCap,
  heart: HeartHandshake,
};

export function HomePage() {
  const Icon = whyIcon;
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicAnnouncements(3)
      .then((items) => {
        if (!cancelled) setAnnouncements(items);
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          aria-hidden
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #e7b949 0, transparent 40%)" }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-arabic text-2xl text-gold-400" dir="rtl">
              {school.mottoArabic}
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Learn the Qur'an. <span className="text-gold-400">Live the Qur'an.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-forest-100/85">
              {school.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/apply"
                className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-ink-950 shadow-sm transition-colors hover:bg-gold-400"
              >
                Start an application
              </Link>
              <Link
                to="/admissions"
                className="rounded-lg border border-forest-600 px-6 py-3 text-sm font-semibold text-forest-50 transition-colors hover:border-gold-500/50 hover:bg-forest-900"
              >
                How admission works
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-sm items-center justify-center lg:flex">
            <div className="relative flex size-72 items-center justify-center rounded-full bg-forest-900/60 ring-1 ring-gold-500/20">
              <div className="absolute inset-3 rounded-full ring-1 ring-gold-500/10" aria-hidden />
              <img
                src="/logo.png"
                alt={`${school.name} logo`}
                className="size-52 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                width={208}
                height={208}
              />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-forest-800 bg-forest-900/60">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {school.stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-start">
                <dd className="text-3xl font-bold text-gold-400">{stat.value}</dd>
                <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-forest-200/80">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Why Darul Ulum"
          title="Built on the Qur'an, complete in academics"
          arabic="ربّنا هب لنا من أزواجنا وذرّياتنا قرة أعين"
          description="A madrasa of the Book and a school of the sciences — the choice parents shouldn't have to make."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {school.whyFeatures.map((feature) => {
            const IconComponent = Icon[feature.icon] ?? BookOpen;
            return (
              <article
                key={feature.title}
                className="rounded-card border border-ink-100 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
                  <IconComponent className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Programs preview */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Academics"
            title="Four pillars, one timetable"
            description="From the first juz' to the mathematics exam."
          />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {school.programs.map((program) => (
              <li
                key={program.name}
                className="relative rounded-card border border-ink-100 bg-forest-50/60 p-6"
              >
                <p className="font-arabic text-lg text-gold-700" dir="rtl">
                  {program.nameArabic}
                </p>
                <h3 className="mt-1 text-sm font-bold uppercase tracking-wide text-ink-900">
                  {program.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{program.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              to="/academics"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600 hover:text-primary-800"
            >
              Explore our academics
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* News teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading align="start" eyebrow="From the madrasa" title="Recent news & events" />
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600"
          >
            All updates
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {announcements === null
            ? [0, 1, 2].map((index) => (
                <div key={index} className="animate-pulse rounded-card border border-ink-100 bg-white p-6 shadow-card" aria-hidden>
                  <div className="h-4 w-24 rounded-full bg-ink-100" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-ink-100" />
                  <div className="mt-2 h-3 w-full rounded bg-ink-50" />
                </div>
              ))
            : announcements.length === 0
              ? null
              : announcements.slice(0, 3).map((item) => (
                  <article key={item.title} className="flex flex-col rounded-card border border-ink-100 bg-white p-6 shadow-card">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-semibold text-forest-800 ring-1 ring-inset ring-forest-200">
                        <Megaphone className="size-3" aria-hidden />
                        {item.priority}
                      </span>
                      <time className="text-[11px] text-ink-400" dateTime={item.publishAt}>
                        {new Date(item.publishAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </time>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-ink-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">{item.content}</p>
                  </article>
                ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-950 py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p className="font-arabic text-xl text-gold-400" dir="rtl">
            الازرعوا علماً في قلوبكم
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Give your child the Qur'an and the world</h2>
          <p className="mt-3 text-sm leading-relaxed text-forest-100/80">
            Applications are open for every level. The process is simple, and our office is glad to help at any step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/apply"
              className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-gold-400"
            >
              Apply online
            </Link>
            <Link
              to="/application-status"
              className="rounded-lg border border-forest-600 px-6 py-3 text-sm font-semibold transition-colors hover:border-gold-500/50"
            >
              Check an application
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
