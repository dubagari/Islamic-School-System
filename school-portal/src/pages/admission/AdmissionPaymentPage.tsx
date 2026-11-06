import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileDown, ReceiptText, Wallet } from "lucide-react";

import {
  admissionPaymentStorage,
  downloadAdmissionLetterByPhone,
  getAdmissionPaymentSummary,
  initializeAdmissionPaystackPayment,
  type AdmissionPaymentSummary,
} from "@/features/admission/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  FieldError,
  InputField,
} from "@/components/ui/Fields";
import { cn } from "@/lib/cn";

const ERROR_MESSAGES: Record<string, string> = {
  "Admission application not found.":
    "We could not find that application. Double-check the number and phone number.",
  "Application not found or phone number does not match.":
    "We could not find that application. Double-check the number and phone number.",
};

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-900 ring-amber-300",
  Approved: "bg-primary-700 text-white ring-emerald-300",
  Rejected: "bg-red-100 text-red-900 ring-red-300",
};

export function AdmissionPaymentPage() {
  const [searchParams] = useSearchParams();
  const applicationNumberFromQuery =
    searchParams.get("applicationNumber") ?? "";

  const [applicationNumber, setApplicationNumber] = useState(
    applicationNumberFromQuery
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState<AdmissionPaymentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [startingPaystack, setStartingPaystack] = useState(false);
  const [downloadingLetter, setDownloadingLetter] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    if (!summary) return "";
    const [a, b, c] = [
      summary.application.firstName,
      summary.application.middleName,
      summary.application.lastName,
    ].filter(Boolean);
    return [a, b, c].filter(Boolean).join(" ");
  }, [summary]);

  const fmtMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `₦${value.toLocaleString()}`;
  };

  const fmtDate = (value: string | null | undefined) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const lookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const nextErrors: Record<string, string> = {};
    if (!applicationNumber.trim())
      nextErrors.applicationNumber = "Application number is required.";
    if (!phone.trim()) nextErrors.phone = "Phone number is required.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setChecking(true);
    try {
      const result = await getAdmissionPaymentSummary(
        applicationNumber,
        phone
      );
      setSummary(result);
      admissionPaymentStorage.setPhone(phone.trim());
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? ERROR_MESSAGES[err.message] ?? err.message
          : "Payment lookup failed. Please try again.";
      setError(message);
      setSummary(null);
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async () => {
    if (!summary) return;
    setError(null);
    setStartingPaystack(true);

    try {
      const paystack = await initializeAdmissionPaystackPayment({
        applicationNumber: summary.application.applicationNumber,
        phone: phone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      window.location.assign(paystack.authorizationUrl);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not start the Paystack payment.";
      setError(message);
      setStartingPaystack(false);
    }
  };

  const handleDownloadLetter = async () => {
    if (!summary || !phone.trim()) return;
    setDownloadingLetter(true);
    setLetterError(null);
    try {
      await downloadAdmissionLetterByPhone({
        applicationNumber: summary.application.applicationNumber,
        phone: phone.trim(),
      });
    } catch (err) {
      setLetterError(
        err instanceof Error
          ? err.message
          : "Could not download the admission letter.",
      );
    } finally {
      setDownloadingLetter(false);
    }
  };

  const alreadyPaid = summary?.application.paymentStatus === "Paid";
  const amountDue = summary?.feeAmount ?? 0;
  const feeConfigured = amountDue > 0;

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
        <div className="text-center">
          <img
            src="/logo.png"
            alt=""
            className="mx-auto mb-4 size-14 rounded-full shadow-card"
            width={56}
            height={56}
            aria-hidden
          />
          <h1 className="text-xl font-bold text-ink-900">
            Pay admission fee
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Securely complete your admission payment using Paystack.
          </p>
        </div>

        {error && (
          <Alert tone="error" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!summary ? (
          <form onSubmit={lookup} className="mt-5 grid gap-4" noValidate>
            <InputField
              label="Application number"
              required
              value={applicationNumber}
              onChange={(e) => setApplicationNumber(e.target.value)}
              error={fieldErrors.applicationNumber}
              placeholder="DU/ADM/2026/00001"
              autoComplete="off"
            />
            <InputField
              label="Phone on application"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
              hint="Used to verify your identity."
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={checking}
              className="w-full"
            >
              Find application
            </Button>
          </form>
        ) : (
          <Card className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-ink-900">
                {summary.application.applicationNumber}
              </p>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset",
                  statusStyles[summary.application.status] ??
                    "bg-ink-100 text-ink-800"
                )}
              >
                {summary.application.status}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Applicant
                </dt>
                <dd className="font-medium text-ink-900">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Level
                </dt>
                <dd className="text-ink-800">
                  {summary.application.currentLevel}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Payment status
                </dt>
                <dd className="font-medium text-ink-900">
                  {summary.application.paymentStatus}
                </dd>
              </div>
            </dl>

            {summary.application.status !== "Approved" && (
              <Alert tone="warning" className="mt-4">
                Only approved applications can be paid for online. Please contact
                the admissions office.
              </Alert>
            )}

            {summary.application.status === "Approved" && alreadyPaid && (
              <>
                <Alert tone="success" className="mt-4">
                  This application has already been paid. If you need your login
                  details, contact the admissions office.
                </Alert>
                <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText
                      className="size-4 text-emerald-700"
                      aria-hidden
                    />
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      Payment details
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-ink-500">Amount paid</dt>
                      <dd className="font-bold text-ink-900">
                        {fmtMoney(summary.application.paymentAmount)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-ink-500">Method</dt>
                      <dd className="font-medium text-ink-800">
                        {summary.application.paymentMethod ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-ink-500">Reference</dt>
                      <dd className="font-mono text-xs font-medium text-ink-800">
                        {summary.application.paymentReference ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-xs text-ink-500">Paid on</dt>
                      <dd className="font-medium text-ink-800">
                        {fmtDate(summary.application.paidAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {letterError && (
                  <Alert
                    tone="error"
                    className="mt-4"
                    onDismiss={() => setLetterError(null)}
                  >
                    {letterError}
                  </Alert>
                )}

                <Button
                  className="mt-4 w-full"
                  size="lg"
                  icon={<FileDown className="size-4" aria-hidden />}
                  loading={downloadingLetter}
                  onClick={() => void handleDownloadLetter()}
                >
                  Download admission letter
                </Button>

                <p className="mt-2 text-center text-xs text-ink-500">
                  Next step: pay your school fee with your application number
                  {summary.schoolFee > 0
                    ? ` (${fmtMoney(summary.schoolFee)})`
                    : ""}.
                </p>

                <Link
                  to={`/school-fee-payment?applicationNumber=${encodeURIComponent(
                    summary.application.applicationNumber,
                  )}`}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
                >
                  Pay school fee
                </Link>
              </>
            )}

            {summary.application.status === "Approved" && !alreadyPaid && (
              <>
                {summary.emailRequired && (
                  <div className="mt-4">
                    <InputField
                      label="Email for Paystack"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <FieldError
                      error={
                        email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                          ? "Enter a valid email."
                          : undefined
                      }
                    />
                  </div>
                )}

                {!feeConfigured ? (
                  <Alert tone="warning" className="mt-4">
                    The admission fee has not been configured yet. Please
                    contact the school office before paying.
                  </Alert>
                ) : (
                  <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-primary-800">
                        Amount due
                      </span>
                      <span className="text-lg font-bold text-ink-900">
                        {fmtMoney(summary.feeAmount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      One-time admission/acceptance fee, charged in naira via
                      Paystack.
                    </p>
                  </div>
                )}

                <div className="mt-2 rounded-lg border border-ink-100 bg-forest-50/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-500">
                      School fee (after registration)
                    </span>
                    <span className="text-sm font-semibold text-ink-900">
                      {summary.schoolFee > 0
                        ? fmtMoney(summary.schoolFee)
                        : "Contact office"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Payable from the student portal after an invoice is issued.
                  </p>
                </div>

                <Button
                  className="mt-4 w-full"
                  size="lg"
                  loading={startingPaystack}
                  disabled={
                    !feeConfigured ||
                    (summary.emailRequired &&
                      (!email.trim() ||
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())))
                  }
                  onClick={() => void startPayment()}
                  icon={<Wallet className="size-4" aria-hidden />}
                >
                  {feeConfigured
                    ? `Pay ${fmtMoney(summary.feeAmount)} with Paystack`
                    : "Pay with Paystack"}
                </Button>
              </>
            )}
          </Card>
        )}

        {summary?.application.status === "Rejected" && (
          <Alert tone="error" className="mt-4">
            Your application was rejected. Please contact the admissions office.
          </Alert>
        )}

        <p className="mt-6 text-center text-xs text-ink-500">
          Payment receipts are issued by Paystack. Questions? Reach the school
          front office.
        </p>
        <p className="mt-2 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Go to portal login
          </Link>
        </p>
      </div>
    </main>
  );
}
