import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/cn";

export type AlertTone = "success" | "error" | "warning" | "info";

const tones: Record<AlertTone, { box: string; icon: typeof Info }> = {
  success: { box: "border-primary-200 bg-primary-50 text-primary-900", icon: CheckCircle2 },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: XCircle },
  warning: { box: "border-gold-300 bg-gold-50 text-gold-900", icon: AlertTriangle },
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info },
};

type AlertProps = {
  tone?: AlertTone;
  title?: string;
  onDismiss?: () => void;
  className?: string;
  children: ReactNode;
};

export function Alert({
  tone = "info",
  title,
  onDismiss,
  className,
  children,
}: AlertProps) {
  const config = tones[tone];
  const Icon = config.icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        config.box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        <div className={cn(title && "mt-0.5 text-[13px]")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss message"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
