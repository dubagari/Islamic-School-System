import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";

import {
  feePaymentStorage,
  verifyFeePaystackPayment,
  type FeePaymentVerification,
  formatDate,
  formatNaira,
} from "@/features/student/api";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function FeePaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const storedInit = feePaymentStorage.get();

  const [verification, setVerification] =
    useState<FeePaymentVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const autoVerifyAttempted = useRef(false);

  const invoiceNumber = useMemo(() => {
    if (!verification?.invoice) return storedInit?.invoiceNumber ?? "—";
    return verification.invoice.invoiceNumber ?? storedInit?.invoiceNumber ?? "—";
  }, [verification, storedInit]);

  const verify = async () => {
    if (!reference) return;
    setError(null);
    setRetrying(true);
    try {
      const result = await verifyFeePaystackPayment({ reference });
      setVerification(result);
      feePaymentStorage.clear();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not verify this payment. Please try again.",
      );
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (!reference || autoVerifyAttempted.current) {
      return;
    }
    autoVerifyAttempted.current = true;
    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (!reference) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4">
        <Card>
          <Alert tone="error">
            Your browser did not return a Paystack reference. Please go back to
            your invoice and retry your payment.
          </Alert>
          <Button className="mt-3" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Card>
      </main>
    );
  }

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
              Your school fee payment has been processed.
            </p>
          </div>

          <dl className="mt-5 grid gap-2 rounded-card border border-primary-100 bg-primary-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500">Invoice</dt>
              <dd className="font-medium text-ink-900">{invoiceNumber}</dd>
            </div>
            {payment?.receiptNumber && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Receipt</dt>
                <dd className="font-mono text-ink-900">{payment.receiptNumber}</dd>
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

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/student/fees")}
              className="w-full sm:w-auto"
            >
              Back to fees
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
        <h1 className="text-xl font-bold text-ink-900">Verify payment</h1>
        <p className="mt-1 text-sm text-ink-500">
          Reference{" "}
          <span className="font-mono font-semibold text-ink-800">{reference}</span>
        </p>

        {error && (
          <Alert tone="error" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="mt-5">
          <Button
            onClick={() => void verify()}
            loading={retrying}
            className="w-full"
          >
            Verify payment
          </Button>
        </div>
      </div>
    </main>
  );
}
