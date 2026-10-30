import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { PagedFooter } from "@/components/ui/Pagination";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  extractErrorMessage,
  formatDate,
  formatNaira,
  refName,
  useGetInvoiceByIdQuery,
  useGetStudentFeeSummaryQuery,
  useGetStudentPaymentsQuery,
  useGetStudentProfileQuery,
  type InvoiceItem,
  type InvoiceRecord,
  type PaymentRecord,
} from "@/features/student/api";

const PAYMENTS_PAGE_SIZE = 10;

function periodCell(invoice: InvoiceRecord): ReactNode {
  const session = refName(invoice.academicSession) ?? "—";
  const semester = refName(invoice.academicSemester) ?? "—";
  const itemNames = (invoice.items ?? [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
  const preview = itemNames.slice(0, 2).join(", ");
  return (
    <div>
      <p className="text-ink-900">
        {session} · {semester}
      </p>
      {preview && (
        <p className="mt-0.5 text-xs text-ink-500" title={itemNames.join(", ")}>
          {preview}
          {(invoice.items?.length ?? 0) > 2 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function invoiceOf(payment: PaymentRecord): string {
  const invoice = payment.invoice;
  if (invoice && typeof invoice === "object" && invoice.invoiceNumber) {
    return invoice.invoiceNumber;
  }
  return "—";
}

function useInvoiceColumns(
  onView: (invoiceId: string) => void,
): Column<InvoiceRecord>[] {
  return useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice",
        sortValue: (i) => i.invoiceNumber,
        render: (i) => <p className="font-medium text-ink-900">{i.invoiceNumber}</p>,
      },
      {
        key: "period",
        header: "Period / description",
        sortValue: (i) => refName(i.academicSession) ?? "",
        render: periodCell,
      },
      {
        key: "total",
        header: "Total",
        align: "end",
        sortValue: (i) => i.totalAmount ?? -1,
        render: (i) => formatNaira(i.totalAmount),
      },
      {
        key: "paid",
        header: "Paid",
        align: "end",
        sortValue: (i) => i.amountPaid ?? -1,
        render: (i) => formatNaira(i.amountPaid),
      },
      {
        key: "balance",
        header: "Balance",
        align: "end",
        sortValue: (i) => i.balance ?? -1,
        render: (i) => formatNaira(i.balance),
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (i) => <StatusBadge status={i.status ?? ""} />,
      },
      {
        key: "dueDate",
        header: "Due date",
        sortValue: (i) => i.dueDate ?? "",
        render: (i) => formatDate(i.dueDate),
      },
      {
        key: "actions",
        header: "",
        align: "end",
        render: (i) => (
          <Button size="sm" variant="outline" onClick={() => onView(i._id)}>
            View
          </Button>
        ),
      },
    ],
    [onView],
  );
}

const paymentColumns: Column<PaymentRecord>[] = [
  {
    key: "receipt",
    header: "Receipt",
    sortValue: (p) => p.receiptNumber ?? "",
    render: (p) => (
      <p className="font-medium text-ink-900">{p.receiptNumber || "—"}</p>
    ),
  },
  {
    key: "invoice",
    header: "Invoice",
    render: invoiceOf,
  },
  {
    key: "method",
    header: "Method",
    render: (p) => p.method || "—",
  },
  {
    key: "reference",
    header: "Evidence / reference",
    render: (p) => p.reference?.trim() || "—",
  },
  {
    key: "amount",
    header: "Amount",
    align: "end",
    sortValue: (p) => p.amount ?? -1,
    render: (p) => formatNaira(p.amount),
  },
  {
    key: "paidAt",
    header: "Paid at",
    sortValue: (p) => p.paidAt ?? "",
    render: (p) => formatDate(p.paidAt),
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    render: (p) => <StatusBadge status={p.status ?? ""} />,
  },
];

function paymentMobileCard(p: PaymentRecord): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">{p.receiptNumber || "—"}</p>
        <StatusBadge status={p.status ?? ""} />
      </div>
      <p className="text-xs text-ink-500">
        {invoiceOf(p)} · {p.method || "—"} · {formatDate(p.paidAt)}
      </p>
      <p className="text-xs text-ink-500">
        Amount {formatNaira(p.amount)} · Reference {p.reference?.trim() || "—"}
      </p>
    </div>
  );
}

function SummaryTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-ink-100 bg-forest-50/40 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink-900">{children}</p>
    </div>
  );
}

export function StudentFeesPage() {
  const [invoiceId, setInvoiceIdState] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const onViewInvoice = useCallback(
    (id: string) => setInvoiceIdState(id),
    [],
  );
  const invoiceColumns = useInvoiceColumns(onViewInvoice);

  const {
    data: profileEnvelope,
    isError: isProfileError,
    error: profileError,
  } = useGetStudentProfileQuery();

  const studentId = profileEnvelope?.data?._id ?? "";

  const {
    data: feeEnvelope,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentFeeSummaryQuery({ studentId }, { skip: !studentId });

  const { data: paymentsEnvelope, isLoading: isLoadingPayments } =
    useGetStudentPaymentsQuery(
      { page, limit: PAYMENTS_PAGE_SIZE },
      { skip: !studentId },
    );

  const invoices = feeEnvelope?.data ?? [];
  const summary = feeEnvelope?.summary;

  if (isProfileError) {
    return (
      <div>
        <PageHeader
          title="My fees"
          arabic="الرسوم"
          description="Your invoices, payments and outstanding balance."
        />
        <div className="max-w-md">
          <EmptyState
            title="Student profile unavailable"
            description={extractErrorMessage(profileError)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My fees"
        arabic="الرسوم"
        description="Your invoices, payment history and outstanding balance."
      />

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Total billed"
          value={formatNaira(summary?.totalBilled)}
          sub={
            summary
              ? `${summary.invoices ?? 0} invoice${(summary.invoices ?? 0) === 1 ? "" : "s"}`
              : undefined
          }
          loading={isLoading && !summary}
        />
        <StatCard
          label="Total paid"
          value={formatNaira(summary?.totalPaid)}
          tone="primary"
          loading={isLoading && !summary}
        />
        <StatCard
          label="Outstanding balance"
          value={formatNaira(summary?.totalBalance)}
          tone="warning"
          sub={
            summary
              ? `${summary.unpaidInvoices ?? 0} unpaid of ${summary.invoices ?? 0} invoice${(summary.invoices ?? 0) === 1 ? "" : "s"}`
              : undefined
          }
          loading={isLoading && !summary}
        />
        <StatCard
          label="Payments on record"
          value={paymentsEnvelope?.summary?.completedPayments ?? "—"}
          sub={
            paymentsEnvelope?.summary
              ? `Completed total ${formatNaira(paymentsEnvelope.summary.totalCollected)}`
              : undefined
          }
          tone="gold"
        />
      </StatGrid>

      <Card
        className="mb-6"
        title="Invoices"
        description="Select an invoice to see its line items and payments."
      >
        {isError ? (
          <EmptyState
            title="Could not load your fees"
            description={extractErrorMessage(error)}
            action={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            isLoading={isLoading}
            emptyTitle="No invoices yet"
            emptyDescription="Invoices issued by the school to you will appear here."
            rowKey={(i) => i._id}
            onRowClick={(i) => setInvoiceIdState(i._id)}
            mobileCard={(i) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink-900">{i.invoiceNumber}</p>
                  <StatusBadge status={i.status ?? ""} />
                </div>
                {periodCell(i)}
                <div className="flex flex-wrap gap-x-4 text-xs text-ink-500">
                  <span>Total {formatNaira(i.totalAmount)}</span>
                  <span>Paid {formatNaira(i.amountPaid)}</span>
                  <span>Balance {formatNaira(i.balance)}</span>
                  <span>Due {formatDate(i.dueDate)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => setInvoiceIdState(i._id)}
                >
                  View invoice
                </Button>
              </div>
            )}
          />
        )}
      </Card>

      <Card
        title="My payments"
        description="Payments recorded against your invoices."
      >
        <DataTable
          columns={paymentColumns}
          data={paymentsEnvelope?.data ?? []}
          isLoading={isLoadingPayments}
          emptyTitle="No payments recorded yet"
          emptyDescription="Receipts appear here once payments are recorded."
          rowKey={(p) => p._id}
          mobileCard={paymentMobileCard}
        />
        <PagedFooter
          pagination={paymentsEnvelope?.pagination}
          onPageChange={setPage}
        />
      </Card>

      <InvoiceDetailDialog
        invoiceId={invoiceId}
        onClose={() => setInvoiceIdState(null)}
      />
    </div>
  );
}

function InvoiceDetailDialog({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const { data: envelope, isLoading } = useGetInvoiceByIdQuery(invoiceId ?? "", {
    skip: !invoiceId,
  });

  const invoice = envelope?.data;
  const payments = envelope?.payments ?? [];

  return (
    <Dialog
      open={invoiceId !== null}
      onClose={onClose}
      size="lg"
      title={
        invoice?.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : "Invoice"
      }
      description={
        invoice
          ? `${refName(invoice.academicSession) ?? "—"} · ${refName(invoice.academicSemester) ?? "—"}`
          : undefined
      }
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {isLoading || !invoice ? (
        <PageLoader />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Status">
              <StatusBadge status={invoice.status ?? ""} />
            </SummaryTile>
            <SummaryTile label="Due date">
              {formatDate(invoice.dueDate)}
            </SummaryTile>
            <SummaryTile label="Total">
              {formatNaira(invoice.totalAmount)}
            </SummaryTile>
            <SummaryTile label="Paid">
              {formatNaira(invoice.amountPaid)}
            </SummaryTile>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Balance
            </h3>
            <p className="text-sm text-ink-800">{formatNaira(invoice.balance)}</p>
            {invoice.notes?.trim() && (
              <p className="mt-2 whitespace-pre-line rounded-lg border border-ink-100 bg-forest-50/50 px-3 py-2 text-xs text-ink-600">
                {invoice.notes}
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Line items
            </h3>
            {(invoice.items ?? []).length === 0 ? (
              <p className="text-sm text-ink-500">No line items recorded —</p>
            ) : (
              <ul className="divide-y divide-ink-100 rounded-card border border-ink-100">
                {(invoice.items ?? []).map((item: InvoiceItem, index: number) => (
                  <li
                    key={item._id ?? `item-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="text-ink-800">{item.name || "—"}</span>
                    <span className="font-medium text-ink-900">
                      {formatNaira(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Payments on this invoice
            </h3>
            {payments.length === 0 ? (
              <Badge tone="neutral">
                No payments recorded on this invoice yet
              </Badge>
            ) : (
              <ul className="divide-y divide-ink-100 rounded-card border border-ink-100">
                {payments.map((payment) => (
                  <li
                    key={payment._id}
                    className="flex flex-col gap-1 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink-900">
                        {payment.receiptNumber || payment._id}
                      </span>
                      <span className="font-medium text-ink-900">
                        {formatNaira(payment.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">
                      {payment.method || "—"} · {formatDate(payment.paidAt)} ·{" "}
                      {payment.reference?.trim() || "No reference"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}
