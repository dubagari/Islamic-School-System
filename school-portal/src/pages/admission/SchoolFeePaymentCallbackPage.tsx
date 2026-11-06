import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleCheck, ReceiptText } from "lucide-react";

import {
  publicFeeErrorMessage,
  publicSchoolFeeStorage,
  verifyPublicSchoolFeePayment,
  type PublicFeePaymentVerification,
} from "@/features/fees/publicApi";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/Fields";
import { formatDate, formatNaira } from "@/features/student/api";

export function SchoolFeePaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";

  const stored = publicSchoolFeeStorage.get();
  const [applicationNumber, setApplicationNumber] = useState(
    stored?.applicationNumber ?? searchParams.get("applicationNumber") ?? "",
  );
  const [phone, setPhone] = useState(stored?.phone ?? searchParams.get("phone") ?? "");
  const [verification, setVerification] =
    useState<PublicFeePaymentVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const autoVerifyAttempted = useRef(false);

  const verify = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!reference) return;
    setError(null);
    setVerifying(true);

    try {
      const result = await verifyPublicSchoolFeePayment({
        applicationNumber,
        phone,
        reference,
      });
      setVerification(result);
      publicSchoolFeeStorage.clear();
    } catch (err) {
      setError(publicFeeErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!reference || !stored || autoVerifyAttempted.current) return;
    autoVerifyAttempted.current = true;
    void verify();
  }, [reference, stored]);

  if (!reference) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4">
        <Card>
          <Alert tone="error">
            Your browser did not return a Paystack reference. Please go back to
            your invoice and retry your payment.
          </Alert>
          <button
            type="button"
            onClick={() => {
              publicSchoolFeeStorage.clear();
              window.location.assign("/school-fee-payment");
            }}
            className="mt-3 inline-flex items-center rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            Back
          </button>
        </Card>
      </main>
    );
  }

  const invoiceNumber = verification?.invoice?.invoiceNumber ?? stored?.invoiceNumber;

  if (verification) {
    const payment = verification.payment;
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
        <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
          <div className="text-center">
            <CircleCheck
              className="mx-auto mb-3 size-10 text-primary-600"
              aria-hidden
            />
            <h1 className="text-2xl font-bold text-ink-900">Payment successful</h1>
            <p className="mt-1 text-sm text-ink-500">
              Your school fee payment has been recorded.
            </p>
          </div>

          <dl className="mt-5 grid gap-2 rounded-card border border-primary-100 bg-primary-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Invoice</dt>
              <dd className="font-medium text-ink-900">{invoiceNumber ?? "—"}</dd>
            </div>
            {payment?.receiptNumber && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Receipt</dt>
                <dd className="font-mono text-ink-900">
                  {payment.receiptNumber}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Amount paid</dt>
              <dd className="font-medium text-ink-900">
                {formatNaira(payment?.amount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Paid at</dt>
              <dd className="text-ink-900">{formatDate(payment?.paidAt)}</dd>
            </div>
          </dl>

          <Alert tone="info" className="mt-4">
            You can now sign in with your application or registration number.
          </Alert>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/login?identifier=${encodeURIComponent(
                applicationNumber.trim(),
              )}`}
              className="inline-flex select-none items-center justify-center rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800 active:bg-primary-900"
            >
              Go to portal login
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                publicSchoolFeeStorage.clear();
                window.location.assign("/school-fee-payment");
              }}
            >
              Pay another school fee
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
        <div className="text-center">
          <ReceiptText className="mx-auto mb-3 size-8 text-primary-600" aria-hidden />
          <h1 className="text-xl font-bold text-ink-900">Verify payment</h1>
          <p className="mt-1 text-sm text-ink-500">
            Reference{" "}
            <span className="font-mono font-semibold text-ink-800">
              {reference}
            </span>
          </p>
        </div>

        {error && (
          <Alert tone="error" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={verify} className="mt-5 grid gap-4" noValidate>
          <InputField
            label="Application number"
            required
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
            placeholder="DU/ADM/2026/00001"
            autoComplete="off"
          />
          <InputField
            label="Phone on application"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Used to verify your identity."
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={verifying}
            className="w-full"
          >
            Verify payment
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-500">
          Can't verify? The Paystack webhook may still be processing.
        </p>
      </div>
    </main>
  );
}
