import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, CircleCheck, FileDown } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { Spinner } from "@/components/PageLoader";
import { InputField } from "@/components/Fields";
import { apiFetch, applicationPdfUrl, assetUrl } from "@/lib/api";

type ApplicationRecord = {
  applicationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  status: "Pending" | "Approved" | "Rejected" | string;
  currentLevel: string;
  createdAt: string;
  parentName?: string;
  parentPhone?: string;
  reason?: string;
  statusReason?: string;
  photoUrl?: string;
};

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-900 ring-amber-300",
  Approved: "bg-primary-700 ring-emerald-300 text-white",
  Rejected: "bg-red-100 text-red-900 ring-red-300",
};

export function ApplicationStatusPage() {
  const [applicationNumber, setApplicationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [record, setRecord] = useState<ApplicationRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const check = (event: React.FormEvent) => {
    event.preventDefault();
    const query = applicationNumber.trim();
    const lookup = phone.trim();
    if (!query) {
      setError("Enter the application number you received when applying.");
      return;
    }
    if (!lookup) {
      setError("Enter the applicant or parent phone number used on the application.");
      return;
    }
    setChecking(true);
    setError(null);
    setNotFound(false);
    setRecord(null);
    setLookupPhone(lookup);
    apiFetch<ApplicationRecord>(
      `/admission-applications/number/${encodeURIComponent(query)}?phone=${encodeURIComponent(lookup)}`,
    )
      .then(setRecord)
      .catch(() => setNotFound(true))
      .finally(() => setChecking(false));
  };

  return (
    <PageShell>
      <PageHero eyebrow="Track an application" title="Application status" arabic="حالة الطلب" />
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <form
          onSubmit={check}
          aria-label="Check application status"
          className="grid gap-3 rounded-card border border-ink-100 bg-white p-5 shadow-card sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <InputField
            id="application-number"
            label="Application number"
            required
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
            placeholder="e.g. DU/ADM/2026/00042"
            hint="From your application receipt"
          />
          <InputField
            id="application-phone"
            label="Phone on application"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Applicant or parent phone"
            hint="Used to protect your application"
          />
          <button
            type="submit"
            disabled={checking}
            className="flex h-[38px] items-center justify-center gap-2 rounded-lg bg-forest-950 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-forest-900 disabled:opacity-60"
          >
            {checking && <Spinner />}
            {checking ? "Checking…" : "Check status"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-800">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        {notFound && (
          <article role="status" className="mt-8 rounded-card border border-ink-100 bg-white p-6 shadow-card">
            <p className="flex items-start gap-2 text-sm text-ink-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
              <span>
                No application matches this number yet. Double-check the number — it is case-sensitive
                exactly as issued. If you just applied, give the office a moment to process it, or{" "}
                <Link to="/apply" className="font-semibold text-primary-800 hover:text-primary-600">
                  apply now
                </Link>
                .
              </span>
            </p>
          </article>
        )}

        {record && (
          <article role="status" className="mt-8 overflow-hidden rounded-card border border-ink-100 bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-forest-50/50 px-5 py-4">
              <div className="flex items-center gap-4">
                {record.photoUrl && (
                  <img
                    src={assetUrl(record.photoUrl)}
                    alt={`Passport photo of applicant ${record.firstName}`}
                    className="size-14 rounded-lg border border-ink-200 object-cover"
                  />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Application number</p>
                  <p className="font-mono text-lg font-bold text-ink-900 select-all">{record.applicationNumber}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${statusStyles[record.status] ?? "bg-ink-100 text-ink-800 ring-ink-200"}`}
              >
                <CircleCheck className="size-3.5" aria-hidden />
                {record.status}
              </span>
            </div>
            <dl className="grid gap-x-8 gap-y-3 px-5 py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Applicant</dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {[record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Level applied for</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{record.currentLevel ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Parent / guardian</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{record.parentName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Submitted on</dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              {(record.statusReason || record.reason) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">Note from the office</dt>
                  <dd className="mt-0.5 text-ink-700">{record.statusReason || record.reason}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-forest-50/50 px-5 py-4">
              <p className="max-w-sm text-xs leading-relaxed text-ink-500">
                Next step depends on the status: "Pending" means the office is reviewing; "Approved" invites you for
                the interview; questions about a "Rejected" status should be brought to the front office.
              </p>
              <a
                href={applicationPdfUrl(record.applicationNumber, lookupPhone)}
                className="inline-flex items-center gap-2 rounded-lg border border-gold-500/50 bg-white px-4 py-2 text-xs font-bold text-ink-800 transition-colors hover:border-gold-600"
              >
                <FileDown className="size-4" aria-hidden />
                Download PDF
              </a>
            </div>
          </article>
        )}
      </section>
    </PageShell>
  );
}
