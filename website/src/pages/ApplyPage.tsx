import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Send } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { Spinner } from "@/components/PageLoader";
import { school } from "@/content/site";
import { apiErrorMessage, apiFetch } from "@/lib/api";
import { Fieldset, InputField, SelectField, TextareaField } from "@/components/Fields";

type ApplicationForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: "" | "Male" | "Female";
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  currentLevel: string;
  previousMadrasa: string;
};

const initialForm: ApplicationForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  address: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  relationship: "",
  currentLevel: "",
  previousMadrasa: "",
};

export function ApplyPage() {
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);

  const set = (key: keyof ApplicationForm) =>
    (event: { target: { value: string } }) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.gender) errors.gender = "Select a gender.";
    if (!form.dateOfBirth || Number.isNaN(Date.parse(form.dateOfBirth))) errors.dateOfBirth = "A valid date of birth is required.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Invalid email address.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    if (!form.address.trim()) errors.address = "Address is required.";
    if (!form.parentName.trim()) errors.parentName = "Parent name is required.";
    if (!form.parentPhone.trim()) errors.parentPhone = "Parent phone is required.";
    if (form.parentEmail && !/^\S+@\S+\.\S+$/.test(form.parentEmail.trim())) errors.parentEmail = "Invalid parent email address.";
    if (!form.relationship.trim()) errors.relationship = "Relationship is required.";
    if (!form.currentLevel.trim()) errors.currentLevel = "Current level is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await apiFetch<{ applicationNumber?: string; id?: string }>("/admission-applications", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || undefined,
          lastName: form.lastName.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          address: form.address.trim(),
          parentName: form.parentName.trim(),
          parentPhone: form.parentPhone.trim(),
          parentEmail: form.parentEmail.trim() || undefined,
          relationship: form.relationship.trim(),
          currentLevel: form.currentLevel.trim(),
          previousMadrasa: form.previousMadrasa.trim() || undefined,
        }),
      });
      setApplicationNumber(data.applicationNumber ?? "");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit the application. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (applicationNumber !== null) {
    return (
      <PageShell>
        <PageHero eyebrow="Application submitted" title="Jazakum Allahu khayran" arabic="بارك الله فيكم" />
        <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <article className="rounded-card border border-ink-100 bg-white p-8 text-center shadow-card">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-700/10 text-primary-800 ring-1 ring-primary-700/15">
              <CheckCircle2 className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink-900">Your application has been received</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              The school office will contact the parent/guardian phone number provided for the placement interview.
            </p>
            <div className="mt-6 rounded-card border border-gold-500/30 bg-gold-500/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Your application number</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-ink-900 select-all" aria-live="polite">
                {applicationNumber || "—"}
              </p>
              <p className="mt-2 text-xs text-ink-500">Save this number — you need it to check your status any time.</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/application-status"
                className="rounded-lg bg-forest-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-900"
              >
                Check status now
              </Link>
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setApplicationNumber(null);
                }}
                className="rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600"
              >
                Submit another application
              </button>
            </div>
          </article>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Apply online"
        title="Application for admission"
        arabic="طلب القيد"
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <form onSubmit={handleSubmit} noValidate aria-label="Admission application">
          {error && (
            <div role="alert" className="mb-6 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Fieldset legend="Child's information">
            <div className="grid gap-4 sm:grid-cols-3">
              <InputField label="First name" required value={form.firstName} onChange={set("firstName")} error={fieldErrors.firstName} autoComplete="given-name" />
              <InputField label="Middle name" value={form.middleName} onChange={set("middleName")} autoComplete="additional-name" />
              <InputField label="Last name" required value={form.lastName} onChange={set("lastName")} error={fieldErrors.lastName} autoComplete="family-name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Gender" required value={form.gender} onChange={set("gender")} error={fieldErrors.gender}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SelectField>
              <InputField label="Date of birth" required type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} error={fieldErrors.dateOfBirth} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Phone" required type="tel" value={form.phone} onChange={set("phone")} error={fieldErrors.phone} autoComplete="tel" />
              <InputField label="Email (optional)" type="email" value={form.email} onChange={set("email")} error={fieldErrors.email} autoComplete="email" />
            </div>
            <TextareaField label="Home address" required rows={2} value={form.address} onChange={set("address")} error={fieldErrors.address} maxLength={500} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Current level / class" required value={form.currentLevel} onChange={set("currentLevel")} error={fieldErrors.currentLevel}>
                <option value="">Select level…</option>
                {school.levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </SelectField>
              <InputField
                label="Previous madrasa (optional)"
                value={form.previousMadrasa}
                onChange={set("previousMadrasa")}
                hint="Leave empty if this is the child's first school."
              />
            </div>
          </Fieldset>

          <Fieldset legend="Parent / guardian" className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Full name" required value={form.parentName} onChange={set("parentName")} error={fieldErrors.parentName} />
              <InputField label="Phone" required type="tel" value={form.parentPhone} onChange={set("parentPhone")} error={fieldErrors.parentPhone} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Email (optional)" type="email" value={form.parentEmail} onChange={set("parentEmail")} error={fieldErrors.parentEmail} />
              <InputField
                label="Relationship to child"
                required
                value={form.relationship}
                onChange={set("relationship")}
                placeholder="e.g. mother, father, guardian"
              />
            </div>
          </Fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-950 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-forest-900 disabled:opacity-60 sm:w-auto"
          >
            {submitting ? <Spinner /> : <Send className="size-4" aria-hidden />}
            {submitting ? "Submitting…" : "Submit application"}
          </button>
          <p className="mt-4 max-w-lg text-xs leading-relaxed text-ink-500">
            Submitting shares this information with the school's admissions office only (see our footer contact for questions).
            Already have an application number?{" "}
            <Link to="/application-status" className="font-semibold text-primary-800 hover:text-primary-600">
              Check its status here
            </Link>
            .
          </p>
        </form>
      </section>
    </PageShell>
  );
}
