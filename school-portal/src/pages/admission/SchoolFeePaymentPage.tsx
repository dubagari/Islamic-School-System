import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CircleCheck,
  CircleX,
  FileText,
  Wallet,
} from "lucide-react";

import {
  initializePublicSchoolFeePayment,
  lookupPublicSchoolFeeSummary,
  publicFeeErrorMessage,
  publicSchoolFeeStorage,
  type PublicSchoolFeeLookup,
} from "@/features/fees/publicApi";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/Fields";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira } from "@/features/student/api";

const invoiceStatusStyles: Record<string, string> = {
  Unpaid: "bg-amber-100 text-amber-900 ring-amber-300",
  "Partially Paid": "bg-blue-100 text-blue-900 ring-blue-300",
  Overdue: "bg-red-100 text-red-900 ring-red-300",
  Paid: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  Cancelled: "bg-ink-100 text-ink-700 ring-ink-300",
};

export function SchoolFeePaymentPage() {
  const [searchParams] = useSearchParams();
  const queryApplicationNumber = searchParams.get("applicationNumber") ?? "";

  const [applicationNumber, setApplicationNumber] = useState(
    queryApplicationNumber,
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState<PublicSchoolFeeLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [startingPaystack, setStartingPaystack] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const fullName = [
    summary?.student.firstName,
    summary?.student.middleName,
    summary?.student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const outstandingInvoices =
    summary?.invoices.filter(
      (invoice) =>
        invoice.status !== "Cancelled" && Number(invoice.balance ?? 0) > 0,
    ) ?? [];

  const unpaidCount = summary?.summary.unpaidInvoices ?? 0;

  const lookup = async (event: FormEvent) => {
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
      const result = await lookupPublicSchoolFeeSummary({
        applicationNumber,
        phone,
      });
      setSummary(result);
      publicSchoolFeeStorage.set({
        applicationNumber: applicationNumber.trim(),
        phone: phone.trim(),
      });
    } catch (err) {
      setError(publicFeeErrorMessage(err));
      setSummary(null);
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async (invoiceId: string) => {
    if (!summary) return;
    setError(null);
    setEmail("");
    setPayingInvoiceId(invoiceId);
    setStartingPaystack(true);

    try {
      const paystack = await initializePublicSchoolFeePayment({
        applicationNumber: summary.student.applicationNumber,
        phone: phone.trim(),
        invoiceId,
        ...(email.trim() ? { email: email.trim() } : {}),
      });

      publicSchoolFeeStorage.updatePartial({
        invoiceNumber: paystack.invoiceNumber,
      });
      window.location.assign(paystack.authorizationUrl);
    } catch (err) {
      setError(publicFeeErrorMessage(err));
      setStartingPaystack(false);
      setPayingInvoiceId(null);
    }
  };

  const reset = () => {
    setError(null);
    setSummary(null);
    publicSchoolFeeStorage.clear();
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <img
            src="/logo.png"
            alt=""
            className="mx-auto mb-4 size-14 rounded-full shadow-card"
            width={56}
            height={56}
            aria-hidden
          />
          <h1 className="text-xl font-bold text-ink-900">Pay school fee</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter the application number and phone used for admission.
          </p>
        </div>

        {error && (
          <Alert tone="error" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!summary ? (
          <Card className="mt-5">
            <form onSubmit={lookup} className="grid gap-4" noValidate>
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
                Find school fee
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-ink-500">
              Already paid all school fees?{" "}
              <Link
                to="/login"
                className="font-medium text-primary-700 hover:text-primary-800"
              >
                Go to login
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-ink-900">
                {summary.student.applicationNumber}
              </p>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                  unpaidCount > 0
                    ? "bg-amber-100 text-amber-900 ring-amber-300"
                    : "bg-emerald-100 text-emerald-900 ring-emerald-300",
                )}
              >
                {unpaidCount > 0 ? `${unpaidCount} unpaid` : "Fully paid"}
              </span>
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-500">Student</dt>
                <dd className="font-medium text-ink-900">
                  {fullName || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-500">Registration #</dt>
                <dd className="font-mono text-sm text-ink-900">
                  {summary.student.registrationNumber || "Assigned later"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-500">Level / Class</dt>
                <dd className="font-medium text-ink-800">
                  {summary.student.currentLevel} /{" "}
                  {typeof summary.student.academicClass === "object"
                    ? (summary.student.academicClass?.name ?? "Not assigned")
                    : "Not assigned"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-500">Total billed</dt>
                <dd className="font-medium text-ink-900">
                  {formatNaira(summary.summary.totalBilled)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-500">Amount paid</dt>
                <dd className="font-medium text-ink-900">
                  {formatNaira(summary.summary.totalPaid)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Outstanding balance
                </dt>
                <dd className="text-lg font-bold text-ink-900">
                  {formatNaira(summary.summary.totalBalance)}
                </dd>
              </div>
            </dl>

            {outstandingInvoices.length > 0 ? (
              <div className="mt-5 space-y-3">
                {outstandingInvoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className="rounded-lg border border-ink-100 bg-white p-4"
                  >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText
                            className="size-4 text-primary-600"
                            aria-hidden
                          />
                          <span className="font-mono text-sm font-bold text-ink-900">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset",
                            invoiceStatusStyles[invoice.status ?? ""] ??
                              "bg-ink-100 text-ink-700",
                          )}
                        >
                          {invoice.status ?? "Unpaid"}
                        </span>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-600">
                        <div>
                          <dt className="text-ink-500">Balance</dt>
                          <dd className="font-semibold text-ink-900">
                            {formatNaira(invoice.balance)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-500">Due date</dt>
                          <dd className="font-medium text-ink-900">
                            {formatDate(invoice.dueDate)}
                          </dd>
                        </div>
                      </dl>

                      <Button
                        className="mt-3 w-full"
                        icon={<Wallet className="size-4" aria-hidden />}
                        loading={
                          startingPaystack && payingInvoiceId === invoice._id
                        }
                        onClick={() => void startPayment(invoice._id)}
                      >
                        Pay {formatNaira(invoice.balance)} with Paystack
                      </Button>
                    </div>
                ))}

                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-700">
                      Email for Paystack
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                      placeholder="Optional, if Paystack needs an email"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <Alert tone="success" className="mt-5">
                <div className="flex items-start gap-2">
                  <CircleCheck className="size-5 text-emerald-600" aria-hidden />
                  <div>
                    <p className="font-semibold text-ink-900">
                      All outstanding school fees are paid
                    </p>
                    <p className="mt-1 text-sm text-ink-600">
                      You can now sign in to the student portal.
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={reset}
              >
                Look up another student
              </Button>
              <Link
                to={`/login?identifier=${encodeURIComponent(
                  summary.student.applicationNumber,
                )}`}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-ink-800 transition-colors hover:border-primary-400"
              >
                Go to portal login
              </Link>
            </div>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-ink-500">
          Payment receipts are issued by Paystack. Questions? Contact the school
          office.
        </p>
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-ink-500">
          <CircleX className="size-3 text-ink-400" aria-hidden />
          Application number + phone required
        </p>
      </div>
    </main>
  );
}
