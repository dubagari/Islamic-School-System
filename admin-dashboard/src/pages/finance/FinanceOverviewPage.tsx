import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  FileText,
  RefreshCw,
  ScrollText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormField, Select } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  formatNaira,
  useGetFinanceSummaryQuery,
  useGetInvoicesQuery,
  useGetPaymentsQuery,
  type Invoice,
  type Payment,
} from "@/features/finance/api";
import { isPopulated, useGetAcademicClassesQuery, useGetAcademicSemestersQuery, useGetAcademicSessionsQuery, type AcademicClass } from "@/features/students/api";

function useRecentInvoiceColumns() {
  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      sortValue: (i) => i.invoiceNumber,
      render: (i) => (
        <Link
          to={`/fees/invoices/${i._id}`}
          className="font-mono text-xs font-medium text-primary-700 hover:underline"
        >
          {i.invoiceNumber}
        </Link>
      ),
    },
    {
      key: "student",
      header: "Student",
      render: (i) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink-900">{invoiceStudentName(i)}</span>
          <span className="font-mono text-xs text-ink-500">
            {invoiceStudentReg(i)}
          </span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "end",
      sortValue: (i) => i.totalAmount,
      className: "font-medium tabular-nums text-ink-900",
      render: (i) => formatNaira(i.totalAmount),
    },
    {
      key: "balance",
      header: "Balance",
      align: "end",
      sortValue: (i) => i.balance,
      className: "tabular-nums",
      render: (i) => formatNaira(i.balance),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (i) => i.status,
      render: (i) => <StatusBadge status={i.status} />,
    },
  ];
  return columns;
}

function useRecentPaymentColumns() {
  const columns: Column<Payment>[] = [
    {
      key: "receiptNumber",
      header: "Receipt",
      sortValue: (p) => p.receiptNumber,
      render: (p) => paymentWithInvoiceLink(p),
    },
    {
      key: "student",
      header: "Student",
      render: (p) => invoiceStudentName(p),
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
      render: (p) => p.method,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
  ];
  return columns;
}

type StudentRefLike = {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  registrationNumber?: string;
};

type FinRefItem = { student?: StudentRefLike | string | null };

function isStudentPopulated(
  value: StudentRefLike | string | null | undefined,
): value is StudentRefLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    typeof value._id === "string"
  );
}

function invoiceStudentName(item: FinRefItem): string {
  const s = item.student as StudentRefLike | string | null | undefined;
  if (!isStudentPopulated(s)) return "—";
  return (
    [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") || "—"
  );
}

function invoiceStudentReg(item: FinRefItem): string {
  const s = item.student as StudentRefLike | string | null | undefined;
  return isStudentPopulated(s) ? s.registrationNumber ?? "—" : "—";
}

function paymentWithInvoiceLink(p: Payment): ReactNode {
  const invoice = p.invoice;
  if (isPopulated(invoice)) {
    return (
      <Link
        to={`/fees/invoices/${invoice._id}`}
        className="font-mono text-xs font-medium text-primary-700 hover:underline"
      >
        {p.receiptNumber}
      </Link>
    );
  }
  return <span className="font-mono text-xs">{p.receiptNumber}</span>;
}

export function FinanceOverviewPage() {
  const [sessionFilter, setSessionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const summaryQuery = useGetFinanceSummaryQuery({
    academicSession: sessionFilter || undefined,
    academicSemester: semesterFilter || undefined,
    academicClass: classFilter || undefined,
  });

  const invoicesQuery = useGetInvoicesQuery({
    page: 1,
    limit: 5,
    academicSession: sessionFilter || undefined,
    academicSemester: semesterFilter || undefined,
    academicClass: classFilter || undefined,
  });

  const paymentsQuery = useGetPaymentsQuery({
    page: 1,
    limit: 5,
  });

  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: semestersData } = useGetAcademicSemestersQuery(
    sessionFilter ? { academicSession: sessionFilter } : undefined,
  );
  const { data: classesData } = useGetAcademicClassesQuery();

  const sessions = sessionsData?.data ?? [];
  const semesters = semestersData?.data ?? [];
  const classes = (classesData?.data ?? []) as AcademicClass[];

  const summary = summaryQuery.data?.data;
  const recentInvoices = invoicesQuery.data?.data;
  const recentPayments = paymentsQuery.data?.data;

  const invoiceColumns = useRecentInvoiceColumns();
  const paymentColumns = useRecentPaymentColumns();

  const refresh = () => {
    void summaryQuery.refetch();
    void invoicesQuery.refetch();
    void paymentsQuery.refetch();
  };

  const summaryError = summaryQuery.isError
    ? (summaryQuery.error as Error | undefined)?.message ?? "Request failed."
    : null;
  const hasFilters = sessionFilter || semesterFilter || classFilter;

  return (
    <div>
      <PageHeader
        title="Finance Overview"
        description="Billed, collected, and outstanding fees across the school."
        arabic="المالية"
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="size-4" aria-hidden />}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      <FormField label="Scope" className="mb-4 max-w-3xl">
        {() => (
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              aria-label="Filter by academic session"
              value={sessionFilter}
              onChange={(e) => {
                setSessionFilter(e.target.value);
                setSemesterFilter("");
              }}
            >
              <option value="">All sessions</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {s.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by academic semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
            >
              <option value="">All semesters</option>
              {semesters.map((sem) => (
                <option key={sem._id} value={sem._id}>
                  {sem.name}
                  {sem.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </FormField>

      {summaryError && (
        <Alert tone="error" title="Could not load finance summary" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{summaryError}</span>
            <Button size="sm" variant="outline" onClick={() => void summaryQuery.refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard
          label="Total invoiced"
          icon={<FileText className="size-4" aria-hidden />}
          loading={summaryQuery.isLoading}
          sub={`Across ${summary?.invoices.count ?? 0} invoice(s)`}
          value={summary ? formatNaira(summary.invoices.totalBilled) : "₦0"}
        />
        <StatCard
          label="Collected"
          tone="primary"
          icon={<Banknote className="size-4" aria-hidden />}
          loading={summaryQuery.isLoading}
          sub={`From ${summary?.payments.count ?? 0} payment(s)`}
          value={summary ? formatNaira(summary.payments.totalCollected) : "₦0"}
        />
        <StatCard
          label="Outstanding"
          tone="gold"
          icon={<Wallet className="size-4" aria-hidden />}
          loading={summaryQuery.isLoading}
          sub={`Collection rate ${summary?.collectionRate ?? 0}%`}
          value={summary ? formatNaira(summary.invoices.totalOutstanding) : "₦0"}
        />
        <StatCard
          label="Unpaid & overdue invoices"
          icon={<TrendingUp className="size-4" aria-hidden />}
          loading={summaryQuery.isLoading}
          sub={`Overdue: ${summary?.invoices.byStatus.Overdue ?? 0} · Unpaid: ${
            summary?.invoices.byStatus.Unpaid ?? 0
          }`}
          value={
            summary
              ? summary.invoices.byStatus.Unpaid +
                summary.invoices.byStatus.Overdue
              : 0
          }
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Recent invoices"
          description="The five most recent invoices."
          actions={
            <Link
              to="/fees/invoices"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              View all
            </Link>
          }
          padded={false}
          bodyClassName="p-0"
        >
          <div className="p-4">
            {invoicesQuery.isError ? (
              <Alert tone="error" title="Could not load invoices" className="mb-1">
                <div className="flex items-center gap-3">
                  <span>
                    {(invoicesQuery.error as Error | undefined)?.message ??
                      "Request failed."}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void invoicesQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </Alert>
            ) : (
              <DataTable
                columns={invoiceColumns}
                data={recentInvoices}
                isLoading={invoicesQuery.isLoading}
                emptyTitle="No invoices yet"
                emptyDescription={
                  hasFilters
                    ? "No invoices match the selected scope."
                    : "Generated or manually created invoices will appear here."
                }
                emptyAction={
                  <Link to="/fees/invoices">
                    <Button size="sm" variant="outline" icon={<ScrollText className="size-3.5" aria-hidden />}>
                      Go to invoices
                    </Button>
                  </Link>
                }
                rowKey={(i) => i._id}
              />
            )}
          </div>
        </Card>

        <Card
          title="Recent payments"
          description="The five most recent payments."
          actions={
            <Link
              to="/fees/payments"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              View all
            </Link>
          }
          padded={false}
          bodyClassName="p-0"
        >
          <div className="p-4">
            {paymentsQuery.isError ? (
              <Alert tone="error" title="Could not load payments" className="mb-1">
                <div className="flex items-center gap-3">
                  <span>
                    {(paymentsQuery.error as Error | undefined)?.message ??
                      "Request failed."}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void paymentsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </Alert>
            ) : (
              <DataTable
                columns={paymentColumns}
                data={recentPayments}
                isLoading={paymentsQuery.isLoading}
                emptyTitle="No payments yet"
                emptyDescription="Recorded payments will appear here."
                emptyAction={
                  <Link to="/fees/payments">
                    <Button size="sm" variant="outline" icon={<Banknote className="size-3.5" aria-hidden />}>
                      Go to payments
                    </Button>
                  </Link>
                }
                rowKey={(p) => p._id}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
