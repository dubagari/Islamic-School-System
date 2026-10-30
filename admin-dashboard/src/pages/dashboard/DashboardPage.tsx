import { useMemo } from "react";
import { CalendarCheck, ClipboardList, GraduationCap, RefreshCw, Users } from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { selectCurrentUser } from "@/features/auth/authSlice";
import {
  findAdmissionsBreakdown,
  findRecordArray,
  formatCellValue,
  formatPercentValue,
  formatStatNumber,
  getApiErrorMessage,
  isRecord,
  pickNumber,
  prettifyKey,
  useGetDashboardReportQuery,
} from "@/features/reports/api";

const RECENT_KEYS = [/recent/i, /application/i, /admission/i];

function statValue(
  root: unknown,
  patterns: RegExp[],
  percent = false,
): string {
  const found = pickNumber(root, patterns);
  if (found === null) return "\u2014";
  return percent ? formatPercentValue(found) : formatStatNumber(found);
}

export function DashboardPage() {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, error, refetch } =
    useGetDashboardReportQuery(undefined, { skip: !isAdmin });

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
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  const totalStudents = statValue(data, [
    /^totalStudents$/i,
    /^totalStudentsCount$/i,
    /^totalActiveStudents$/i,
    /^studentsCount$/i,
    /^students$/i,
    /^totalStudent$/i,
  ]);
  const totalTeachers = statValue(data, [
    /^totalTeachers$/i,
    /^teachersCount$/i,
    /^teachers$/i,
    /^totalTeacher$/i,
  ]);
  const activeEnrollments = statValue(data, [
    /^activeEnrollments$/i,
    /^totalEnrollments$/i,
    /^enrollmentsCount$/i,
    /^currentEnrollments$/i,
    /^enrollments$/i,
  ]);
  const attendanceRate = statValue(
    data,
    [
      /^overallAttendanceRate$/i,
      /^totalAttendanceRate$/i,
      /^attendanceRate$/i,
      /^attendancePercentage$/i,
      /^averageAttendance/i,
    ],
    true,
  );

  const breakdown = useMemo(() => findAdmissionsBreakdown(data), [data]);
  const recentRows = useMemo(
    () => findRecordArray(data, RECENT_KEYS),
    [data],
  );

  const hasStats =
    totalStudents !== "\u2014" ||
    totalTeachers !== "\u2014" ||
    activeEnrollments !== "\u2014" ||
    attendanceRate !== "\u2014";
  const hasContent = hasStats || Boolean(breakdown) || Boolean(recentRows);

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
            <Button size="sm" variant="outline" icon={<ArrowPathIcon />} onClick={onRetry}>
              Retry
            </Button>
          </span>
        </Alert>
      )}

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Total students"
          value={totalStudents}
          loading={isLoading}
          icon={<GraduationCapIcon />}
        />
        <StatCard
          label="Total teachers"
          value={totalTeachers}
          loading={isLoading}
          tone="primary"
          icon={<UsersIcon />}
        />
        <StatCard
          label="Active enrollments"
          value={activeEnrollments}
          loading={isLoading}
          tone="gold"
          icon={<ClipboardListIcon />}
        />
        <StatCard
          label="Attendance rate"
          value={attendanceRate}
          loading={isLoading}
          icon={<CalendarCheckIcon />}
        />
      </StatGrid>

      {breakdown && <AdmissionsBreakdownCard breakdown={breakdown} />}

      {recentRows && recentRows.length > 0 && (
        <Card
          title="Recent admissions"
          description="Latest admission applications in the system."
          className="mt-6"
        >
          <RecentAdmissionsTable rows={recentRows} />
        </Card>
      )}

      {!isLoading && !isError && !hasContent && (
        <EmptyState
          className="mt-6"
          title="No dashboard data yet"
          description="The dashboard report returned no content. Try again."
          action={
            <Button variant="outline" icon={<ArrowPathIcon />} onClick={onRetry}>
              Retry
            </Button>
          }
        />
      )}
    </>
  );
}

function AdmissionsBreakdownCard({
  breakdown,
}: {
  breakdown: { pending: number | null; approved: number | null; rejected: number | null };
}) {
  const entries = [
    { label: "Pending", value: breakdown.pending, bar: "bg-gold-500" },
    { label: "Approved", value: breakdown.approved, bar: "bg-primary-700" },
    { label: "Rejected", value: breakdown.rejected, bar: "bg-red-600" },
  ].filter((entry) => entry.value !== null) as {
    label: string;
    value: number;
    bar: string;
  }[];

  if (entries.length === 0) return null;

  const max = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <Card title="Admissions status" description="Applications by current status.">
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink-700">{entry.label}</span>
              <span className="text-ink-500">{formatStatNumber(entry.value)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100" role="presentation">
              <div
                className={`h-full rounded-full ${entry.bar}`}
                style={{ width: `${Math.max((entry.value / max) * 100, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecentAdmissionsTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = useMemo<Column<Record<string, unknown>>[]>(() => {
    const preferred = [
      "applicationNumber",
      "fullName",
      "name",
      "applicantName",
      ...Object.keys(rows[0] ?? {}),
    ];
    const seen = new Set<string>();
    const keys: string[] = [];

    for (const key of preferred) {
      if (seen.has(key)) continue;
      const value = rows[0]?.[key];
      if (value === undefined || typeof value === "object") {
        continue;
      }
      seen.add(key);
      keys.push(key);
      if (keys.length >= 6) break;
    }

    return keys.map((key) => ({
      key,
      header: prettifyKey(key),
      render: (row) => formatCellValue(key, row[key]),
    }));
  }, [rows]);

  if (columns.length === 0) return null;

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(row, index) => {
        const id =
          (isRecord(row) && (row._id ?? row.id ?? row.applicationNumber)) ?? "";
        return `${String(id)}-${index}`;
      }}
    />
  );
}

const ArrowPathIcon = () => <RefreshCw className="size-4" aria-hidden />;
const GraduationCapIcon = () => <GraduationCap className="size-4" aria-hidden />;
const UsersIcon = () => <Users className="size-4" aria-hidden />;
const ClipboardListIcon = () => <ClipboardList className="size-4" aria-hidden />;
const CalendarCheckIcon = () => <CalendarCheck className="size-4" aria-hidden />;
