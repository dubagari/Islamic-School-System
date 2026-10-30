import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  useGetCbtAttemptResultQuery,
  type CbtResultPayload,
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

export function CbtResultPage({
  backTo = "/student/cbt",
  backLabel = "My CBT exams",
}: {
  backTo?: string;
  backLabel?: string;
}) {
  const { attemptId = "" } = useParams();
  const resultQ = useGetCbtAttemptResultQuery(attemptId, {
    skip: !attemptId,
  });
  const payload = resultQ.data?.data;

  if (resultQ.isLoading) {
    return <PageLoader />;
  }

  if (!payload) {
    return (
      <div>
        <PageHeader title="CBT result" />
        <Alert tone="error">
          This result could not be loaded. It may not have been published
          yet.
        </Alert>
        <Link
          to={backTo}
          className="mt-4 inline-flex rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-800 hover:border-primary-300 hover:bg-primary-50"
        >
          Back
        </Link>
      </div>
    );
  }

  const { exam, attempt, resultVisible, canReview, breakdown } = payload;

  return (
    <div>
      <PageHeader
        title={exam.title}
        description={`Attempt ${attempt.attemptNumber} · submitted ${fmtDateTime(attempt.submittedAt)}`}
        breadcrumb={
          <Link to={backTo} className="hover:text-primary-700">
            <ArrowLeft className="mr-1 inline size-3" aria-hidden />
            {backLabel}
          </Link>
        }
        actions={
          <Badge
            tone={
              attempt.status === "Voided"
                ? "neutral"
                : resultVisible
                  ? attempt.passed
                    ? "success"
                    : "danger"
                  : "warning"
            }
          >
            {attempt.status === "Voided"
              ? "Voided"
              : resultVisible
                ? attempt.passed
                  ? "Passed"
                  : "Failed"
                : "Result pending release"}
          </Badge>
        }
      />

      {!resultVisible ? (
        <Alert tone="warning">
          Your attempt was submitted successfully. Your score will appear
          here once your teacher publishes the results.
        </Alert>
      ) : (
        <>
          <StatGrid className="mb-6">
            <StatCard
              label="Score"
              value={`${attempt.score ?? 0}/${attempt.totalMarks ?? exam.totalMarks}`}
              sub={`${attempt.percentage ?? 0}%`}
            />
            <StatCard
              label="Pass mark"
              value={`${exam.passMark}%`}
              sub={attempt.passed ? "Passed" : "Not passed"}
            />
            <StatCard
              label="Started"
              value={fmtDateTime(attempt.startedAt)}
            />
            <StatCard
              label="Submitted"
              value={fmtDateTime(attempt.submittedAt)}
              sub={
                attempt.autoSubmitted
                  ? "Auto-submitted at time limit"
                  : undefined
              }
            />
          </StatGrid>

          {attempt.linkedScoreStatus === "SkippedManualScore" && (
            <Alert tone="info" className="mb-4">
              A manually entered score already exists for the linked
              assessment, so your CBT score was not written over it.
            </Alert>
          )}

          <Card
            title="Answer review"
            description={
              canReview
                ? "Correct answers and explanations are shown after submission."
                : "Detailed review is disabled for this exam."
            }
          >
            {canReview && breakdown && breakdown.length > 0 ? (
              <ol className="space-y-3">
                {breakdown.map((entry, index) => (
                  <li
                    key={entry.question}
                    className="rounded-lg border border-ink-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink-900">
                        {index + 1}. {entry.questionText}
                      </p>
                      <Badge tone={entry.isCorrect ? "success" : "danger"}>
                        {entry.marksAwarded}/{entry.marks}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-ink-600">
                      <p className="flex items-center gap-1">
                        {entry.isCorrect ? (
                          <CheckCircle2
                            className="size-3.5 text-primary-700"
                            aria-hidden
                          />
                        ) : (
                          <XCircle
                            className="size-3.5 text-red-600"
                            aria-hidden
                          />
                        )}
                        Your answer:{" "}
                        <span className="font-medium">
                          {answerText(entry, entry.selectedAnswer)}
                        </span>
                      </p>
                      {!entry.isCorrect && (
                        <p>
                          Correct answer:{" "}
                          <span className="font-medium">
                            {answerText(entry, entry.correctAnswer)}
                          </span>
                        </p>
                      )}
                      {entry.explanation && (
                        <p className="text-ink-500">
                          {entry.explanation}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-500">
                {canReview
                  ? "No detailed breakdown is available for this attempt."
                  : "Only your overall score is available."}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function answerText(
  entry: NonNullable<CbtResultPayload["breakdown"]>[number],
  value?: string,
) {
  if (!value) return "Not answered";
  if (entry.type === "TrueFalse") {
    return value.toLowerCase() === "true" ? "True" : "False";
  }
  const option = entry.options?.find((item) => item.key === value);
  return option ? `${option.key} — ${option.text}` : value;
}
