import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Activity,
  Banknote,
  CalendarCheck,
  FileText,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  useGetAuditLogsQuery,
  useGetSystemInfoQuery,
  type AuditLog,
  type SystemInfoData,
} from "@/features/admin/api";
import { formatNaira, type Payment } from "@/features/finance/api";
import {
  formatPercentValue,
  formatStatNumber,
  getApiErrorMessage,
  useGetDashboardReportQuery,
  type DashboardReport,
} from "@/features/reports/api";
import type { AdmissionApplication } from "@/features/admissions/api";

const PAGE_LIMIT = 5;

type BarRow = {
  label: string;
  value: number;
  bar: string;
};

function fmtUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "\u2014";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

function auditUserLabel(log: AuditLog): string {
  if (!log.user) return "Unknown";
  if (typeof log.user === "string") return log.user;
  return log.user.fullName || `@${log.user.username ?? log.user._id}`;
}

function paymentStudentLabel(student: Payment["student"]): string {
  if (!student || typeof student === "string") return "\u2014";
  return (
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") || "\u2014"
  );
}

function admissionStudentLabel(student: AdmissionApplication): string {
  return (
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") || "\u2014"
  );
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "\u2014";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "\u2014"
    : parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function BarList({ rows, total }: { rows: BarRow[]; total: number }) {
  if (total === 0) {
    return <p className="text-sm text-ink-500">No records yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-700">{row.label}</span>
            <span className="text-ink-500">{formatStatNumber(row.value)}</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
            role="presentation"
          >
            <div
              className={`h-full rounded-full ${row.bar}`}
              style={{ width: `${total ? Math.max((row.value / total) * 100, 2) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SuperAdminDashboard() {
  const dashboardQuery = useGetDashboardReportQuery();
  const systemInfoQuery = useGetSystemInfoQuery();
  const auditLogsQuery = useGetAuditLogsQuery({
    page: 1,
    limit: PAGE_LIMIT,
  });

  const dashboard: DashboardReport | undefined = dashboardQuery.data?.data;
  const systemInfo: SystemInfoData | undefined = systemInfoQuery.data?.data;
  const auditLogs = auditLogsQuery.data?.data ?? [];

  const totals = dashboard?.people.students;
  const attendance = dashboard?.attendanceToday;
  const finance = dashboard?.finance;

  const attendanceRows: BarRow[] = attendance
    ? [
        { label: "Present", value: attendance.Present, bar: "bg-primary-600" },
        { label: "Late", value: attendance.Late, bar: "bg-gold-500" },
        { label: "Absent", value: attendance.Absent, bar: "bg-red-600" },
        { label: "Excused", value: attendance.Excused, bar: "bg-ink-400" },
      ]
    : [];

  const invoiceRows: BarRow[] = finance
    ? [
        { label: "Paid", value: finance.invoices.byStatus.Paid, bar: "bg-primary-600" },
        {
          label: "Partially paid",
          value: finance.invoices.byStatus["Partially Paid"],
          bar: "bg-gold-500",
        },
        { label: "Unpaid", value: finance.invoices.byStatus.Unpaid, bar: "bg-ink-500" },
        { label: "Overdue", value: finance.invoices.byStatus.Overdue, bar: "bg-red-600" },
        {
          label: "Cancelled",
          value: finance.invoices.byStatus.Cancelled,
          bar: "bg-ink-400",
        },
      ]
    : [];

  const admissionColumns: Column<AdmissionApplication>[] = [
    {
      key: "applicationNumber",
      header: "Application",
      render: (row) => (
        <span className="font-mono text-xs">{row.applicationNumber ?? "\u2014"}</span>
      ),
    },
    {
      key: "student",
      header: "Applicant",
      render: (row) => admissionStudentLabel(row),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      align: "end",
      render: (row) => fmtDate(row.createdAt),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    {
      key: "receiptNumber",
      header: "Receipt",
      render: (row) => (
        <Link
          to={`/fees/invoices/${typeof row.invoice === "object" ? row.invoice?._id : ""}`}
          className="font-mono text-xs font-medium text-primary-700 hover:underline"
        >
          {row.receiptNumber}
        </Link>
      ),
    },
    {
      key: "student",
      header: "Student",
      render: (row) => paymentStudentLabel(row.student),
    },
    {
      key: "amount",
      header: "Amount",
      align: "end",
      render: (row) => formatNaira(row.amount),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => row.method,
    },
    {
      key: "paidAt",
      header: "Paid",
      align: "end",
      render: (row) => fmtDate(row.paidAt),
    },
  ];

  const auditColumns: Column<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (row) => <span className="whitespace-nowrap text-xs">{fmtDate(row.createdAt)}</span>,
    },
    {
      key: "user",
      header: "User",
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-ink-900">{auditUserLabel(row)}</p>
          {row.role && <p className="text-ink-500">{row.role}</p>}
        </div>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => <Badge tone={row.success ? "success" : "danger"}>{row.method}</Badge>,
    },
    {
      key: "path",
      header: "Path",
      render: (row) => (
        <span className="block max-w-xs truncate font-mono text-xs" title={row.path}>
          {row.path}
        </span>
      ),
    },
  ];

  const refresh = () => {
    void dashboardQuery.refetch();
    void systemInfoQuery.refetch();
    void auditLogsQuery.refetch();
  };

  const dashboardErrorMessage = dashboardQuery.isError
    ? getApiErrorMessage(dashboardQuery.error)
    : null;

  return (
    <div>
      <PageHeader
        title="Super Admin Dashboard"
        arabic="بسم الله الرحمن الرحيم"
        description="Institution operations, finances, and system administration at a glance."
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className="size-4" aria-hidden />}
            loading={
              dashboardQuery.isFetching ||
              systemInfoQuery.isFetching ||
              auditLogsQuery.isFetching
            }
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      {dashboard?.academicContext.session?.name && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="info">{dashboard.academicContext.session.name}</Badge>
          {dashboard.academicContext.semester?.name && (
            <Badge tone="neutral">{dashboard.academicContext.semester.name}</Badge>
          )}
        </div>
      )}

      {dashboardErrorMessage && (
        <Alert tone="error" title="Could not load dashboard" className="mb-4">
          <span>{dashboardErrorMessage} </span>
          <button
            type="button"
            className="font-medium text-red-800 underline underline-offset-2"
            onClick={() => void dashboardQuery.refetch()}
          >
            Retry
          </button>
        </Alert>
      )}

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Students"
          value={totals ? formatStatNumber(totals.total) : "\u2014"}
          loading={dashboardQuery.isLoading}
          icon={<GraduationCap className="size-4" aria-hidden />}
          sub={
            totals
              ? `${formatStatNumber(totals.active)} active · ${formatStatNumber(
                  totals.newThisMonth,
                )} new this month`
              : undefined
          }
        />
        <StatCard
          label="Active teachers"
          value={
            dashboard?.people.teachers.active != null
              ? formatStatNumber(dashboard.people.teachers.active)
              : "\u2014"
          }
          tone="primary"
          loading={dashboardQuery.isLoading}
          icon={<Users className="size-4" aria-hidden />}
          sub={
            dashboard?.people.parents.active != null
              ? `${formatStatNumber(dashboard.people.parents.active)} active parents`
              : undefined
          }
        />
        <StatCard
          label="Active enrollments"
          value={
            dashboard?.academics.activeEnrollments != null
              ? formatStatNumber(dashboard.academics.activeEnrollments)
              : "\u2014"
          }
          tone="gold"
          loading={dashboardQuery.isLoading}
          icon={<FileText className="size-4" aria-hidden />}
          sub={
            dashboard?.academics.activeClasses != null
              ? `${formatStatNumber(dashboard.academics.activeClasses)} active classes`
              : undefined
          }
        />
        <StatCard
          label="Attendance rate (today)"
          value={
            attendance ? formatPercentValue(attendance.attendanceRate) : "\u2014"
          }
          loading={dashboardQuery.isLoading}
          icon={<CalendarCheck className="size-4" aria-hidden />}
          sub={
            attendance?.total != null
              ? `${formatStatNumber(attendance.total)} records today`
              : undefined
          }
        />
      </StatGrid>

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Total billed"
          value={finance ? formatNaira(finance.invoices.totalBilled) : "\u2014"}
          loading={dashboardQuery.isLoading}
          icon={<FileText className="size-4" aria-hidden />}
          sub={
            finance
              ? `${formatStatNumber(finance.invoices.count)} invoices`
              : undefined
          }
        />
        <StatCard
          label="Collected"
          tone="primary"
          value={finance ? formatNaira(finance.payments.totalCollected) : "\u2014"}
          loading={dashboardQuery.isLoading}
          icon={<Banknote className="size-4" aria-hidden />}
          sub={
            finance
              ? `${formatStatNumber(finance.payments.count)} completed payments`
              : undefined
          }
        />
        <StatCard
          label="Outstanding"
          tone="gold"
          value={finance ? formatNaira(finance.invoices.totalOutstanding) : "\u2014"}
          loading={dashboardQuery.isLoading}
          icon={<Wallet className="size-4" aria-hidden />}
        />
        <StatCard
          label="Collection rate"
          value={finance ? formatPercentValue(finance.collectionRate) : "\u2014"}
          loading={dashboardQuery.isLoading}
          icon={<TrendingUp className="size-4" aria-hidden />}
        />
      </StatGrid>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Attendance today">
          <BarList rows={attendanceRows} total={attendance?.total ?? 0} />
        </Card>
        <Card
          title="Invoice status"
          description="Fee invoices across the active academic scope."
        >
          <BarList
            rows={invoiceRows}
            total={
              finance
                ? Object.values(finance.invoices.byStatus).reduce(
                    (sum, value) => sum + value,
                    0,
                  )
                : 0
            }
          />
        </Card>
      </div>

      <Card title="Operational signals" className="mb-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OperationalSignal
            to="/admissions"
            label="Pending admissions"
            value={dashboard?.academics.pendingAdmissions}
            loading={dashboardQuery.isLoading}
          />
          <OperationalSignal
            to="/results"
            label="Published results"
            value={dashboard?.academics.publishedResults}
            loading={dashboardQuery.isLoading}
          />
          <OperationalSignal
            to="/results"
            label="Awaiting publication"
            value={dashboard?.academics.pendingResults}
            loading={dashboardQuery.isLoading}
          />
          <OperationalSignal
            to="/fees/invoices"
            label="Unpaid & overdue"
            value={
              finance
                ? finance.invoices.byStatus.Unpaid + finance.invoices.byStatus.Overdue
                : undefined
            }
            loading={dashboardQuery.isLoading}
          />
        </ul>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Recent admissions"
          description="The five most recent applications."
          padded={false}
          bodyClassName="p-4"
        >
          <DataTable
            columns={admissionColumns}
            data={dashboard?.recentAdmissions}
            rowKey={(row) => row._id}
          />
        </Card>
        <Card
          title="Recent payments"
          description="The five most recent school-fee receipts."
          padded={false}
          bodyClassName="p-4"
        >
          <DataTable
            columns={paymentColumns}
            data={dashboard?.recentPayments}
            rowKey={(row) => row._id}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="System health"
          description="Runtime state from /system/info."
          actions={
            <Link
              to="/admin/system"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              Open System
            </Link>
          }
        >
          {systemInfoQuery.isError ? (
            <Alert tone="error" title="Could not load system info">
              {getApiErrorMessage(systemInfoQuery.error)}
            </Alert>
          ) : (
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Database" value={systemInfo?.database?.state ?? "\u2014"} />
              <Row label="Database name" value={systemInfo?.database?.name ?? "\u2014"} />
              <Row
                label="Uptime"
                value={fmtUptime(systemInfo?.application?.uptimeSeconds)}
              />
              <Row
                label="User accounts"
                value={
                  systemInfo?.records?.users != null
                    ? formatStatNumber(systemInfo.records.users)
                    : "\u2014"
                }
              />
              <Row
                label="Audit events"
                value={
                  systemInfo?.records?.auditLogs != null
                    ? formatStatNumber(systemInfo.records.auditLogs)
                    : "\u2014"
                }
              />
              <Row
                label="Generated"
                value={fmtDate(systemInfo?.generatedAt)}
              />
            </dl>
          )}
        </Card>

        <Card
          title="Recent audit activity"
          description="Latest authenticated mutations and request outcomes."
          padded={false}
          bodyClassName="p-4"
          actions={
            <Link
              to="/admin/audit-logs"
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              View all
            </Link>
          }
        >
          {auditLogsQuery.isError ? (
            <Alert tone="error" title="Could not load audit logs">
              {getApiErrorMessage(auditLogsQuery.error)}
            </Alert>
          ) : (
            <DataTable
              columns={auditColumns}
              data={auditLogs}
              emptyTitle="No audit activity"
              rowKey={(row) => row._id}
            />
          )}
        </Card>
      </div>

      <Card title="Administration shortcuts" className="mt-6">
        <div className="grid gap-2 sm:grid-cols-3">
          <ShortcutLink to="/users" label="User accounts" />
          <ShortcutLink to="/fees" label="Finance overview" />
          <ShortcutLink to="/admin/settings" label="Settings" />
          <ShortcutLink to="/admin/system" label="System maintenance" />
          <ShortcutLink to="/admin/audit-logs" label="Audit logs" />
          <ShortcutLink to="/reports" label="Reports" />
        </div>
      </Card>
    </div>
  );
}

function OperationalSignal({
  to,
  label,
  value,
  loading,
}: {
  to: string;
  label: string;
  value?: number;
  loading?: boolean;
}) {
  return (
    <li className="rounded-lg border border-ink-100 bg-white p-3">
      <Link to={to} className="text-xs font-medium text-ink-700 hover:text-primary-800">
        {label}
      </Link>
      <p
        className={`mt-1 text-lg font-bold text-ink-900 ${
          loading ? "animate-pulse bg-ink-100 text-transparent" : ""
        }`}
      >
        {loading ? "000" : formatStatNumber(value ?? 0)}
      </p>
    </li>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd className="truncate text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function ShortcutLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-800 transition-colors hover:border-primary-200 hover:bg-primary-50"
    >
      {label}
      <Activity className="size-4 text-ink-400" aria-hidden />
    </Link>
  );
}
