import { Link } from "react-router-dom";

import { PageShell } from "@/components/PageShell";

function NotFoundContent() {
  return (
    <section className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center sm:px-6">
      <p className="font-arabic text-3xl text-gold-700" dir="rtl">
        لا نجد هذه الصفحة
      </p>
      <h1 className="mt-2 text-2xl font-bold text-ink-900">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        The page you were looking for doesn't exist — perhaps a link from an older page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-forest-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-900"
        >
          Back to home
        </Link>
        <Link
          to="/admissions"
          className="rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600 hover:text-primary-800"
        >
          Admissions
        </Link>
      </div>
    </section>
  );
}

export default function NotFoundPage() {
  return (
    <PageShell>
      <NotFoundContent />
    </PageShell>
  );
}
