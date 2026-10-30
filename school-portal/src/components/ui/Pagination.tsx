import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  className?: string;
};

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const out: (number | "…")[] = [1];

  if (page > 3) out.push("…");

  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p += 1) {
    out.push(p);
  }

  if (page < totalPages - 2) out.push("…");
  if (totalPages > 1) out.push(totalPages);

  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
  className,
}: PaginationProps) {
  if (totalPages <= 0) return null;

  const pages = pageWindow(page, totalPages);
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(totalPages, page + 1));

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3  px-5 py-3",
        className,
      )}
    >
      <p className="text-xs text-ink-500">
        Page <span className="font-medium text-ink-800">{page}</span>
        {" of "}
        <span className="font-medium text-ink-800">{totalPages}</span>
        {total !== undefined && (
          <>
            {" · "}
            {total.toLocaleString()} record{total === 1 ? "" : "s"}
          </>
        )}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={prev}
            disabled={page <= 1}
            className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
        </li>
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`ellipsis-${i}`} aria-hidden className="px-1 text-xs text-ink-400">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "min-w-7 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  p === page
                    ? "bg-primary-700 text-white"
                    : "border border-ink-200 bg-white text-ink-700 hover:border-primary-300 hover:text-primary-700",
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            onClick={next}
            disabled={page >= totalPages}
            className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}

export type ListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

export function PagedFooter({
  pagination,
  onPageChange,
  children,
}: {
  pagination: ListPagination | undefined;
  onPageChange: (page: number) => void;
  children?: ReactNode;
}) {
  if (!pagination || pagination.totalPages <= 1) {
    return children ?? null;
  }

  return (
    <div className="border-t border-ink-100">
      {children}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onChange={onPageChange}
      />
    </div>
  );
}
