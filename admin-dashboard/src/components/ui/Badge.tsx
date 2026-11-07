import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold";

type BadgeProps = {
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

const tones: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  success: "bg-primary-50 text-primary-800 ring-primary-200",
  warning: "bg-gold-50 text-gold-800 ring-gold-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  gold: "bg-gold-100 text-gold-800 ring-gold-300",
};

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

// Status vocabulary shared across modules, mapped to accessible tones
// (tone is also always paired with readable text — not color alone).
export function statusTone(status: string): BadgeTone {
  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case "active":
    case "approved":
    case "paid":
    case "present":
    case "completed":
    case "published":
    case "graduated":
      return "success";
    case "pending":
    case "partial":
    case "partially paid":
    case "late":
    case "unpaid":
    case "suspended":
    case "on leave":
    case "leave":
      return "warning";
    case "rejected":
    case "absent":
    case "overdue":
    case "failed":
    case "cancelled":
    case "canceled":
    case "withdrawn":
    case "expelled":
    case "reversed":
    case "terminated":
      return "danger";
    case "in progress":
    case "transferred":
    case "resigned":
    case "retired":
    case "excused":
      return "info";
    default:
      return "neutral";
  }
}

export function StatusBadge({ status }: { status: string }) {
  const label = status || "—";
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}
