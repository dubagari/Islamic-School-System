import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-primary-700" aria-hidden />
      <p className="text-sm text-ink-500">Loading…</p>
      <span className="sr-only">Page is loading</span>
    </div>
  );
}
