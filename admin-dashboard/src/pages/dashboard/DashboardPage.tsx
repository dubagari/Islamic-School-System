import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  formatCellValue,
  formatPercentValue,
  formatStatNumber,
  getApiErrorMessage,
  useGetDashboardReportQuery,
} from "@/features/reports/api";
import type { DashboardReport } from "@/features/reports/api";
import type { AdmissionApplication } from "@/features/admissions/api";

import { SuperAdminDashboard } from "./SuperAdminDashboard";

export function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";

  const { data, isLoading, isError, error, refetch } =
    useGetDashboardReportQuery(undefined, { skip: !isAdmin && !isSuperAdmin });

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (!isAdmin) {
    return (
      <>
        <PageHeader
          title="Your dashboard"
          description={
            user
              ? `Signed in as ${user.fullName} (${user.role}).`
              : "Your personal area."
          }
        />
        <Card title="Welcome to DUMS">
          <p className="text-sm text-ink-600">
            Administrative statistics are only available to staff accounts.
            Your personal dashboard will appear here as features become
            available for your role.
          </p>
        </Card>
      </>
    );
  }

  return (
    <AdminDashboard
      data={data?.data}
      isLoading={isLoading}
      isError={isError}
      errorMessage={isError ? getApiErrorMessage(error) : null}
      onRetry={() => {
        void refetch();
      }}
    />
  );
}

function AdminDashboard({
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: {
  data?: DashboardReport;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  const students = data?.people.students;
  const teachers = data?.people.teachers;
  const academics = data?.academics;
  const attendance = data?.attendanceToday;

  const hasContent =
    students?.total != null ||
    teachers?.active != null ||
    academics?.activeEnrollments != null ||
    attendance?.attendanceRate != null ||
    Boolean(data?.recentAdmissions.length);

  return (
    <>
      <PageHeader
        title="Dashboard"
        arabic="بسم الله الرحمن الرحيم"
        description="School-wide summary from live reports."
      />

      {isError && (
        <Alert tone="error" title="Failed to load dashboard" className="mb-4">
          {errorMessage}
          <span className="mt-2 block">
            <Button size="sm" variant="outline" icon={<RefreshIcon />} onClick={onRetry}>
              Retry
            </Button>
          </span>
        </Alert>
      )}

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Total students"
          value={students?.total != null ? formatStatNumber(students.total) : "\u2014"}
          loading={isLoading}
          sub={
            students?.active != null
              ? `${formatStatNumber(students.active)} active`
              : undefined
          }
          icon={<GraduationCapIcon />}
        />
        <StatCard
          label="Active teachers"
          value={teachers?.active != null ? formatStatNumber(teachers.active) : "\u2014"}
          loading={isLoading}
          tone="primary"
          sub={
            data?.people.parents.active != null
              ? `${formatStatNumber(data.people.parents.active)} active parents`
              : undefined
          }
          icon={<UsersIcon />}
        />
        <StatCard
          label="Active enrollments"
          value={
            academics?.activeEnrollments != null
              ? formatStatNumber(academics.activeEnrollments)
              : "\u2014"
          }
          loading={isLoading}
          tone="gold"
          sub={
            academics?.activeClasses != null
              ? `${formatStatNumber(academics.activeClasses)} active classes`
              : undefined
          }
          icon={<ClipboardListIcon />}
        />
        <StatCard
          label="Attendance rate"
          value={
            attendance?.attendanceRate != null
              ? formatPercentValue(attendance.attendanceRate)
              : "\u2014"
          }
          loading={isLoading}
          sub={
            attendance?.total != null
              ? `${formatStatNumber(attendance.total)} records today`
              : undefined
          }
          icon={<CalendarCheckIcon />}
        />
      </StatGrid>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Academic signals">
          <SignalRow
            label="Pending admissions"
            value={academics?.pendingAdmissions}
            to="/admissions"
            loading={isLoading}
          />
          <SignalRow
            label="Published results"
            value={academics?.publishedResults}
            to="/results"
            loading={isLoading}
          />
          <SignalRow
            label="Awaiting publication"
            value={academics?.pendingResults}
            to="/results"
            loading={isLoading}
          />
        </Card>

        {data?.recentAdmissions && (
          <Card
            title="Recent admissions"
            description="Latest admission applications in the system."
          >
            <RecentAdmissionsTable rows={data.recentAdmissions} />
          </Card>
        )}
      </div>

      {!isLoading && !isError && !hasContent && (
        <EmptyState
          className="mt-6"
          title="No dashboard data yet"
          description="The dashboard report returned no content. Try again."
          action={
            <Button variant="outline" icon={<RefreshIcon />} onClick={onRetry}>
              Retry
            </Button>
          }
        />
      )}
    </>
  );
}

function SignalRow({
  label,
  value,
  to,
  loading,
}: {
  label: string;
  value?: number | null;
  to: string;
  loading?: boolean;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <Link to={to} className="text-xs font-medium text-ink-700 hover:text-primary-800">
        {label}
      </Link>
      <p
        className={`mt-0.5 text-lg font-bold text-ink-900 ${
          loading ? "animate-pulse bg-ink-100 text-transparent" : ""
        }`}
      >
        {value != null ? formatStatNumber(value) : "0"}
      </p>
    </div>
  );
}

function RecentAdmissionsTable({ rows }: { rows: AdmissionApplication[] }) {
  const columns = recentAdmissionColumns;

  if (rows.length === 0) {
    return <p className="text-sm text-ink-500">No recent admissions.</p>;
  }

  return <DataTable columns={columns} data={rows} rowKey={(row) => row._id} />;
}

const recentAdmissionColumns: Column<AdmissionApplication>[] = [
  {
    key: "applicationNumber",
    header: "Application",
    render: (row) => (
      <span className="font-mono text-xs">{row.applicationNumber ?? "\u2014"}</span>
    ),
  },
  {
    key: "fullName",
    header: "Applicant",
    render: (row) =>
      [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ") ||
      "\u2014",
  },
  {
    key: "status",
    header: "Status",
    render: (row) => row.status,
  },
  {
    key: "createdAt",
    header: "Created",
    align: "end",
    render: (row) => formatCellValue("createdAt", row.createdAt),
  },
];

const RefreshIcon = () => <RefreshCw className="size-4" aria-hidden />;
const GraduationCapIcon = () => <GraduationCap className="size-4" aria-hidden />;
const UsersIcon = () => <Users className="size-4" aria-hidden />;
const ClipboardListIcon = () => <ClipboardList className="size-4" aria-hidden />;
const CalendarCheckIcon = () => <CalendarCheck className="size-4" aria-hidden />;
