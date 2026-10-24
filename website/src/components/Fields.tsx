import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type BaseFieldProps = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
};

function Label({
  htmlFor,
  required,
  label,
  hint,
}: {
  htmlFor: string;
  required?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <span className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-ink-800">
        {label}
        {required && (
          <span className="ms-0.5 text-red-600" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
    </span>
  );
}

function FieldShell({
  children,
  label,
  required,
  hint,
  error,
  className,
  id,
}: BaseFieldProps & { children: ReactNode; id: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} required={required} label={label ?? ""} hint={hint} />
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[11px] font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function InputField({
  label,
  required,
  hint,
  error,
  className,
  id,
  type = "text",
  value,
  onChange,
  maxLength,
  placeholder,
  autoComplete,
  name,
}: BaseFieldProps & {
  id?: string;
  type?: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
}) {
  const inputId = id ?? `field-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className} id={inputId}>
      <input
        id={inputId}
        name={name ?? inputId}
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        spellCheck={type !== "email"}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-600 focus:outline-2 focus:outline-offset-1 focus:outline-primary-600 aria-[invalid=true]:border-red-400"
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  required,
  hint,
  error,
  className,
  id,
  value,
  onChange,
  children,
}: BaseFieldProps & {
  id?: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
}) {
  const selectId = id ?? `field-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className} id={selectId}>
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className="block w-full appearance-none rounded-lg border border-ink-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23403f3d%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.6rem_center] bg-[length:1rem] bg-no-repeat px-3 py-2 pe-9 text-sm text-ink-900 focus:border-primary-600 focus:outline-2 focus:outline-offset-1 focus:outline-primary-600 aria-[invalid=true]:border-red-400"
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  required,
  hint,
  error,
  className,
  id,
  rows = 3,
  value,
  onChange,
  maxLength,
}: BaseFieldProps & {
  id?: string;
  rows?: number;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  maxLength?: number;
}) {
  const areaId = id ?? `field-${label?.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className} id={areaId}>
      <textarea
        id={areaId}
        rows={rows}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${areaId}-error` : undefined}
        className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-600 focus:outline-2 focus:outline-offset-1 focus:outline-primary-600 aria-[invalid=true]:border-red-400"
      />
    </FieldShell>
  );
}

export function Fieldset({
  legend,
  className,
  children,
}: {
  legend: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={cn(
        "rounded-card border border-ink-100 bg-white p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <legend className="px-1.5 text-xs font-bold uppercase tracking-widest text-forest-800">
        {legend}
      </legend>
      <div className="grid gap-4 pt-2">{children}</div>
    </fieldset>
  );
}
