import type { ReactNode, UIEvent } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/cn";

export type SortDir = "asc" | "desc";

export type Column<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "start" | "end" | "center";
  sortValue?: (item: T) => string | number;
  render: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  rowKey: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  // Sorting (client-side)
  sort?: { key: string | null; dir: SortDir };
  onSortChange?: (key: string | null) => void;
  // Mobile adaptation: below `cardBreakpoint` we show rows as cards
  mobileCard?: (item: T) => ReactNode;
  stickyFirstColumn?: boolean;
  className?: string;
};

const skeletonRows = 6;

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records",
  emptyDescription,
  emptyAction,
  rowKey,
  onRowClick,
  sort,
  onSortChange,
  mobileCard,
  className,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSortChange) return;
    if (sort?.key === key) {
      onSortChange(sort.dir === "asc" ? key : null);
    } else {
      onSortChange(key);
    }
  };

  const sortedData = data
    ? sort && sort.key
      ? [...data].sort((a, b) => {
          const column = columns.find((c) => c.key === sort.key);
          if (!column?.sortValue) return 0;
          const av = column.sortValue(a);
          const bv = column.sortValue(b);
          const dir = sort.dir === "asc" ? 1 : -1;
          if (av < bv) return -dir;
          if (av > bv) return dir;
          return 0;
        })
      : data
    : undefined;

  if (isLoading) {
    return (
      <div className={cn("overflow-hidden", className)} role="status" aria-live="polite">
        <span className="sr-only">Loading records…</span>
        <TableShell>
          <thead>
            <tr>
              {columns.map((c) => (
                <Th key={c.key} align={c.align} headerClassName={c.headerClassName}>
                  <span className="inline-block h-3 w-20 animate-pulse rounded bg-ink-100" />
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-t border-ink-100">
                {columns.map((c) => (
                  <Td key={c.key} align={c.align}>
                    <span
                      className="inline-block h-3 animate-pulse rounded bg-ink-100"
                      style={{ width: `${45 + ((i * 13) % 40)}%` }}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableShell>
        {/* Mobile skeleton */}
        <div className="grid gap-3 p-4 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card border border-ink-100 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink-100" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!sortedData || sortedData.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className={className} />
    );
  }

  if (mobileCard) {
    return (
      <>
        {/* Desktop table */}
        <div className={cn("hidden overflow-x-auto md:block", className)}>
          <TableShell>
            <SortableHead
              columns={columns}
              sort={sort}
              onSort={handleSort}
              sortable={Boolean(onSortChange)}
            />
            <tbody>
              {sortedData.map((item, index) => (
                <tr
                  key={rowKey(item, index)}
                  className={cn(
                    "border-t border-ink-100 transition-colors hover:bg-forest-50/70",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((c) => (
                    <Td key={c.key} align={c.align} headerClassName={c.headerClassName}>
                      {c.render(item)}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
        {/* Mobile cards */}
        <div className={cn("grid gap-3 p-px md:hidden", className)}>
          {sortedData.map((item, index) => (
            <div
              key={rowKey(item, index)}
              className={cn(
                "rounded-card border border-ink-100 bg-white p-4 shadow-card",
                onRowClick &&
                  "cursor-pointer hover:border-primary-200 focus-visible:outline-2",
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(item);
                      }
                    }
                  : undefined
              }
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {typeof mobileCard === "function" ? mobileCard(item) : mobileCard}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <TableShell>
        <SortableHead
          columns={columns}
          sort={sort}
          onSort={handleSort}
          sortable={Boolean(onSortChange)}
        />
        <tbody>
          {sortedData.map((item, index) => (
            <tr
              key={rowKey(item, index)}
              className={cn(
                "border-t border-ink-100 transition-colors hover:bg-forest-50/70",
                onRowClick && "cursor-pointer",
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((c) => (
                <Td key={c.key} align={c.align} headerClassName={c.headerClassName}>
                  {c.render(item)}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

function TableShell({ children, onScroll }: { children: ReactNode; onScroll?: (e: UIEvent<HTMLTableElement>) => void }) {
  return (
    <table className="w-full min-w-[640px] border-collapse text-sm" onScroll={onScroll}>
      {children}
    </table>
  );
}

function SortableHead<T>({
  columns,
  sort,
  onSort,
  sortable,
}: {
  columns: Column<T>[];
  sort?: { key: string | null; dir: SortDir };
  onSort: (key: string) => void;
  sortable: boolean;
}) {
  return (
    <thead>
      <tr className="border-b border-ink-100 bg-forest-50/60">
        {columns.map((c) => (
          <Th key={c.key} align={c.align} headerClassName={c.headerClassName}>
            {sortable && c.sortValue ? (
              <button
                type="button"
                onClick={() => onSort(c.key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-0.5 py-0.5 text-left hover:text-primary-800",
                  sort?.key === c.key && "font-semibold text-primary-800",
                )}
                aria-label={
                  sort?.key === c.key && sort.dir === "asc"
                    ? `Sort ${footerSortLabel(c.key)} descending`
                    : `Sort ${footerSortLabel(c.key)} ascending`
                }
              >
                {c.header}
                {sort?.key === c.key ? (
                  sort.dir === "asc" ? (
                    <ChevronUp className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden />
                  )
                ) : (
                  <span className="inline-block w-3.5" aria-hidden />
                )}
              </button>
            ) : (
              c.header
            )}
          </Th>
        ))}
      </tr>
    </thead>
  );
}

function footerSortLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").toLowerCase();
}

function Th({
  align = "start",
  headerClassName,
  children,
}: {
  align?: Column<unknown>["align"];
  headerClassName?: string;
  children: ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500",
        align === "end" && "text-right",
        align === "center" && "text-center",
        headerClassName,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  align = "start",
  children,
  headerClassName,
}: {
  align?: Column<unknown>["align"];
  children: ReactNode;
  headerClassName?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-ink-800",
        align === "end" && "text-right",
        align === "center" && "text-center",
        headerClassName,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  title = "Nothing here",
  description,
  action,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex max-w-md flex-col items-center justify-center rounded-card border border-dashed border-ink-200 bg-forest-50/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-ink-300">{icon}</div>}
      <h3 className="mt-2 text-sm font-semibold text-ink-800">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-ink-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
