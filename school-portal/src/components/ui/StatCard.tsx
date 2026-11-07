import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  tone?: "default" | "primary" | "gold" | "warning" | "danger";
  link?: ReactNode;
  className?: string;
};

const tones = {
  default: { chip: "bg-forest-100 text-forest-700" },
  primary: { chip: "bg-primary-100 text-primary-800" },
  gold: { chip: "bg-gold-100 text-gold-700" },
  warning: { chip: "bg-amber-100 text-amber-800" },
  danger: { chip: "bg-red-100 text-red-700" },
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon,
  loading = false,
  tone = "default",
  link,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-ink-100 bg-white p-4 shadow-card transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        {icon && (
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              tones[tone].chip,
            )}
            aria-hidden
          >
            {icon}
          </div>
        )}
      </div>

      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight text-ink-900",
          loading && "animate-pulse bg-ink-100 text-transparent",
        )}
      >
        {loading ? "0000" : value}
      </p>

      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
      {link && <div className="mt-2 text-xs">{link}</div>}
    </div>
  );
}

export function StatGrid({
  children,
  cols = 4,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
