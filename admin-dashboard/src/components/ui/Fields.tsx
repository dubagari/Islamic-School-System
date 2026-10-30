import type {
  FieldsetHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";

import { cn } from "@/lib/cn";

const fieldBase =
  "block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-400/30";

type LabelProps = {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldLabel({ htmlFor, required, children, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-medium text-ink-700", className)}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      )}
      {required && <span className="sr-only">(required)</span>}
    </label>
  );
}

type FieldErrorProps = {
  error?: string;
  id?: string;
};

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
      <span aria-hidden>•</span>
      <span>{error}</span>
    </p>
  );
}

type FormFieldProps = Omit<LabelProps, "children"> &
  FieldErrorProps & {
    label: ReactNode;
    hint?: ReactNode;
    className?: string;
    children: (
      ariaProps: {
        id: string;
        "aria-invalid"?: "true";
        "aria-describedby"?: string;
      },
    ) => ReactNode;
  };

export function FormField({
  label,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children({
        id,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      )}
      <FieldError error={error} id={errorId} />
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps) {
  return <input className={cn(fieldBase, className)} {...rest} />;
}

export function Textarea({
  className,
  rows = 3,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldBase, "min-h-16 resize-y", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "pe-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function InputField({
  label,
  error,
  required,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & Omit<FormFieldProps, "children">) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      {(aria) => <Input {...aria} {...rest} />}
    </FormField>
  );
}

export function TextareaField({
  label,
  error,
  required,
  hint,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> &
  Omit<FormFieldProps, "children">) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      {(aria) => <Textarea {...aria} {...rest} />}
    </FormField>
  );
}

export function SelectField({
  label,
  error,
  required,
  hint,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & Omit<FormFieldProps, "children">) {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      hint={hint}
      className={className}
    >
      {(aria) => (
        <Select {...aria} {...rest}>
          {children}
        </Select>
      )}
    </FormField>
  );
}

type FieldsetProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  legend: ReactNode;
};

export function Fieldset({ legend, className, children, ...rest }: FieldsetProps) {
  return (
    <fieldset
      className={cn(
        "rounded-card border border-ink-100 bg-forest-50/50 p-4",
        className,
      )}
      {...rest}
    >
      <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}
