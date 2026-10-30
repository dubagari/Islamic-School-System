import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  extractErrorMessage,
  formatNaira,
  refName,
  useGetStudentAttendanceQuery,
  useGetStudentDashboardQuery,
  useGetStudentFeeSummaryQuery,
} from "@/features/student/api";

const quickLinks = [
  {
    title: "My results",
    description: "Report card, transcript and subject results.",
    label: "View results",
    path: "/student/results",
    icon: <BookOpenCheck className="size-4" aria-hidden />,
  },
  {
    title: "My attendance",
    description: "Daily attendance records and your attendance rate.",
    label: "View attendance",
    path: "/student/attendance",
    icon: <CalendarDays className="size-4" aria-hidden />,
  },
  {
    title: "My fees",
    description: "Invoices, payments and outstanding balance.",
    label: "View fees",
    path: "/student/fees",
    icon: <Wallet className="size-4" aria-hidden />,
  },
];

export function StudentDashboardPage() {
  const navigate = useNavigate();

  const {
    data: dashboardEnvelope,
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
    error: dashboardError,
  } = useGetStudentDashboardQuery();

  const dashboard = dashboardEnvelope?.data;
  const studentId = dashboard?.student.id ?? null;

  const {
    data: attendanceEnvelope,
    isLoading: isLoadingAttendance,
  } = useGetStudentAttendanceQuery(
    { studentId: studentId ?? "", page: 1, limit: 1 },
    { skip: !studentId },
  );

  const {
    data: feeEnvelope,
    isLoading: isLoadingFees,
  } = useGetStudentFeeSummaryQuery(
    { studentId: studentId ?? "" },
    { skip: !studentId },
  );

  const fullName = dashboard?.student.fullName ?? "";
  const registrationNumber = dashboard?.student.registrationNumber ?? "";
  const className = refName(dashboard?.student.academicClass) ?? "";
  const attendanceSummary = attendanceEnvelope?.summary;
  const feeSummary = feeEnvelope?.summary;

  const attendanceRate =
    attendanceSummary && attendanceSummary.total > 0
      ? attendanceSummary.attendanceRate
      : null;

  return (
    <div>
      <PageHeader
        title={fullName ? `Assalamu alaikum, ${fullName}` : "Student dashboard"}
        arabic="حج"
        description={
          registrationNumber
            ? `Student registration number: ${registrationNumber}`
            : "Your student portal overview."
        }
      />

      {isDashboardError && (
        <Alert tone="error" title="Could not load your dashboard" className="mb-4">
          {extractErrorMessage(dashboardError)}
        </Alert>
      )}

      {dashboard && dashboard.student.isActive === false && (
        <Alert tone="warning" title="Account is inactive" className="mb-4">
          <span className="inline-flex items-center gap-1 text-gold-900">
            <AlertTriangle className="size-3.5" aria-hidden />
            Your student account is currently inactive. Contact the school office.
          </span>
        </Alert>
      )}

      <StatGrid cols={4} className="mb-6">
        <StatCard
          label="Current level"
          value={dashboard?.student.currentLevel ?? "—"}
          sub={className ? `Class — ${className}` : "Class —"}
          icon={<GraduationCap className="size-4" aria-hidden />}
          tone="primary"
          loading={isLoadingDashboard}
        />
        <StatCard
          label="Payment status"
          value={<StatusBadge status={dashboard?.student.paymentStatus ?? ""} />}
          sub={
            dashboard?.student.status
              ? `Enrolment status: ${dashboard.student.status}`
              : "Enrolment status: —"
          }
          icon={<Wallet className="size-4" aria-hidden />}
          tone="gold"
          loading={isLoadingDashboard}
        />
        <StatCard
          label="Attendance rate"
          value={attendanceRate === null ? "—" : `${attendanceRate}%`}
          sub={
            attendanceSummary && attendanceSummary.total > 0
              ? `Across ${attendanceSummary.total} record${attendanceSummary.total === 1 ? "" : "s"} — Present ${attendanceSummary.Present}, Late ${attendanceSummary.Late}`
              : "No attendance records yet"
          }
          icon={<CalendarDays className="size-4" aria-hidden />}
          loading={isLoadingAttendance && !attendanceSummary}
        />
        <StatCard
          label="Outstanding balance"
          value={formatNaira(feeSummary?.totalBalance)}
          sub={
            feeSummary
              ? `${feeSummary.unpaidInvoices ?? 0} unpaid of ${feeSummary.invoices ?? 0} invoice${(feeSummary.invoices ?? 0) === 1 ? "" : "s"}`
              : "—"
          }
          icon={<Wallet className="size-4" aria-hidden />}
          tone="default"
          loading={isLoadingFees && !feeSummary}
        />
      </StatGrid>

      <Card
        title="Quick links"
        description="Jump straight into your academic records."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <div
              key={link.path}
              className="flex flex-col items-start gap-2 rounded-card border border-ink-100 bg-forest-50/40 p-4"
            >
              <div className="flex items-center gap-2 text-primary-800">
                {link.icon}
                <h3 className="text-sm font-semibold text-ink-900">
                  {link.title}
                </h3>
              </div>
              <p className="text-xs text-ink-500">{link.description}</p>
              <Button
                className="mt-auto"
                variant="outline"
                size="sm"
                iconRight={link.icon}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
