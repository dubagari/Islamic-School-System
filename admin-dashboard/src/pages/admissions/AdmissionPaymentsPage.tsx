import { useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Banknote,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  DataTable,
  type Column,
} from "@/components/ui/DataTable";
import { InputField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  formatNaira,
  useConfirmCashPaymentMutation,
  useGetAdmissionsQuery,
  useInitializePaystackPaymentMutation,
  useVerifyPaystackPaymentMutation,
  toFieldErrors,
  type AdmissionApplication,
  type PaystackInitResult,
} from "@/features/admissions/api";

const PAGE_LIMIT = 10;

type Feedback = { tone: "success" | "error"; message: string } | null;

export function AdmissionPaymentsPage() {
  const [page, setPage] = useState(1);

  const [cashApplication, setCashApplication] =
    useState<AdmissionApplication | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashReference, setCashReference] = useState("");

  const [paystackApplication, setPaystackApplication] =
    useState<AdmissionApplication | null>(null);
  const [paystackAmount, setPaystackAmount] = useState("");
  const [paystackEmail, setPaystackEmail] = useState("");
  const [paystackInit, setPaystackInit] = useState<PaystackInitResult | null>(
    null,
  );

  const [feedback, setFeedback] = useState<Feedback>(null);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdmissionsQuery({
    page,
    limit: PAGE_LIMIT,
    status: "Approved",
    paymentStatus: "Pending",
  });

  const [confirmCashPayment, cashPaymentResult] =
    useConfirmCashPaymentMutation();
  const [initializePaystackPayment, paystackInitResult] =
    useInitializePaystackPaymentMutation();
  const [verifyPaystackPayment, paystackVerifyResult] =
    useVerifyPaystackPaymentMutation();

  const applications = data?.data;

  // The service documents the list as paginated; filter to Approved +
  // Pending payment happens server-side via query params.
  const columns: Column<AdmissionApplication>[] = [
    {
      key: "applicationNumber",
      header: "Application #",
      render: (item) => (
        <span className="font-mono text-[13px] text-ink-800">
          {item.applicationNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Applicant",
      render: (item) => (
        <span className="font-medium text-ink-900">
          {[item.firstName, item.lastName].filter(Boolean).join(" ")}
        </span>
      ),
    },
    { key: "currentLevel", header: "Level", render: (item) => item.currentLevel },
    { key: "phone", header: "Phone", render: (item) => item.phone },
    {
      key: "method",
      header: "Method",
      render: (item) => (
        <span className="text-xs text-ink-600">
          {item.paymentMethod ?? "—"}
          {item.paymentReference && (
            <span className="block font-mono text-[11px] text-ink-400">
              {item.paymentReference}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Confirm payment",
      align: "end",
      render: (item) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={<Banknote className="size-3.5" aria-hidden />}
            onClick={() => {
              setCashApplication(item);
              setCashAmount("");
              setCashReference("");
            }}
          >
            Cash
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<ShieldCheck className="size-3.5" aria-hidden />}
            onClick={() => {
              setPaystackApplication(item);
              setPaystackAmount("");
              setPaystackEmail(item.email ?? "");
              setPaystackInit(null);
            }}
          >
            Paystack
          </Button>
          {item.paymentMethod === "Paystack" && item.paymentReference && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                void runVerify({ reference: item.paymentReference as string })
              }
              loading={verifyingRef === item.paymentReference}
            >
              Verify
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ======================================================
  // Cash payment
  // ======================================================

  const handleCashPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cashApplication) return;

    const amount = Number(cashAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setFeedback({
        tone: "error",
        message: "A valid payment amount greater than 0 is required.",
      });
      return;
    }

    try {
      await confirmCashPayment({
        applicationId: cashApplication._id,
        amount,
        paymentReference: cashReference.trim() || undefined,
      }).unwrap();
      setFeedback({
        tone: "success",
        message: `Cash payment of ${formatNaira(amount)} confirmed for ${
          cashApplication.applicationNumber ??
          `${cashApplication.firstName} ${cashApplication.lastName}`
        }.`,
      });
      setCashApplication(null);
    } catch (error) {
      setCashApplication(null);
      setFeedback({
        tone: "error",
        message: toFieldErrors(error).message,
      });
    }
  };

  // ======================================================
  // Paystack payment
  // ======================================================

  const handlePaystackInit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paystackApplication) return;

    const amount = Number(paystackAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setFeedback({
        tone: "error",
        message: "A valid payment amount greater than 0 is required.",
      });
      return;
    }

    try {
      const result = await initializePaystackPayment({
        applicationId: paystackApplication._id,
        amount,
        email: paystackEmail.trim() || undefined,
      }).unwrap();
      setPaystackInit(result.data);
    } catch (error) {
      setPaystackApplication(null);
      setFeedback({
        tone: "error",
        message: toFieldErrors(error).message,
      });
    }
  };

  const runVerify = async ({
    reference,
  }: {
    reference: string;
  }) => {
    setVerifyingRef(reference);
    try {
      await verifyPaystackPayment({ reference }).unwrap();
      setPaystackApplication(null);
      setPaystackInit(null);
      setFeedback({
        tone: "success",
        message: `Paystack payment verified successfully (${reference}).`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: toFieldErrors(error).message,
      });
    } finally {
      setVerifyingRef(null);
    }
  };

  // ======================================================
  // Render
  // ======================================================

  return (
    <>
      <PageHeader
        title="Admission payments"
        description="Confirm payments for approved admission applications awaiting payment."
      />

      {feedback && (
        <Alert
          tone={feedback.tone}
          onDismiss={() => setFeedback(null)}
          className="mb-4"
        >
          {feedback.message}
        </Alert>
      )}

      {isError && (
        <Alert tone="error" title="Failed to load pending payments" className="mb-4">
          Something went wrong while fetching pending-payment applicants.
          <Button size="sm" variant="outline" className="ms-2" onClick={() => refetch()}>
            Retry
          </Button>
        </Alert>
      )}

      {isLoading && !data ? (
        <Card padded={false}>
          <PageLoader />
        </Card>
      ) : (
        <Card padded={false}>
          <DataTable
            columns={columns}
            data={applications}
            isLoading={false}
            rowKey={(item) => item._id}
            emptyTitle="No pending payments"
            emptyDescription="Approved applications awaiting payment will appear here once available."
            emptyAction={
              <Button variant="outline" onClick={() => refetch()}>
                Refresh
              </Button>
            }
            mobileCard={(item) => (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink-500">
                    {item.applicationNumber ?? "—"}
                  </span>
                  <StatusBadge status={item.paymentStatus} />
                </div>
                <p className="font-medium text-ink-900">
                  {[item.firstName, item.lastName].filter(Boolean).join(" ")}
                </p>
                <p className="text-xs text-ink-500">
                  {item.currentLevel} · {item.phone}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                  {item.paymentMethod === "Paystack" && item.paymentReference && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void runVerify({
                          reference: item.paymentReference as string,
                        })
                      }
                      loading={verifyingRef === item.paymentReference}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCashApplication(item);
                      setCashAmount("");
                      setCashReference("");
                    }}
                  >
                    Cash
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPaystackApplication(item);
                      setPaystackEmail(item.email ?? "");
                      setPaystackInit(null);
                    }}
                  >
                    Paystack
                  </Button>
                </div>
              </div>
            )}
          />
          <PagedFooter pagination={data?.pagination} onPageChange={setPage} />
        </Card>
      )}

      {/* ======================================================
          Cash payment dialog
        ====================================================== */}
      <Dialog
        open={cashApplication !== null}
        onClose={() => setCashApplication(null)}
        title="Confirm cash payment"
        description={
          cashApplication
            ? `Record a cash payment for ${
                cashApplication.applicationNumber ??
                `${cashApplication.firstName} ${cashApplication.lastName}`
              }.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCashApplication(null)}
              disabled={cashPaymentResult.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="cash-payment-form"
              loading={cashPaymentResult.isLoading}
            >
              Confirm payment
            </Button>
          </>
        }
      >
        <form id="cash-payment-form" onSubmit={handleCashPayment} noValidate>
          <div className="grid gap-4">
            <InputField
              label="Amount (₦)"
              required
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              error={
                feedback?.tone === "error" &&
                feedback.message.toLowerCase().includes("amount")
                  ? feedback.message
                  : undefined
              }
            />
            <InputField
              label="Payment reference"
              hint="Optional — auto-generated if left blank"
              value={cashReference}
              onChange={(e) => setCashReference(e.target.value)}
            />
          </div>
        </form>
      </Dialog>

      {/* ======================================================
          Paystack payment dialog
        ====================================================== */}
      <Dialog
        open={paystackApplication !== null}
        onClose={() => {
          setPaystackApplication(null);
          setPaystackInit(null);
        }}
        title="Paystack payment"
        description={
          paystackApplication
            ? `Initialize an online payment for ${
                paystackApplication.applicationNumber ??
                `${paystackApplication.firstName} ${paystackApplication.lastName}`
              }.`
            : undefined
        }
        size="md"
        footer={
          paystackInit ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPaystackApplication(null);
                  setPaystackInit(null);
                }}
                disabled={paystackVerifyResult.isLoading}
              >
                Close
              </Button>
              <Button
                onClick={() =>
                  void runVerify({ reference: paystackInit.reference })
                }
                loading={paystackVerifyResult.isLoading}
                icon={<BadgeCheck className="size-4" aria-hidden />}
              >
                Verify payment
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setPaystackApplication(null)}
                disabled={paystackInitResult.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="paystack-init-form"
                loading={paystackInitResult.isLoading}
              >
                Initialize payment
              </Button>
            </>
          )
        }
      >
        {paystackInit ? (
          <div className="space-y-3 text-sm">
            <dl className="divide-y divide-ink-100">
              <DetailRow label="Amount" value={formatNaira(paystackInit.amount)} />
              <DetailRow
                label="Reference"
                value={paystackInit.reference}
                mono
              />
            </dl>
            <p className="text-xs text-ink-500">
              Share the checkout link with the applicant to complete the online
              payment, then verify the transaction here.
            </p>
            <a
              href={paystackInit.authorizationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              <ExternalLink className="size-4" aria-hidden />
              Open Paystack checkout
            </a>
            {feedback?.tone === "error" && (
              <Alert tone="error">{feedback.message}</Alert>
            )}
          </div>
        ) : (
          <form id="paystack-init-form" onSubmit={handlePaystackInit} noValidate>
            <div className="grid gap-4">
              <InputField
                label="Amount (₦)"
                required
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={paystackAmount}
                onChange={(e) => setPaystackAmount(e.target.value)}
              />
              <InputField
                label="Email"
                hint="Optional — falls back to the applicant's email"
                type="email"
                value={paystackEmail}
                onChange={(e) => setPaystackEmail(e.target.value)}
              />
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

// ======================================================
// Small local helpers
// ======================================================

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd
        className={
          mono ? "font-mono text-[13px] text-ink-900" : "text-[13px] font-medium text-ink-900"
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
