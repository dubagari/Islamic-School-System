import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Receipt,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  classNameRef,
  displayName,
  formatDate,
  formatNaira,
  getErrorMessage,
  nameRef,
  useGetChildFeesQuery,
  type InvoiceListItem,
  type InvoiceQueryStatus,
  type PaymentListItem,
} from "@/features/parent/api";

const INVOICE_STATUSES = [
  "Unpaid",
  "Partially Paid",
  "Paid",
  "Overdue",
] as const;

export function ChildFeesPage() {
  const { studentId = "" } = useParams<{ studentId: string }>();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<InvoiceQueryStatus | "">("");

  const params = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      status: status || undefined,
    }),
    [from, to, status],
  );

  const { data, isLoading, isError, error, refetch } = useGetChildFeesQuery(
    { studentId, params },
    { skip: !studentId },
  );

  const invoiceColumns: Column<InvoiceListItem>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice",
        sortValue: (row) => row.invoiceNumber,
        render: (row) => (
          <div>
            <p className="font-medium text-ink-900">{row.invoiceNumber}</p>
            {row.academicSemester && (
              <p className="text-xs text-ink-500">
                {nameRef(row.academicSemester)}
                {row.academicSession ? ` · ${nameRef(row.academicSession)}` : ""}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "dueDate",
        header: "Due date",
        sortValue: (row) => row.dueDate ?? "",
        render: (row) => formatDate(row.dueDate),
      },
      {
        key: "totalAmount",
        header: "Billed",
        align: "end",
        sortValue: (row) => row.totalAmount,
        render: (row) => formatNaira(row.totalAmount),
      },
      {
        key: "amountPaid",
        header: "Paid",
        align: "end",
        sortValue: (row) => row.amountPaid,
        render: (row) => formatNaira(row.amountPaid),
      },
      {
        key: "balance",
        header: "Balance",
        align: "end",
        sortValue: (row) => row.balance,
        render: (row) => formatNaira(row.balance),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  const paymentColumns: Column<PaymentListItem>[] = useMemo(
    () => [
      {
        key: "paidAt",
        header: "Date",
        sortValue: (row) => row.paidAt ?? "",
        render: (row) =>
          formatDate(row.paidAt) === "—"
            ? "—"
            : formatDate(row.paidAt),
      },
      {
        key: "receipt",
        header: "Receipt",
        sortValue: (row) => row.receiptNumber ?? "",
        render: (row) =>
          row.receiptNumber?.trim() ? (
            <span className="font-medium text-ink-900">
              {row.receiptNumber}
            </span>
          ) : (
            <span className="text-ink-400">—</span>
          ),
      },
      {
        key: "invoice",
        header: "Invoice",
        render: (row) => {
          const invoice = row.invoice;
          if (typeof invoice === "object" && invoice?.invoiceNumber) {
            return invoice.invoiceNumber;
          }
          if (typeof invoice === "string" && invoice) {
            return "—";
          }
          return "—";
        },
      },
      {
        key: "method",
        header: "Method",
        sortValue: (row) => row.method,
        render: (row) => row.method || "—",
      },
      {
        key: "reference",
        header: "Reference",
        render: (row) => row.reference?.trim() || <span className="text-ink-400">—</span>,
      },
      {
        key: "amount",
        header: "Amount",
        align: "end",
        sortValue: (row) => row.amount,
        render: (row) => formatNaira(row.amount),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  if (!studentId) {
    return (
      <Alert tone="warning" title="No child selected">
        Use the parent overview to pick a child.
      </Alert>
    );
  }

  const childName = data?.student
    ? data.student.fullName || displayName(data.student)
    : "Child";
  const summary = data?.summary;

  return (
    <div>
      <PageHeader
        breadcrumb={
          <div className="flex items-center gap-2">
            <Link to="/parent" className="hover:text-ink-800">
              Parent overview
            </Link>
            <span aria-hidden>/</span>
            <Link
              to={`/parent/children/${studentId}`}
              className="hover:text-ink-800"
            >
              {childName}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-700">Fees</span>
          </div>
        }
        title="Fees"
        arabic="الرسوم"
        description={`Invoices and payments for ${childName} · ${classNameRef(data?.student?.academicClass)}`}
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft className="size-4" aria-hidden />}
            onClick={() => void refetch()}
          >
            Refresh
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load fees" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard
          label="Total billed"
          value={summary ? formatNaira(summary.totalBilled) : "—"}
          sub={summary ? `${summary.invoices} invoice${summary.invoices === 1 ? "" : "s"}` : undefined}
          icon={<Receipt className="size-4" aria-hidden />}
          tone="gold"
        />
        <StatCard
          label="Total paid"
          value={summary ? formatNaira(summary.totalPaid) : "—"}
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          tone="primary"
        />
        <StatCard
          label="Outstanding balance"
          value={summary ? formatNaira(summary.totalBalance) : "—"}
          sub={
            summary?.unpaidInvoices !== undefined
              ? `${summary.unpaidInvoices} unpaid invoice${summary.unpaidInvoices === 1 ? "" : "s"}`
              : undefined
          }
          icon={<AlertTriangle className="size-4" aria-hidden />}
          tone={summary && summary.totalBalance > 0 ? "danger" : "primary"}
        />
        <StatCard
          label="Invoices on record"
          value={data?.data?.length ?? "—"}
          icon={<Wallet className="size-4" aria-hidden />}
        />
      </StatGrid>

      <Card padded={false} className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <ClipboardList className="size-4 text-primary-700" aria-hidden />
            Invoices
          </p>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3 sm:items-end">
            <InputField
              label="From date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <InputField
              label="To date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <SelectField
              label="Status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as InvoiceQueryStatus | "")
              }
            >
              <option value="">All statuses</option>
              {INVOICE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        <DataTable
          columns={invoiceColumns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle="No invoices"
          emptyDescription="No invoices match the selected filters."
          rowKey={(row) => row._id}
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">
                  {row.invoiceNumber}
                </p>
                <p className="text-xs text-ink-500">
                  {formatNaira(row.balance)} outstanding · due{" "}
                  {formatDate(row.dueDate)}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          )}
        />
      </Card>

      <Card padded={false}>
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Receipt className="size-4 text-primary-700" aria-hidden />
            Payments
          </p>
        </div>
        <DataTable
          columns={paymentColumns}
          data={data?.payments}
          isLoading={isLoading}
          emptyTitle="No payments"
          emptyDescription="No payments match the selected filters."
          rowKey={(row) => row._id}
          mobileCard={(row) => (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">
                  {row.receiptNumber || "—"}
                </p>
                <p className="text-xs text-ink-500">
                  {row.method || "—"} · {formatDate(row.paidAt)}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink-900">
                {formatNaira(row.amount)}
              </span>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
