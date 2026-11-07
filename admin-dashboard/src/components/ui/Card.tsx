import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
  bodyClassName?: string;
};

export function Card({
  title,
  description,
  actions,
  padded = true,
  bodyClassName,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <div
      className={cn(
        "rounded-card border border-ink-100 bg-white shadow-card",
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-ink-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div
        className={cn(
          padded && "p-5",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
