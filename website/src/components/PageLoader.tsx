import { cn } from "@/lib/cn";

export function PageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-forest-50" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <span
        className="size-9 animate-spin rounded-full border-[3px] border-primary-600 border-t-transparent"
        aria-hidden
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]",
        className,
      )}
      aria-hidden
    />
  );
}
