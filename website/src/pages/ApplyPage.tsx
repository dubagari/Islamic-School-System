import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, Copy, FileDown, ImageUp, Mail, Phone, Send, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/pages/AboutPage";
import { Spinner } from "@/components/PageLoader";
import { school } from "@/content/site";
import { apiErrorMessage, apiFetch, apiUpload, applicationPdfUrl, ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, type UploadPayload } from "@/lib/api";
import { InputField, SelectField, TextareaField } from "@/components/Fields";
import { cn } from "@/lib/cn";

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

const today = new Date().toISOString().slice(0, 10);
const minDob = `${Number(new Date().getFullYear()) - 40}-01-01`;

function FormSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-card border border-ink-100 bg-white p-5 pb-6 shadow-card sm:p-6 sm:pb-8", className)}
    >
      <header className="flex items-start gap-3.5 border-b border-ink-100 pb-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-950 text-sm font-bold text-gold-400" aria-hidden>
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight text-ink-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>}
        </div>
      </header>
      <div className="grid gap-4 pt-5">{children}</div>
    </section>
  );
}

function TimelineItem({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {index < school.admissionsSteps.length - 1 && (
        <span className="absolute inset-y-0 start-[11px] top-5 h-[calc(100%-1.25rem)] w-px bg-gold-500/30" aria-hidden />
      )}
      <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-[11px] font-bold text-gold-700 ring-1 ring-gold-500/30">
        {index + 1}
      </span>
      <div>
        <p className="text-[13px] font-bold text-ink-900">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500">{text}</p>
      </div>
    </li>
  );
}

export function ApplyPage() {
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ApplicationForm) =>
    (event: { target: { value: string } }) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setError("Passport photo must be a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Passport photo must be smaller than 2MB.");
      return;
    }
    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
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
    if (!validate()) {
      setError("Please correct the highlighted fields below, then submit again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const uploadForm = new FormData();
        uploadForm.append("photo", photo);
        const uploaded = await apiUpload<UploadPayload>("/uploads/photo", uploadForm);
        photoUrl = uploaded.photoUrl;
      }

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
          photoUrl,
        }),
      });
      setApplicationNumber(data.applicationNumber ?? "");
      setSubmittedPhone(form.phone.trim());
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit the application. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const copyApplicationNumber = async () => {
    if (!applicationNumber) return;
    try {
      await navigator.clipboard.writeText(applicationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the number is also selectable
    }
  };

  if (applicationNumber !== null) {
    return (
      <PageShell>
        <PageHero eyebrow="Application submitted" title="Jazakum Allahu khayran" arabic="بارك الله فيكم" />
        <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          <article className="overflow-hidden rounded-card border border-ink-100 bg-white shadow-card">
            <div className="border-b border-ink-100 bg-forest-50/60 px-6 py-8 text-center sm:px-10">
              <img
                src="/logo.png"
                alt=""
                className="mx-auto size-16 rounded-full shadow-card"
                width={64}
                height={64}
                aria-hidden
              />
              <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-900">Your application has been received</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
                The school office will contact the parent/guardian phone number provided for the placement interview.
              </p>
            </div>

            <div className="px-6 py-8 text-center sm:px-10">
              <div className="mx-auto max-w-sm rounded-card border border-gold-500/30 bg-gold-500/10 px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Your application number</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-wide text-ink-900 select-all" aria-live="polite">
                  {applicationNumber || "—"}
                </p>
                <button
                  type="button"
                  onClick={copyApplicationNumber}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-500"
                >
                  {copied ? <CheckCircle2 className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied ? "Copied!" : "Copy number"}
                </button>
              </div>
              <p className="mt-3 text-xs text-ink-500">Save this number — you need it to check your status any time.</p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/application-status"
                  className="rounded-lg bg-forest-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-900"
                >
                  Check status now
                </Link>
                <a
                  href={applicationPdfUrl(applicationNumber, submittedPhone)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gold-500/50 bg-gold-500/10 px-5 py-2.5 text-sm font-bold text-ink-800 transition-colors hover:border-gold-600"
                >
                  <FileDown className="size-4" aria-hidden />
                  Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setApplicationNumber(null);
                    setSubmittedPhone("");
                    clearPhoto();
                  }}
                  className="rounded-lg border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-primary-600"
                >
                  Submit another application
                </button>
              </div>
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
      <section className="mx-auto max-w-6xl px-4 mt-6 pb-16 sm:px-6 sm:pb-20">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
          <form onSubmit={handleSubmit} noValidate aria-label="Admission application" className="grid gap-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <FormSection
              step="01"
              title="Student's information"
              description="Tell us about the child applying — as written on their birth record."
            >
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
                <InputField
                  label="Date of birth"
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set("dateOfBirth")}
                  error={fieldErrors.dateOfBirth}
                  min={minDob}
                  max={today}
                />
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

              {/* Passport photo */}
              <div className="rounded-card border border-ink-100 bg-forest-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-ink-800">Passport photo (optional)</span>
                  <span className="text-[11px] text-ink-400">JPG, PNG or WEBP — up to 2MB</span>
                </div>
                {photoPreview && photo ? (
                  <div className="mt-3 flex items-center gap-4">
                    <img
                      src={photoPreview}
                      alt={`Selected passport photo of ${form.firstName || "the applicant"}`}
                      className="size-20 rounded-full border border-ink-200 object-cover shadow-card"
                    />
                    <div className="min-w-0 text-xs text-ink-600">
                      <p className="truncate font-semibold text-ink-800">{photo.name}</p>
                      <p className="mt-0.5">{(photo.size / 1024).toFixed(0)} KB</p>
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 font-semibold text-ink-700 transition-colors hover:border-red-300 hover:text-red-700"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Remove photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className="mt-3 flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-ink-300 bg-white px-6 py-6 text-center transition-colors hover:border-primary-600 hover:bg-primary-700/5"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-forest-950/5 text-ink-500 ring-1 ring-ink-200">
                      <ImageUp className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-ink-800">
                      <span className="text-primary-800">Click to upload</span> the applicant's photo
                    </span>
                    <span className="text-[11px] text-ink-400">A clear, recent face photo helps us match records</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>
            </FormSection>

            <FormSection
              step="02"
              title="Parent / guardian"
              description="We contact this person for the placement interview and all admission updates."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Full name" required value={form.parentName} onChange={set("parentName")} error={fieldErrors.parentName} autoComplete="name" />
                <InputField label="Phone" required type="tel" value={form.parentPhone} onChange={set("parentPhone")} error={fieldErrors.parentPhone} autoComplete="tel" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Email (optional)" type="email" value={form.parentEmail} onChange={set("parentEmail")} error={fieldErrors.parentEmail} autoComplete="email" />
                <InputField
                  label="Relationship to child"
                  required
                  value={form.relationship}
                  onChange={set("relationship")}
                  placeholder="e.g. mother, father, guardian"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
                <p className="max-w-md text-xs leading-relaxed text-ink-500">
                  Submitting shares this information with the school's admissions office only. Have an application number already?{" "}
                  <Link to="/application-status" className="font-semibold text-primary-800 hover:text-primary-600">
                    Check its status
                  </Link>
                  .
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 rounded-lg bg-forest-950 px-7 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-forest-900 disabled:opacity-60"
                >
                  {submitting ? <Spinner /> : <Send className="size-4" aria-hidden />}
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </div>
            </FormSection>
          </form>

          {/* Aside: contact + process */}
          <aside className="grid gap-5 lg:sticky lg:top-20" aria-label="Admission help">
            <div className="rounded-card border border-ink-100 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="" className="size-10 rounded-full" width={40} height={40} aria-hidden />
                <div>
                  <p className="text-sm font-bold text-ink-900">Need help applying?</p>
                  <p className="text-[11px] text-ink-500">The admissions office is glad to assist.</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2.5 text-xs text-ink-600">
                <li className="flex items-center gap-2.5">
                  <Phone className="size-3.5 shrink-0 text-gold-700" aria-hidden />
                  <a href={`tel:${school.contact.phone.replace(/[^+\d]/g, "")}`} className="font-semibold text-ink-800 hover:text-primary-800">
                    {school.contact.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="size-3.5 shrink-0 text-gold-700" aria-hidden />
                  <a href={`mailto:${school.contact.email}`} className="truncate hover:text-primary-800">
                    {school.contact.email}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="size-3.5 shrink-0 text-gold-700" aria-hidden />
                  <span>{school.contact.officeHours}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-card border border-ink-100 bg-white p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-800">After you apply</p>
              <ol className="mt-4 grid">
                {school.admissionsSteps.map((item, index) => (
                  <TimelineItem key={item.title} index={index} title={item.title} text={item.text} />
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
