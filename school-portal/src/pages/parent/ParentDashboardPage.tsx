import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Users,
  Wallet,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  displayName,
  classNameRef,
  formatNaira,
  getErrorMessage,
  useGetParentDashboardQuery,
} from "@/features/parent/api";

export function ParentDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } =
    useGetParentDashboardQuery();

  const children = useMemo(() => data?.children ?? [], [data]);

  if (isLoading) {
    return <PageLoader />;
  }

  const summary = data?.summary;

  return (
    <div>
      <PageHeader
        title="Parent Overview"
        arabic="ملخص الأبناء"
        description={
          data?.parent
            ? `Welcome, ${data.parent.fullName}. Track attendance, results, and fees for each of your children.`
            : "Track attendance, results, and fees for each of your children."
        }
        actions={
          <Button
            variant="outline"
            onClick={() => void refetch()}
            icon={<ArrowRight className="size-4" aria-hidden />}
          >
            Refresh
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load your dashboard" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <StatGrid cols={2} className="mb-6">
        <StatCard
          label="Children"
          value={summary ? summary.children.toLocaleString() : "—"}
          icon={<Users className="size-4" aria-hidden />}
          tone="primary"
          sub="Students linked to your account"
        />
        <StatCard
          label="Total outstanding fees"
          value={summary ? formatNaira(summary.totalOutstanding) : "—"}
          icon={<Wallet className="size-4" aria-hidden />}
          tone={summary && summary.totalOutstanding > 0 ? "danger" : "primary"}
          sub="Across all children"
        />
      </StatGrid>

      <SectionTitle>Your children</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {children.map((child) => {
          const student = child.student;
          const name = displayName(student);
          const attendanceRate =
            child.attendance?.total && child.attendance.total > 0
              ? `${Number(child.attendance.attendanceRate ?? 0).toFixed(1)}%`
              : "—";
          const resultsAverage =
            child.results?.subjects && child.results.subjects > 0
              ? Number(child.results.averageScore ?? 0).toFixed(1)
              : "—";
          const feesBalance =
            child.fees?.invoices && child.fees.invoices > 0
              ? formatNaira(child.fees.totalBalance)
              : "—";
          const base = `/parent/children/${student._id}`;

          return (
            <Card key={student._id} padded={false}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                    <GraduationCap className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink-900">
                      {name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">
                        {classNameRef(student.academicClass) === "—"
                          ? "No class set"
                          : classNameRef(student.academicClass)}
                      </Badge>
                      {student.registrationNumber && (
                        <span className="truncate text-xs text-ink-500">
                          {student.registrationNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => void navigate(base)}
                  iconRight={<ArrowRight className="size-3.5" aria-hidden />}
                >
                  View
                </Button>
              </div>
              <div className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 text-center">
                <div className="px-3 py-3">
                  <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500">
                    <CalendarCheck className="size-3.5" aria-hidden />
                    Attendance
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink-900">
                    {attendanceRate}
                  </p>
                </div>
                <div className="px-3 py-3">
                  <p className="text-[11px] font-medium text-ink-500">
                    Results average
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink-900">
                    {resultsAverage}
                  </p>
                </div>
                <div className="px-3 py-3">
                  <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500">
                    <Wallet className="size-3.5" aria-hidden />
                    Balance
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink-900">
                    {feesBalance}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                <Link
                  to={`${base}/attendance`}
                  className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
                >
                  Attendance
                </Link>
                <span aria-hidden className="text-ink-300">
                  ·
                </span>
                <Link
                  to={`${base}/results`}
                  className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
                >
                  Results
                </Link>
                <span aria-hidden className="text-ink-300">
                  ·
                </span>
                <Link
                  to={`${base}/fees`}
                  className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
                >
                  Fees
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {!isLoading && !isError && children.length === 0 && (
        <Card className="text-center text-sm text-ink-500">
          No children are linked to your parent account yet. Contact the school
          office to link your students.
        </Card>
      )}
    </div>
  );
}
