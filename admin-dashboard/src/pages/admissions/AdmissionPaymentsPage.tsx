import { useState, type FormEvent } from "react";
import { Banknote } from "lucide-react";

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
  toFieldErrors,
  type AdmissionApplication,
} from "@/features/admissions/api";

const PAGE_LIMIT = 10;

type Feedback = { tone: "success" | "error"; message: string } | null;

export function AdmissionPaymentsPage() {
  const [page, setPage] = useState(1);
  const [cashApplication, setCashApplication] =
    useState<AdmissionApplication | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cashReference, setCashReference] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const { data, isLoading, isError, refetch } = useGetAdmissionsQuery({
    page,
    limit: PAGE_LIMIT,
    status: "Approved",
    paymentStatus: "Pending",
  });

  const [confirmCashPayment, cashPaymentResult] =
    useConfirmCashPaymentMutation();

  const applications = data?.data;

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
      render: (item) => item.paymentMethod || "—",
    },
    {
      key: "actions",
      header: "Confirm payment",
      align: "end",
      render: (item) => (
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
      ),
    },
  ];

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

  return (
    <>
      <PageHeader
        title="Admission payments"
        description="Record cash payments for approved applications awaiting payment."
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
            emptyDescription="Approved applications awaiting payment will appear here."
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
                  {item.currentLevel} — {item.phone}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => {
                    setCashApplication(item);
                    setCashAmount("");
                    setCashReference("");
                  }}
                >
                  Cash payment
                </Button>
              </div>
            )}
          />
          <PagedFooter pagination={data?.pagination} onPageChange={setPage} />
        </Card>
      )}

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
    </>
  );
}
