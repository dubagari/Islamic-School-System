import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck, FileDown } from "lucide-react";

import {
  admissionPaymentStorage,
  downloadAdmissionLetterByPhone,
  verifyAdmissionPaystackPayment,
  type AdmissionPaymentVerification,
} from "@/features/admission/api";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Fields";

export function AdmissionPaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const storedPhone = admissionPaymentStorage.getPhone();

  const [phone, setPhone] = useState(storedPhone);
  const [showPhoneForm, setShowPhoneForm] = useState(!storedPhone);
  const [verification, setVerification] = useState<AdmissionPaymentVerification | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [fretrying, setRetrying] = useState(false);
  const [downloadingLetter, setDownloadingLetter] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);
  const autoVerifyAttempted = useRef(false);

  const fullName = useMemo(() => {
    if (!verification) return "";
    const [a, b, c] = [
      verification.application.firstName,
      verification.application.middleName,
      verification.application.lastName,
    ].filter(Boolean);
    return [a, b, c].filter(Boolean).join(" ");
  }, [verification]);

  const needPhone = !reference || showPhoneForm;

  const fmtMoney = (value: number | null | undefined) =>
    value === null || value === undefined
      ? "—"
      : `₦${Number(value).toLocaleString()}`;

  const fmtDate = (value: string | null | undefined) =>
    !value
      ? "—"
      : new Date(value).toLocaleString("en-NG", {
          dateStyle: "medium",
          timeStyle: "short",
        });

  const handleDownloadLetter = async () => {
    const applicationNumber =
      verification?.application.applicationNumber ?? "";
    if (!applicationNumber || !phone.trim()) return;
    setDownloadingLetter(true);
    setLetterError(null);
    try {
      await downloadAdmissionLetterByPhone({
        applicationNumber,
        phone,
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

  const verify = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!reference) return;
    setError(null);
    setRetrying(true);
    try {
      const result = await verifyAdmissionPaystackPayment({
        reference,
        phone: phone.trim(),
      });
      admissionPaymentStorage.setPhone(phone.trim());
      setVerification(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not verify this payment. Please try again."
      );
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (
      !reference ||
      !storedPhone ||
      autoVerifyAttempted.current
    ) {
      return;
    }
    autoVerifyAttempted.current = true;
    void verify();
  }, [reference, storedPhone]);

  if (!reference) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4">
        <Card>
          <Alert tone="error">
            Your browser did not return a Paystack reference. Please go back and
            retry your payment.
          </Alert>
          <Button className="mt-3" onClick={() => navigate("/admission-payment")}>
            Retry
          </Button>
        </Card>
      </main>
    );
  }

  if (verification?.application.paymentStatus === "Paid") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
        <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
          <div className="text-center">
            <CircleCheck className="mx-auto mb-3 size-10 text-primary-600" aria-hidden />
            <h1 className="text-2xl font-bold text-ink-900">Payment successful</h1>
            <p className="mt-1 text-sm text-ink-500">
              Thank you, {fullName}. Your admission payment has been processed.
            </p>
          </div>

          <div className="mt-5 rounded-card border border-primary-100 bg-primary-50 p-4">
            <p className="text-sm font-semibold text-ink-900">
              Student details
            </p>
            <p className="mt-1 text-xs text-ink-600">
              Keep your application and registration numbers safe. Portal
              login details are issued by the admissions office.
            </p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Full name
                </dt>
                <dd className="font-medium text-ink-900">{fullName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Application #
                </dt>
                <dd className="font-mono text-ink-900">
                  {verification.application.applicationNumber}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Registration #
                </dt>
                <dd className="font-mono text-ink-900">
                  {verification.application.registrationNumber || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Level
                </dt>
                <dd className="font-medium text-ink-900">
                  {verification.application.currentLevel || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Amount paid
                </dt>
                <dd className="font-bold text-ink-900">
                  {fmtMoney(verification.application.paymentAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Reference
                </dt>
                <dd className="font-mono text-xs text-ink-900">
                  {verification.application.paymentReference || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide text-ink-500">
                  Paid on
                </dt>
                <dd className="font-medium text-ink-900">
                  {fmtDate(verification.application.paidAt)}
                </dd>
              </div>
            </dl>
          </div>

          <Alert tone="info" className="mt-4">
            Pay your school fee with your application number next.
          </Alert>

          {letterError && (
            <Alert
              tone="error"
              className="mt-4"
              onDismiss={() => setLetterError(null)}
            >
              {letterError}
            </Alert>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              icon={<FileDown className="size-4" aria-hidden />}
              loading={downloadingLetter}
              onClick={() => void handleDownloadLetter()}
              className="w-full sm:w-auto"
            >
              Download admission letter
            </Button>
          <Button
            onClick={() =>
              navigate(
                `/school-fee-payment?applicationNumber=${encodeURIComponent(
                  verification.application.applicationNumber,
                )}`,
              )
            }
            className="w-full sm:w-auto"
          >
            Pay school fee
          </Button>
          <Button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto"
            variant="outline"
          >
            Go to login
          </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                admissionPaymentStorage.clear();
                navigate("/admission-payment");
              }}
            >
              Start another payment
            </Button>
          </div>

          <p className="mt-3 text-center text-xs text-ink-500">
            After signing in, you can see how much you owe for school fees once
            the school issues your invoice.
          </p>
        </div>
      </main>
    );
  }

  if (verification?.application.paymentStatus !== "Paid") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4">
        <Card>
          <Alert tone="error">
            Payment was not completed. Please try again from the admission
            payment page.
          </Alert>
          <Button className="mt-3" onClick={() => navigate("/admission-payment")}>
            Retry payment
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-forest-50 px-4 py-10">
      <div className="w-full max-w-md rounded-card border border-ink-100 bg-white p-6 shadow-card">
        <h1 className="text-xl font-bold text-ink-900">Verify payment</h1>
        <p className="mt-1 text-sm text-ink-500">
          Reference{" "}
          <span className="font-mono font-semibold text-ink-800">
            {reference}
          </span>
        </p>

        {error && (
          <Alert tone="error" className="mt-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {needPhone ? (
          <form onSubmit={verify} className="mt-5 grid gap-4" noValidate>
            <InputField
              label="Phone on application"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="Confirm the phone used on the application."
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={fretrying}
              className="w-full"
            >
              Verify payment
            </Button>
          </form>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => void verify()}
              loading={fretrying}
              className="w-full sm:w-auto"
            >
              Verify payment
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPhoneForm(true);
                setVerification(null);
              }}
            >
              Enter phone again
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
