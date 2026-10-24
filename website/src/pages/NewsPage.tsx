import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { school } from "@/content/site";

export function NewsPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Newsroom" title="News & events" arabic="الأخبار" />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          align="start"
          eyebrow="From the madrasa"
          title="Recent happenings"
          description="Stories from our students, classrooms, and community gatherings."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {school.news.map((item) => (
            <article
              key={item.title}
              className="flex flex-col rounded-card border border-ink-100 bg-white p-6 shadow-card sm:p-8"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-2.5 py-0.5 text-[11px] font-semibold text-forest-800 ring-1 ring-inset ring-forest-200">
                  <Megaphone className="size-3" aria-hidden />
                  {item.tag}
                </span>
                <time className="text-[11px] text-ink-400" dateTime={item.date}>
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-ink-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-ink-400">
          Announcements to enrolled students and parents are delivered inside the{" "}
          <Link to="/admissions" className="font-semibold text-primary-800 hover:text-primary-600">
            portals
          </Link>{" "}
          — this public feed is for the wider community.
        </p>
      </section>
    </PageShell>
  );
}
