import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  arabic?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  arabic,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-1.5 text-xs text-ink-500">
            {breadcrumb}
          </nav>
        )}
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="truncate text-xl font-bold tracking-tight text-ink-900">
            {title}
          </h1>
          {arabic && (
            <span className="font-arabic text-lg leading-none text-primary-800">
              {arabic}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function SectionTitle({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
        {children}
      </h2>
      {actions}
    </div>
  );
}
