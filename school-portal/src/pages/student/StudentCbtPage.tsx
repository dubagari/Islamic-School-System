import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, PlayCircle, RotateCcw, Trophy } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  cbtErrorMessage,
  cbtSubjectLabel,
  useStartCbtAttemptMutation,
  useGetStudentCbtExamsQuery,
  type StudentCbtExam,
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

const statusTone = (status: StudentCbtExam["status"]) => {
  switch (status) {
    case "Available":
      return "success" as const;
    case "InProgress":
      return "info" as const;
    case "Upcoming":
      return "warning" as const;
    case "Completed":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
};

export function StudentCbtPage() {
  const navigate = useNavigate();
  const examsQ = useGetStudentCbtExamsQuery({ page: 1, limit: 200 });
  const exams = examsQ.data?.data ?? [];
  const [startAttempt, startState] = useStartCbtAttemptMutation();
  const [error, setError] = useState("");

  const openExam = async (exam: StudentCbtExam) => {
    setError("");
    if (exam.status === "InProgress" && exam.attempt?._id) {
      navigate(`/student/cbt/attempts/${exam.attempt._id}`);
      return;
    }
    if (exam.status !== "Available") {
      if (exam.attempt?._id) {
        navigate(`/student/cbt/results/${exam.attempt._id}`);
      }
      return;
    }
    try {
      const response = await startAttempt(exam._id).unwrap();
      navigate(`/student/cbt/attempts/${response.data.attempt._id}`);
    } catch (err) {
      setError(cbtErrorMessage(err));
    }
  };

  const columns: Column<StudentCbtExam>[] = [
    {
      key: "exam",
      header: "Exam",
      render: (exam) => (
        <div>
          <p className="font-medium text-ink-900">{exam.title}</p>
          <p className="text-xs text-ink-500">
            {cbtSubjectLabel(exam.classSubject)}
          </p>
        </div>
      ),
    },
    {
      key: "window",
      header: "Available",
      render: (exam) => (
        <div className="text-xs text-ink-600">
          <div>{fmtDateTime(exam.startAt)}</div>
          <div className="text-ink-400">to {fmtDateTime(exam.endAt)}</div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      render: (exam) => `${exam.durationMinutes} min`,
    },
    {
      key: "attempt",
      header: "Attempt",
      render: (exam) => (
        <div className="space-y-1">
          <Badge tone={statusTone(exam.status)}>{exam.status}</Badge>
          {exam.attempt?.status === "Submitted" && (
            <p className="text-xs text-ink-500">
              {exam.attempt.score ?? 0}/{exam.attempt.totalMarks ?? 0} (
              {exam.attempt.percentage ?? 0}%)
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (exam) => {
        const attemptId = exam.attempt?._id;
        if (exam.status === "InProgress") {
          return (
            <Button
              size="sm"
              icon={<PlayCircle className="size-3.5" aria-hidden />}
              onClick={() => openExam(exam)}
            >
              Resume
            </Button>
          );
        }
        if (exam.status === "Available") {
          return (
            <div className="flex flex-col items-end gap-1">
              <Button
                size="sm"
                loading={startState.isLoading}
                icon={<RotateCcw className="size-3.5" aria-hidden />}
                onClick={() => openExam(exam)}
              >
                {exam.attempt?.status === "Submitted"
                  ? "Retake exam"
                  : "Start exam"}
              </Button>
              {attemptId && (
                <Link
                  to={`/student/cbt/results/${attemptId}`}
                  className="text-xs font-medium text-primary-700 hover:text-primary-900"
                >
                  Last result
                </Link>
              )}
            </div>
          );
        }
        if (attemptId) {
          return (
            <Link
              to={`/student/cbt/results/${attemptId}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-900"
            >
              <Trophy className="size-3.5" aria-hidden />
              View result
            </Link>
          );
        }
        return (
          <span className="text-xs text-ink-400">
            {exam.status === "Upcoming"
              ? `Opens ${fmtDateTime(exam.startAt)}`
              : exam.status === "Completed"
                ? "Completed"
                : "Closed"}
          </span>
        );
      },
    },
  ];

  const available = exams.filter(
    (exam) => exam.status === "Available" || exam.status === "InProgress",
  ).length;
  const completed = exams.filter(
    (exam) => exam.status === "Completed",
  ).length;
  const passed = exams.filter(
    (exam) => exam.attempt?.status === "Submitted" && exam.attempt.passed,
  ).length;

  return (
    <div>
      <PageHeader
        title="My CBT exams"
        arabic="الاختبارات الإلكترونية"
        description="Sit timed computer-based tests and review your published results."
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard
          label="To take"
          value={available}
          sub="Available or in progress"
        />
        <StatCard label="Completed" value={completed} />
        <StatCard label="Passed" value={passed} />
        <StatCard
          label="Total exams"
          value={exams.length}
          sub="Assigned to your class"
        />
      </StatGrid>

      <Card
        title="Exams"
        description="Timers run on the server, so the remaining time is the same on any device."
      >
        <DataTable
          columns={columns}
          data={exams}
          isLoading={examsQ.isLoading}
          rowKey={(exam) => exam._id}
          emptyTitle="No CBT exams yet"
          emptyDescription="Published CBT exams for your class will appear here."
          mobileCard={(exam) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-900">{exam.title}</p>
                  <p className="text-xs text-ink-500">
                    {cbtSubjectLabel(exam.classSubject)}
                  </p>
                </div>
                <Badge tone={statusTone(exam.status)}>
                  {exam.status}
                </Badge>
              </div>
              <p className="flex items-center gap-1 text-xs text-ink-500">
                <Clock className="size-3" aria-hidden />
                {fmtDateTime(exam.startAt)} — {exam.durationMinutes} min
              </p>
              <div>{columns[4].render(exam)}</div>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
