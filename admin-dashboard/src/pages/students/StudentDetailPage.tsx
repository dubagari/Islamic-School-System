import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";

import {
  classLabel,
  refName,
  studentFullName,
  useGetStudentEnrollmentHistoryQuery,
  useGetStudentFeeSummaryQuery,
  useGetStudentQuery,
  useGetStudentResultsQuery,
  useResetStudentPasswordMutation,
  type Student,
  type StudentResult,
} from "@/features/students/api";

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function money(amount: number | undefined) {
  if (amount === undefined || amount === null) return "—";
  return `₦${amount.toLocaleString()}`;
}

function subjectLabel(result: StudentResult) {
  const cs = result.classSubject;
  if (typeof cs === "object" && cs !== null) {
    const subject = cs.subject;
    const name =
      typeof subject === "object" && subject !== null ? subject.name : undefined;
    const prefix =
      typeof subject === "object" && subject !== null ? subject.prefix : undefined;
    return cs.courseCode || name || prefix || "—";
  }
  return "—";
}

function gradeTone(grade: string): "success" | "warning" | "danger" {
  switch (grade) {
    case "A":
    case "B":
      return "success";
    case "C":
    case "D":
      return "warning";
    default:
      return "danger";
  }
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink-50 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      <span className="text-sm text-ink-900">{value ?? "—"}</span>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "success"
        ? "text-primary-800"
        : "text-ink-900";
  return (
    <div className="rounded-lg border border-ink-100 bg-forest-50/60 px-4 py-3">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded bg-ink-100" />
      ))}
    </div>
  );
}

type ResetResult = {
  username: string;
  temporaryPassword: string;
};

export function StudentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const { data: studentData, isLoading, isError, error, refetch } =
    useGetStudentQuery(id, { skip: !id });
  const student = studentData?.data;

  const [resetStudentPassword, { isLoading: resetting }] =
    useResetStudentPasswordMutation();

  const confirmReset = () => {
    void (async () => {
      try {
        const response = await resetStudentPassword(id).unwrap();
        setResetConfirmOpen(false);
        setResetError(null);
        setResetResult({
          username: response.data.login.username,
          temporaryPassword: response.data.login.temporaryPassword,
        });
      } catch (err) {
        setResetError(
          (err as Error | undefined)?.message ?? "Password reset failed.",
        );
      }
    })();
  };

  return (
    <div>
      <PageHeader
        breadcrumb={
          <span className="inline-flex items-center gap-1">
            <Link to="/students" className="transition-colors hover:text-primary-700">
              Students
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-700">Detail</span>
          </span>
        }
        title={student ? studentFullName(student) : "Student"}
        description={student ? `Reg # ${student.registrationNumber}` : undefined}
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft className="size-4" aria-hidden />}
            onClick={() => navigate("/students")}
          >
            Back
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load student" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {resetError && (
        <Alert
          tone="error"
          title="Password reset failed"
          className="mb-4"
          onDismiss={() => setResetError(null)}
        >
          {resetError}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="md:col-span-2 xl:col-span-3">
          {isLoading || !student ? (
            <div className="flex animate-pulse items-center gap-4">
              <div className="size-14 rounded-full bg-ink-100" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-ink-100" />
                <div className="h-3 w-24 rounded bg-ink-100" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-700 text-base font-semibold text-primary-50">
                  {initials(studentFullName(student))}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-lg font-semibold text-ink-900">
                      {studentFullName(student)}
                    </p>
                    <StatusBadge status={student.status} />
                    {!student.isActive && <Badge tone="neutral">Inactive</Badge>}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-ink-500">
                    {student.registrationNumber} · {student.currentLevel || "—"} ·{" "}
                    {refName(classLabel(student.academicClass))}
                  </p>
                  {student.user?.username && (
                    <p className="mt-0.5 text-xs text-ink-500">
                      Account: @{student.user.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  icon={<KeyRound className="size-4" aria-hidden />}
                  onClick={() => {
                    setResetError(null);
                    setResetConfirmOpen(true);
                  }}
                >
                  Reset password
                </Button>
              </div>
            </div>
          )}
        </Card>

        <PersonalDetailsCard student={student} isLoading={isLoading} />
        <GuardianDetailsCard student={student} isLoading={isLoading} />
        <EnrollmentHistoryCard studentId={id} />
        <ResultsCard studentId={id} />
        <FinanceSummaryCard studentId={id} />
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset student password"
        confirmLabel="Reset password"
        loading={resetting}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={confirmReset}
        description={
          student?.user?.username
            ? `The password for @${student.user.username} will be replaced with a temporary password. It must be changed at next login.`
            : "A temporary password will be generated for this student's account."
        }
      />

      <Dialog
        open={resetResult !== null}
        onClose={() => setResetResult(null)}
        title="Password reset successfully"
        description="Share these credentials securely. This dialog will not be shown again."
        footer={<Button onClick={() => setResetResult(null)}>Done</Button>}
      >
        {resetResult && (
          <div className="space-y-3">
            <DetailItem
              label="Username"
              value={<span className="font-mono">{resetResult.username}</span>}
            />
            <DetailItem
              label="Temporary password"
              value={
                <span className="font-mono font-semibold">
                  {resetResult.temporaryPassword}
                </span>
              }
            />
            <Alert tone="info">
              The student is required to change this password at next login.
            </Alert>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function PersonalDetailsCard({
  student,
  isLoading,
}: {
  student: Student | undefined;
  isLoading: boolean;
}) {
  return (
    <Card title="Personal details">
      {isLoading || !student ? (
        <SkeletonRows count={6} />
      ) : (
        <div>
          <DetailItem label="Full name" value={studentFullName(student)} />
          <DetailItem
            label="Registration number"
            value={<span className="font-mono text-xs">{student.registrationNumber}</span>}
          />
          <DetailItem
            label="Application number"
            value={<span className="font-mono text-xs">{student.applicationNumber}</span>}
          />
          <DetailItem label="Gender" value={student.gender || "—"} />
          <DetailItem label="Date of birth" value={fmtDate(student.dateOfBirth)} />
          <DetailItem label="Phone" value={student.phone || "—"} />
          <DetailItem label="Email" value={student.email || "—"} />
          <DetailItem label="Address" value={student.address || "—"} />
          <DetailItem label="Current level" value={student.currentLevel || "—"} />
          <DetailItem
            label="Previous madrasa"
            value={student.previousMadrasa || "—"}
          />
          <DetailItem
            label="Class"
            value={refName(classLabel(student.academicClass))}
          />
          <DetailItem label="Payment status" value={student.paymentStatus || "—"} />
          {student.statusReason && (
            <DetailItem label="Status reason" value={student.statusReason} />
          )}
        </div>
      )}
    </Card>
  );
}

function GuardianDetailsCard({
  student,
  isLoading,
}: {
  student: Student | undefined;
  isLoading: boolean;
}) {
  return (
    <Card title="Guardian">
      {isLoading || !student ? (
        <SkeletonRows count={4} />
      ) : (
        <div>
          <DetailItem label="Guardian name" value={student.parentName || "—"} />
          <DetailItem label="Guardian phone" value={student.parentPhone || "—"} />
          <DetailItem label="Guardian email" value={student.parentEmail || "—"} />
          <DetailItem label="Relationship" value={student.relationship || "—"} />
        </div>
      )}
    </Card>
  );
}

function EnrollmentHistoryCard({ studentId }: { studentId: string }) {
  const {
    data: historyData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentEnrollmentHistoryQuery(studentId, { skip: !studentId });

  const enrollments = historyData?.data ?? [];

  return (
    <Card
      title="Enrollment history"
      description="Class membership per academic session"
    >
      {isError ? (
        <Alert tone="error" title="Could not load enrollment history">
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : isLoading ? (
        <SkeletonRows count={3} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments"
          description="This student has no enrollment records yet."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {refName(classLabel(enrollment.academicClass))}
                </p>
                <p className="text-xs text-ink-500">
                  {refName(enrollment.academicSession)} · Enrolled{" "}
                  {fmtDate(enrollment.enrollmentDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={enrollment.status} />
                {!enrollment.isActive && <Badge tone="neutral">Inactive</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ResultsCard({ studentId }: { studentId: string }) {
  const {
    data: resultsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentResultsQuery({ studentId, limit: 100 }, { skip: !studentId });

  const results = resultsData?.data ?? [];
  const summary = resultsData?.summary;

  const columns: Column<StudentResult>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (r) => subjectLabel(r),
    },
    {
      key: "semester",
      header: "Semester",
      render: (r) => refName(r.academicSemester),
    },
    {
      key: "totalScore",
      header: "Score",
      align: "end",
      sortValue: (r) => r.totalScore,
      render: (r) => r.totalScore ?? "—",
    },
    {
      key: "letterGrade",
      header: "Grade",
      align: "center",
      render: (r) => (
        <Badge tone={gradeTone(r.letterGrade)}>{r.letterGrade || "—"}</Badge>
      ),
    },
  ];

  return (
    <Card
      title="Academic results"
      padded={false}
      className="md:col-span-2 xl:col-span-3"
      description={
        summary && summary.averageScore !== undefined
          ? `Average ${summary.averageScore}${summary.gpa !== undefined ? ` · GPA ${summary.gpa}` : ""}`
          : "Weighted results computed for this student"
      }
    >
      <div className="p-4">
        {isError ? (
          <Alert tone="error" title="Could not load results">
            <div className="flex items-center gap-3">
              <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          </Alert>
        ) : (
          <DataTable
            columns={columns}
            data={isError ? undefined : results}
            isLoading={isLoading}
            emptyTitle="No academic records"
            emptyDescription="No results have been computed or published for this student yet."
            rowKey={(r) => r._id}
          />
        )}
      </div>
    </Card>
  );
}

function FinanceSummaryCard({ studentId }: { studentId: string }) {
  const {
    data: feeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetStudentFeeSummaryQuery(studentId, { skip: !studentId });

  const summary = feeData?.summary;

  return (
    <Card
      title="Finance summary"
      description="Billed, collected and outstanding fees"
    >
      {isError ? (
        <Alert tone="error" title="Could not load finance summary">
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : isLoading || !summary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatBox label="Total billed" value={money(summary.totalBilled)} />
          <StatBox label="Total paid" value={money(summary.totalPaid)} />
          <StatBox
            label="Outstanding balance"
            value={money(summary.totalBalance)}
            tone={summary.totalBalance > 0 ? "danger" : "success"}
          />
          <StatBox
            label="Unpaid invoices"
            value={String(summary.unpaidInvoices ?? "—")}
          />
        </div>
      )}
    </Card>
  );
}
