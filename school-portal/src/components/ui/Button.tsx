import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "gold";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900 disabled:bg-primary-700/50",
  secondary:
    "bg-forest-800 text-primary-50 hover:bg-forest-900 active:bg-forest-950 disabled:bg-forest-800/50",
  outline:
    "border border-ink-200 bg-white text-ink-800 hover:border-primary-300 hover:bg-primary-50 active:bg-primary-100 disabled:bg-ink-50",
  ghost:
    "bg-transparent text-ink-700 hover:bg-forest-100 active:bg-forest-200 disabled:text-ink-400",
  danger:
    "bg-red-700 text-white hover:bg-red-800 active:bg-red-900 disabled:bg-red-700/50",
  gold:
    "bg-gold-500 text-ink-900 hover:bg-gold-600 active:bg-gold-700 disabled:bg-gold-500/50 font-semibold",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5 rounded-md",
  md: "px-3.5 py-2 text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-sm gap-2 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
