import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Ban,
  Banknote,
  Printer,
  Undo2,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  PAYMENT_METHODS,
  formatNaira,
  toFieldErrors,
  useGetInvoiceQuery,
  useRecordPaymentMutation,
  useReversePaymentMutation,
  type CreatePaymentBody,
  type Invoice,
  type Payment,
  type PaymentMethod,
} from "@/features/finance/api";
import { isPopulated, refName } from "@/features/students/api";

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<Payment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useGetInvoiceQuery(id ?? "", {
    skip: !id,
  });

  const [recordPayment, { isLoading: submitting }] = useRecordPaymentMutation();
  const [reversePayment, { isLoading: reversing }] = useReversePaymentMutation();

  const invoice = query.data?.data;
  const payments = useMemo(() => query.data?.payments ?? [], [query.data]);

  if (!id) {
    return (
      <div>
        <PageHeader title="Invoice" />
        <EmptyState
          title="Invoice not specified"
          description="Open an invoice from the invoices list."
          action={
            <Link to="/fees/invoices">
              <Button variant="outline" size="sm">
                Back to invoices
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleRecord = async (body: CreatePaymentBody) => {
    const result = await recordPayment(body).unwrap();
    return result;
  };

  const handleReverse = async (paymentId: string, invoiceId: string, reason: string) => {
    await reversePayment({ id: paymentId, invoiceId, reason }).unwrap();
  };

  return (
    <div>
      <PageHeader
        title={invoice ? invoice.invoiceNumber : "Invoice"}
        description={
          invoice
            ? `${refName(invoice.academicSession)} · ${refName(invoice.academicSemester)} · ${refName(invoice.academicClass)}`
            : "Loading invoice…"
        }
        breadcrumb={
          <Link to="/fees/invoices" className="text-primary-700 hover:underline">
            Invoices
          </Link>
        }
        actions={
          <div className="no-print">
            <Button
              variant="outline"
              icon={<Printer className="size-4" aria-hidden />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              icon={<Banknote className="size-4" aria-hidden />}
              disabled={
                !invoice ||
                invoice.status === "Paid" ||
                invoice.status === "Cancelled"
              }
              onClick={() => setPaymentOpen(true)}
            >
              Record payment
            </Button>
          </div>
        }
      />

      {query.isError && (
        <Alert tone="error" title="Could not load invoice" className="no-print mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {(query.error as { data?: { message?: string } })?.data?.message ??
                (query.error as Error | undefined)?.message ??
                "Request failed."}
            </span>
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {notice && (
        <Alert
          tone="success"
          title="Done"
          className="no-print mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      {actionError && (
        <Alert
          tone="error"
          title="Action failed"
          className="no-print mb-4"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Invoice summary + items (this block is what prints) */}
        <Card padded={false}>
          {query.isLoading || !invoice ? (
            <div className="p-5">
              <div className="h-4 w-1/3 animate-pulse rounded bg-ink-100" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-ink-100" />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="h-10 animate-pulse rounded bg-ink-100" />
                <div className="h-10 animate-pulse rounded bg-ink-100" />
                <div className="h-10 animate-pulse rounded bg-ink-100" />
              </div>
            </div>
          ) : (
            <>
              <InvoiceMeta invoice={invoice} />
              <div className="border-t border-ink-100 p-5">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Line items
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink-100 bg-forest-50/60">
                        <th
                          scope="col"
                          className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                        >
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={`${item.name}-${index}`}
                          className="border-b border-ink-100"
                        >
                          <td className="px-4 py-2.5 text-ink-900">
                            {item.name}
                            {isPopulated(item.feeStructure) && (
                              <span className="ml-2 text-[11px] text-ink-400">
                                fee structure
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-ink-600">
                            {item.description || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums text-ink-900">
                            {formatNaira(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-ink-200 bg-forest-50/40">
                        <td
                          colSpan={2}
                          className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-500"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums text-ink-900">
                          {formatNaira(invoice.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="grid gap-px bg-ink-100 sm:grid-cols-3">
                <div className="bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">Total</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-ink-900">
                    {formatNaira(invoice.totalAmount)}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">Amount paid</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-primary-800">
                    {formatNaira(invoice.amountPaid)}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-medium text-ink-500">Balance</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-gold-700">
                    {formatNaira(invoice.balance)}
                  </p>
                </div>
              </div>
              {invoice.notes && (
                <div className="border-t border-ink-100 p-5">
                  <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Notes
                  </h2>
                  <p className="whitespace-pre-line text-sm text-ink-700">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Payments history (screen only) */}
        <div className="no-print">
          <Card
            title="Payments"
            description="Completed and reversed payments for this invoice."
            padded={false}
            bodyClassName="p-0"
          >
            <div className="p-4">
              <PaymentsList
                payments={payments}
                onReverse={(payment) => setReverseTarget(payment)}
              />
            </div>
          </Card>
        </div>
      </div>

      {paymentOpen && invoice && (
        <RecordPaymentDialog
          invoice={invoice}
          submitting={submitting}
          onClose={() => setPaymentOpen(false)}
          onDone={() => {
            setPaymentOpen(false);
            setNotice("Payment recorded successfully.");
          }}
          onRecord={handleRecord}
        />
      )}

      {reverseTarget && (
        <ReversePaymentDialog
          payment={reverseTarget}
          invoiceId={id}
          reversing={reversing}
          onClose={() => setReverseTarget(null)}
          onDone={() => {
            setReverseTarget(null);
            setNotice("Payment reversed; invoice totals recalculated.");
          }}
          onReverse={handleReverse}
        />
      )}
    </div>
  );
}

function InvoiceMeta({ invoice }: { invoice: Invoice }) {
  const student = invoice.student;
  const issuedBy = invoice.issuedBy;

  const metaRows: { label: string; value: string }[] = [
    {
      label: "Student",
      value: isPopulated(student)
        ? [student.firstName, student.middleName, student.lastName]
            .filter(Boolean)
            .join(" ") || "—"
        : "—",
    },
    {
      label: "Registration #",
      value: isPopulated(student) ? student.registrationNumber : "—",
    },
    { label: "Class", value: refName(invoice.academicClass) },
    { label: "Session", value: refName(invoice.academicSession) },
    { label: "Semester", value: refName(invoice.academicSemester) },
    { label: "Due date", value: fmtDate(invoice.dueDate) },
    {
      label: "Issued by",
      value: isPopulated(issuedBy)
        ? issuedBy.fullName ?? issuedBy.username ?? "—"
        : "—",
    },
    {
      label: "Issued",
      value: invoice.createdAt ? fmtDateTime(invoice.createdAt) : "—",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
          Invoice number
        </p>
        <p className="mt-1 font-mono text-lg font-bold text-ink-900">
          {invoice.invoiceNumber}
        </p>
        <div className="mt-2">
          <StatusBadge status={invoice.status} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:min-w-[420px]">
        {metaRows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs text-ink-500">{row.label}</dt>
            <dd className="font-medium text-ink-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PaymentsList({
  payments,
  onReverse,
}: {
  payments: Payment[];
  onReverse: (payment: Payment) => void;
}) {
  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        key: "receiptNumber",
        header: "Receipt #",
        sortValue: (p) => p.receiptNumber,
        render: (p) => (
          <span className="font-mono text-xs font-medium text-ink-900">
            {p.receiptNumber}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        sortValue: (p) => p.amount,
        className: "font-medium tabular-nums text-ink-900",
        render: (p) => formatNaira(p.amount),
      },
      {
        key: "method",
        header: "Method",
        render: (p) => (
          <div className="flex flex-col">
            <span>{p.method}</span>
            {p.reference && (
              <span className="font-mono text-[11px] text-ink-500">
                {p.reference}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "paidAt",
        header: "Paid at",
        sortValue: (p) => p.paidAt,
        render: (p) => fmtDateTime(p.paidAt),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (p) => p.status,
        render: (p) => <StatusBadge status={p.status} />,
      },
      {
        key: "reversal",
        header: "Reversal",
        render: (p) =>
          p.status === "Reversed" ? (
            <div className="flex flex-col text-xs">
              <span className="text-ink-700">
                {isPopulated(p.reversedBy)
                  ? `${p.reversedBy.fullName ?? p.reversedBy.username} · `
                  : ""}
                {fmtDateTime(p.reversedAt)}
              </span>
              {p.reversalReason && (
                <span className="text-ink-500">Reason: {p.reversalReason}</span>
              )}
            </div>
          ) : (
            "—"
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (p) =>
          p.status === "Completed" ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<Undo2 className="size-3.5" aria-hidden />}
              onClick={(ev) => {
                ev.stopPropagation();
                onReverse(p);
              }}
            >
              Reverse
            </Button>
          ) : (
            <Ban className="size-3.5 text-ink-300" aria-hidden />
          ),
      },
    ],
    [onReverse],
  );

  return (
    <DataTable
      columns={columns}
      data={payments}
      isLoading={false}
      emptyTitle="No payments recorded"
      emptyDescription="Record a payment to reduce the invoice balance."
      rowKey={(p) => p._id}
    />
  );
}

// ======================================================
// Record payment (POST /payments)
// ======================================================

function RecordPaymentDialog({
  invoice,
  submitting,
  onClose,
  onDone,
  onRecord,
}: {
  invoice: Invoice;
  submitting: boolean;
  onClose: () => void;
  onDone: () => void;
  onRecord: (body: CreatePaymentBody) => Promise<unknown>;
}) {
  const balance = invoice.balance;
  const [amountText, setAmountText] = useState(balance > 0 ? String(balance) : "");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  const amount = Number(amountText);
  const amountValid = amountText !== "" && !Number.isNaN(amount) && amount > 0;
  const blocked = invoice.status === "Paid" || invoice.status === "Cancelled";
  const exceeds = amountValid && balance > 0 && amount > balance + 0.001;

  const submit = () => {
    void (async () => {
      setFormError(null);
      if (!amountValid || blocked || exceeds) return;
      try {
        await onRecord({
          invoice: invoice._id,
          amount,
          method,
          reference: reference.trim() || undefined,
          paidAt: paidAt || undefined,
          notes: notes.trim() || undefined,
        });
        onDone();
      } catch (err) {
        setFormError(toFieldErrors(err).message);
      }
    })();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Record payment"
      description={`${invoice.invoiceNumber} · outstanding balance ${formatNaira(balance)}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={submitting}
            disabled={!amountValid || blocked || exceeds}
          >
            Record payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {blocked && (
          <Alert tone="warning">
            {invoice.status === "Paid"
              ? "This invoice has already been fully paid — the server will reject further payments."
              : "This invoice is cancelled — payments cannot be recorded against it."}
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Amount (₦)"
            required
            type="number"
            min="0.01"
            step="0.01"
            aria-invalid={!amountValid && amountText !== "" ? "true" : undefined}
            value={amountText}
            error={
              exceeds
                ? `Amount exceeds the outstanding balance of ${formatNaira(balance)}.`
                : undefined
            }
            hint={balance > 0 ? `Maximum: ${formatNaira(balance)}` : undefined}
            onChange={(e) => setAmountText(e.target.value)}
          />
          <SelectField
            label="Method"
            required
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Reference"
            maxLength={150}
            value={reference}
            placeholder="e.g. BANK-001"
            hint="Optional."
            onChange={(e) => setReference(e.target.value)}
          />
          <InputField
            label="Paid at"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>

        <TextareaField
          label="Notes"
          maxLength={1000}
          value={notes}
          hint="Optional."
          onChange={(e) => setNotes(e.target.value)}
        />

        {formError && (
          <Alert tone="error" title="Could not record payment">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

// ======================================================
// Reverse payment (POST /payments/:id/reverse — reason required)
// ======================================================

function ReversePaymentDialog({
  payment,
  invoiceId,
  reversing,
  onClose,
  onDone,
  onReverse,
}: {
  payment: Payment;
  invoiceId: string;
  reversing: boolean;
  onClose: () => void;
  onDone: () => void;
  onReverse: (paymentId: string, invoiceId: string, reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const valid = reason.trim() !== "";

  const submit = () => {
    void (async () => {
      setFormError(null);
      setReasonError(null);
      if (!valid) {
        setReasonError("A reversal reason is required.");
        return;
      }
      try {
        await onReverse(payment._id, invoiceId, reason.trim());
        onDone();
      } catch (err) {
        const mapped = toFieldErrors(err);
        if (mapped.fields.reason) setReasonError(mapped.fields.reason);
        setFormError(mapped.message);
      }
    })();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Reverse payment"
      description={`Receipt ${payment.receiptNumber} of ${formatNaira(payment.amount)} will be reversed and the invoice balance recalculated.`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={reversing}>
            Keep payment
          </Button>
          <Button
            variant="danger"
            onClick={submit}
            loading={reversing}
            icon={<Undo2 className="size-4" aria-hidden />}
          >
            Reverse payment
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Alert tone="warning">
          The reversal overwrites the payment status; the invoice will be
          recalculated from completed payments only.
        </Alert>
        <TextareaField
          label="Reason"
          required
          maxLength={500}
          value={reason}
          error={reasonError ?? undefined}
          aria-invalid={reasonError ? "true" : undefined}
          placeholder="Why is this payment being reversed?"
          onChange={(e) => setReason(e.target.value)}
        />
        {formError && (
          <Alert tone="error" title="Could not reverse payment">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
