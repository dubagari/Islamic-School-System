import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  useGetStudentCbtAttemptsForStudentQuery,
  type CbtAttemptListItem,
} from "@/features/cbt/api";

function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function examTitle(exam: CbtAttemptListItem["exam"]) {
  return typeof exam === "object" && exam
    ? exam.title ?? "CBT exam"
    : "CBT exam";
}

export function ChildCbtPage() {
  const { studentId = "" } = useParams();
  const attemptsQ = useGetStudentCbtAttemptsForStudentQuery(
    { studentId, params: { page: 1, limit: 100 } },
    { skip: !studentId },
  );
  const attempts = attemptsQ.data?.data ?? [];

  const submitted = attempts.filter(
    (attempt) => attempt.status === "Submitted",
  );
  const passed = submitted.filter((attempt) => attempt.passed).length;
  const average = submitted.length
    ? Math.round(
        submitted.reduce(
          (sum, attempt) => sum + (attempt.percentage ?? 0),
          0,
        ) / submitted.length,
      )
    : 0;

  const columns: Column<CbtAttemptListItem>[] = [
    {
      key: "exam",
      header: "Exam",
      render: (attempt) => (
        <div>
          <p className="font-medium text-ink-900">
            {examTitle(attempt.exam)}
          </p>
          <p className="text-xs text-ink-500">
            Attempt {attempt.attemptNumber}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (attempt) => (
        <Badge
          tone={
            attempt.status === "Submitted"
              ? attempt.passed
                ? "success"
                : "danger"
              : attempt.status === "Voided"
                ? "neutral"
                : "warning"
          }
        >
          {attempt.status === "Submitted"
            ? attempt.resultVisible
              ? attempt.passed
                ? "Passed"
                : "Failed"
              : "Submitted"
            : attempt.status}
        </Badge>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      render: (attempt) =>
        attempt.resultVisible && attempt.status === "Submitted"
          ? `${attempt.score ?? 0}/${attempt.totalMarks ?? 0} (${attempt.percentage ?? 0}%)`
          : "—",
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (attempt) => fmtDateTime(attempt.submittedAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (attempt) =>
        attempt.status === "Submitted" && attempt.resultVisible ? (
          <Link
            to={`/parent/children/${studentId}/cbt/results/${attempt._id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-900"
          >
            <Trophy className="size-3.5" aria-hidden />
            View result
          </Link>
        ) : (
          <span className="text-xs text-ink-400">
            {attempt.status === "Submitted"
              ? "Awaiting release"
              : attempt.status}
          </span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CBT exams"
        arabic="الاختبارات الإلكترونية"
        description="Computer-based test attempts and released results for your child."
        breadcrumb={
          <Link
            to={`/parent/children/${studentId}`}
            className="hover:text-primary-700"
          >
            <ArrowLeft className="mr-1 inline size-3" aria-hidden />
            Child overview
          </Link>
        }
      />

      {attemptsQ.isError && (
        <Alert tone="error" className="mb-4">
          Could not load CBT attempts for this child.
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard label="Attempts" value={attempts.length} />
        <StatCard label="Submitted" value={submitted.length} />
        <StatCard label="Passed" value={passed} />
        <StatCard
          label="Average"
          value={`${average}%`}
          sub="Across submitted attempts"
        />
      </StatGrid>

      <Card
        title="Attempts"
        description="Scores appear once the teacher releases results."
      >
        <DataTable
          columns={columns}
          data={attempts}
          isLoading={attemptsQ.isLoading}
          rowKey={(attempt) => attempt._id}
          emptyTitle="No CBT attempts"
          emptyDescription="Your child has not taken a CBT exam yet."
        />
      </Card>
    </div>
  );
}
