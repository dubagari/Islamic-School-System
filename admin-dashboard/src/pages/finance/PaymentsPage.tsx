import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Undo2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import {
  Input,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  PAYMENT_METHODS,
  formatNaira,
  toFieldErrors,
  useGetPaymentsQuery,
  useReversePaymentMutation,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from "@/features/finance/api";
import {
  isPopulated,
  useGetStudentsQuery,
  type Student,
} from "@/features/students/api";

const PAGE_SIZE = 20;

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

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "">("");
  const [studentFilter, setStudentFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const [reverseTarget, setReverseTarget] = useState<Payment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useGetPaymentsQuery({
    page,
    limit: PAGE_SIZE,
    search: searchText || undefined,
    method: methodFilter || undefined,
    status: statusFilter || undefined,
    student: studentFilter || undefined,
    from: fromFilter || undefined,
    to: toFilter || undefined,
  });

  const { data: studentsData } = useGetStudentsQuery({ limit: 200 });
  const students = (studentsData?.data ?? []) as Student[];

  const payments = query.data?.data;
  const pagination = query.data?.pagination;
  const summary = query.data?.summary;

  const [reversePayment, { isLoading: reversing }] = useReversePaymentMutation();

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
        key: "invoiceNumber",
        header: "Invoice #",
        sortValue: (p) => (isPopulated(p.invoice) ? p.invoice.invoiceNumber : ""),
        render: (p) => {
          const invoice = p.invoice;
          return isPopulated(invoice) ? (
            <Link
              to={`/fees/invoices/${invoice._id}`}
              className="font-mono text-xs font-medium text-primary-700 hover:underline"
            >
              {invoice.invoiceNumber}
            </Link>
          ) : (
            <span className="font-mono text-xs">—</span>
          );
        },
      },
      {
        key: "student",
        header: "Student",
        render: (p) => {
          const s = p.student;
          return isPopulated(s) ? (
            <div className="flex flex-col">
              <span className="font-medium text-ink-900">
                {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") ||
                  "—"}
              </span>
              <span className="font-mono text-xs text-ink-500">
                {s.registrationNumber}
              </span>
            </div>
          ) : (
            "—"
          );
        },
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
                setReverseTarget(p);
              }}
            >
              Reverse
            </Button>
          ) : (
            <span className="text-[11px] text-ink-400">Reversed</span>
          ),
      },
    ],
    [],
  );

  const mobileCard = (p: Payment) => {
    const invoice = p.invoice;
    const s = p.student;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs font-medium text-ink-900">
              {p.receiptNumber}
            </p>
            <p className="font-medium text-ink-900">
              {isPopulated(s)
                ? [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ")
                : "—"}
            </p>
          </div>
          <StatusBadge status={p.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-ink-500">Invoice</dt>
          <dd>
            {isPopulated(invoice) ? (
              <Link
                to={`/fees/invoices/${invoice._id}`}
                className="font-mono text-primary-700 hover:underline"
              >
                {invoice.invoiceNumber}
              </Link>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-ink-500">Amount</dt>
          <dd className="tabular-nums text-ink-800">{formatNaira(p.amount)}</dd>
          <dt className="text-ink-500">Method</dt>
          <dd className="text-ink-800">{p.method}</dd>
          <dt className="text-ink-500">Paid at</dt>
          <dd className="text-ink-800">{fmtDateTime(p.paidAt)}</dd>
        </dl>
        {p.status === "Completed" && (
          <div className="mt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(ev) => {
                ev.stopPropagation();
                setReverseTarget(p);
              }}
            >
              Reverse
            </Button>
          </div>
        )}
      </div>
    );
  };

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const filtersChanged = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Recorded fee payments across all invoices."
      />

      {summary && (
        <StatGrid className="mb-6">
          <StatCard
            label="Collected (filtered, completed)"
            tone="primary"
            value={formatNaira(summary.totalCollected)}
            sub={`${summary.completedPayments} completed payment(s)`}
          />
          <StatCard
            label="Payments in result"
            value={pagination?.total ?? 0}
            sub="Including reversed entries"
          />
        </StatGrid>
      )}

      {notice && (
        <Alert
          tone="success"
          title="Done"
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      {actionError && (
        <Alert
          tone="error"
          title="Action failed"
          className="mb-4"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <Card padded={false}>
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) =>
              filtersChanged(
                () => setStatusFilter(e.target.value as PaymentStatus | ""),
              )
            }
          >
            <option value="">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Reversed">Reversed</option>
          </SelectField>
          <SelectField
            label="Method"
            value={methodFilter}
            onChange={(e) =>
              filtersChanged(
                () => setMethodFilter(e.target.value as PaymentMethod | ""),
              )
            }
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Student"
            value={studentFilter}
            onChange={(e) => filtersChanged(() => setStudentFilter(e.target.value))}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ")} (
                {s.registrationNumber})
              </option>
            ))}
          </SelectField>
          <div>
            <label
              htmlFor="payments-search"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Search
            </label>
            <Input
              id="payments-search"
              type="search"
              placeholder="Receipt #, reference, name, reg #…"
              value={searchText}
              onChange={(e) => filtersChanged(() => setSearchText(e.target.value))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <InputField
              label="Paid from"
              type="date"
              value={fromFilter}
              onChange={(e) => filtersChanged(() => setFromFilter(e.target.value))}
            />
            <InputField
              label="Paid to"
              type="date"
              value={toFilter}
              error={
                fromFilter &&
                toFilter &&
                new Date(fromFilter) > new Date(toFilter)
                  ? "The from date must be on or before the to date."
                  : undefined
              }
              onChange={(e) => filtersChanged(() => setToFilter(e.target.value))}
            />
          </div>
        </div>

        {query.isError && (
          <Alert tone="error" title="Could not load payments" className="m-4">
            <div className="flex items-center gap-3">
              <span>
                {(query.error as Error | undefined)?.message ?? "Request failed."}
              </span>
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={payments}
          isLoading={query.isLoading}
          emptyTitle="No payments found"
          emptyDescription={
            statusFilter ||
            methodFilter ||
            studentFilter ||
            fromFilter ||
            toFilter ||
            searchText
              ? "Try adjusting or clearing the filters."
              : "Payments recorded against invoices will appear here."
          }
          emptyAction={
            query.isError ? (
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(p) => p._id}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      {reverseTarget && (
        <ReversePaymentDialog
          payment={reverseTarget}
          reversing={reversing}
          onClose={() => setReverseTarget(null)}
          onDone={() => {
            setReverseTarget(null);
            setNotice("Payment reversed successfully.");
          }}
          onError={setActionError}
          onReverse={async (id, reason) => {
            await reversePayment({ id, reason }).unwrap();
          }}
        />
      )}
    </div>
  );
}

function ReversePaymentDialog({
  payment,
  reversing,
  onClose,
  onDone,
  onError,
  onReverse,
}: {
  payment: Payment;
  reversing: boolean;
  onClose: () => void;
  onDone: () => void;
  onError: (message: string) => void;
  onReverse: (id: string, reason: string) => Promise<unknown>;
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
        await onReverse(payment._id, reason.trim());
        onDone();
      } catch (err) {
        const mapped = toFieldErrors(err);
        if (mapped.fields.reason) setReasonError(mapped.fields.reason);
        setFormError(mapped.message);
        onError(mapped.message);
      }
    })();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Reverse payment"
      description={`Receipt ${payment.receiptNumber} of ${formatNaira(payment.amount)} will be reversed and the linked invoice balance recalculated.`}
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
