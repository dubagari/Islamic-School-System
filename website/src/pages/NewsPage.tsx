import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Megaphone, TriangleAlert } from "lucide-react";

import { PageShell, SectionHeading } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { Spinner } from "@/components/PageLoader";
import { apiErrorMessage, fetchPublicAnnouncements, type PublicAnnouncement } from "@/lib/api";

const priorityStyles: Record<string, string> = {
  Low: "bg-ink-100 text-ink-700 ring-ink-200",
  Normal: "bg-forest-50 text-forest-800 ring-forest-200",
  High: "bg-gold-500/10 text-gold-700 ring-gold-500/40",
  Urgent: "bg-red-50 text-red-800 ring-red-200",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NewsPage() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicAnnouncements(12)
      .then((items) => {
        if (!cancelled) setAnnouncements(items);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load announcements right now. Please try again later."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <PageHero eyebrow="Newsroom" title="News & events" arabic="الأخبار" />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          align="start"
          eyebrow="Public announcements"
          title="Recent happenings"
          description="Notices published by the madrasa office for the wider community."
        />

        <div className="mt-10">
          {error ? (
            <div role="alert" className="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{error}</p>
            </div>
          ) : announcements === null ? (
            <div role="status" className="flex flex-col items-center gap-3 px-6 py-16">
              <Spinner className="size-6 text-forest-800" />
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Loading announcements…</p>
            </div>
          ) : announcements.length === 0 ? (
            <div role="status" className="flex flex-col items-center gap-3 rounded-card border border-ink-100 bg-white px-6 py-16 text-center shadow-card">
              <span className="flex size-12 items-center justify-center rounded-full bg-forest-50 text-forest-800 ring-1 ring-forest-200">
                <Inbox className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-ink-800">No announcements yet</p>
              <p className="max-w-md text-xs leading-relaxed text-ink-500">
                Notices from the school office will appear here. Urgent updates also reach enrolled families through the school portal.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {announcements.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col rounded-card border border-ink-100 bg-white p-6 shadow-card sm:p-8"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${priorityStyles[item.priority] ?? priorityStyles.Normal}`}
                    >
                      <Megaphone className="size-3" aria-hidden />
                      {item.priority}
                    </span>
                    <time className="text-[11px] text-ink-400" dateTime={item.publishAt}>
                      {formatDate(item.publishAt)}
                    </time>
                  </div>
                  <h2 className="mt-3 text-lg font-bold tracking-tight text-ink-900">{item.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{item.content}</p>
                </article>
              ))}
            </div>
          )}
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
