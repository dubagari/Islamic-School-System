import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatCard, StatGrid } from "@/components/ui/StatCard";

import {
  cbtErrorMessage,
  useAttachCbtQuestionsMutation,
  useGetCbtExamAttemptsQuery,
  useGetCbtExamQuery,
  useGetCbtExamQuestionsQuery,
  useListCbtQuestionsQuery,
  usePublishCbtExamMutation,
  usePublishCbtResultsMutation,
  useRemoveCbtExamQuestionMutation,
  useReorderCbtExamQuestionsMutation,
  useUpdateCbtExamQuestionMutation,
  type CbtAttemptListItem,
  type CbtExamQuestion,
  type CbtQuestion,
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

function questionText(question: CbtQuestion | string) {
  return typeof question === "object" && question
    ? question.questionText
    : "Question";
}

function studentName(student: CbtAttemptListItem["student"]) {
  if (!student || typeof student === "string") return "Student";
  return (
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") || student.registrationNumber || "Student"
  );
}

export function TeacherCbtExamPage() {
  const { id = "" } = useParams();
  const examQ = useGetCbtExamQuery(id, { skip: !id });
  const exam = examQ.data?.data;
  const examQuestionsQ = useGetCbtExamQuestionsQuery(id, { skip: !id });
  const examQuestions = examQuestionsQ.data?.data.questions ?? [];
  const totalMarks = examQuestionsQ.data?.data.totalMarks ?? 0;

  const attemptsQ = useGetCbtExamAttemptsQuery(
    { id, params: { page: 1, limit: 200 } },
    { skip: !id },
  );
  const attempts = attemptsQ.data?.data ?? [];

  const classSubject =
    exam && typeof exam.classSubject === "object"
      ? exam.classSubject
      : null;
  const subjectId =
    classSubject && typeof classSubject.subject === "object"
      ? classSubject.subject._id
      : typeof classSubject?.subject === "string"
        ? classSubject.subject
        : "";

  const bankQ = useListCbtQuestionsQuery(
    { subject: subjectId, isActive: "true", page: 1, limit: 200 },
    { skip: !subjectId },
  );
  const bank = bankQ.data?.data ?? [];

  const [selected, setSelected] = useState<string[]>([]);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [toRemove, setToRemove] = useState<CbtExamQuestion | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [attach, attachState] = useAttachCbtQuestionsMutation();
  const [updateMarks, updateMarksState] =
    useUpdateCbtExamQuestionMutation();
  const [reorder, reorderState] = useReorderCbtExamQuestionsMutation();
  const [removeQuestion, removeState] =
    useRemoveCbtExamQuestionMutation();
  const [publishExam, publishState] = usePublishCbtExamMutation();
  const [publishResults, publishResultsState] =
    usePublishCbtResultsMutation();

  useEffect(() => {
    if (examQuestions.length === 0) return;
    setMarksDraft((prev) => {
      const next = { ...prev };
      examQuestions.forEach((question) => {
        if (next[question._id] === undefined) {
          next[question._id] = String(question.marks);
        }
      });
      return next;
    });
  }, [examQuestions]);

  const attachedIds = useMemo(
    () =>
      new Set(
        examQuestions.map((entry) =>
          typeof entry.question === "object"
            ? entry.question._id
            : entry.question,
        ),
      ),
    [examQuestions],
  );

  const availableQuestions = bank.filter(
    (question) => !attachedIds.has(question._id),
  );

  const busy =
    attachState.isLoading ||
    updateMarksState.isLoading ||
    reorderState.isLoading ||
    removeState.isLoading;

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= examQuestions.length) return;
    const order = examQuestions.map((question) => question._id);
    [order[index], order[target]] = [order[target], order[index]];
    try {
      await reorder({ id, order }).unwrap();
    } catch (error) {
      setBanner({ tone: "error", message: cbtErrorMessage(error) });
    }
  };

  const questionColumns: Column<CbtExamQuestion>[] = [
    {
      key: "order",
      header: "#",
      align: "center",
      render: (entry) => entry.order,
    },
    {
      key: "question",
      header: "Question",
      render: (entry) => (
        <p className="max-w-xl font-medium text-ink-900">
          {questionText(entry.question)}
        </p>
      ),
    },
    {
      key: "marks",
      header: "Marks",
      align: "end",
      render: (entry) => (
        <div className="flex items-center justify-end gap-1">
          <input
            type="number"
            min={0.5}
            step={0.5}
            className="w-20 rounded-md border border-ink-200 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none"
            value={marksDraft[entry._id] ?? String(entry.marks)}
            onChange={(event) =>
              setMarksDraft((prev) => ({
                ...prev,
                [entry._id]: event.target.value,
              }))
            }
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const marks = Number(marksDraft[entry._id]);
              if (!Number.isFinite(marks) || marks <= 0) return;
              try {
                await updateMarks({
                  id,
                  examQuestionId: entry._id,
                  marks,
                }).unwrap();
                setBanner({
                  tone: "success",
                  message: "Marks updated.",
                });
              } catch (error) {
                setBanner({
                  tone: "error",
                  message: cbtErrorMessage(error),
                });
              }
            }}
          >
            Save
          </Button>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (entry) => {
        const index = examQuestions.findIndex(
          (item) => item._id === entry._id,
        );
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowUp className="size-3.5" aria-hidden />}
              onClick={() => moveQuestion(index, -1)}
              disabled={index === 0 || busy}
              aria-label="Move up"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowDown className="size-3.5" aria-hidden />}
              onClick={() => moveQuestion(index, 1)}
              disabled={index === examQuestions.length - 1 || busy}
              aria-label="Move down"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              onClick={() => setToRemove(entry)}
            >
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  const attemptColumns: Column<CbtAttemptListItem>[] = [
    {
      key: "student",
      header: "Student",
      render: (attempt) => (
        <div>
          <p className="font-medium text-ink-900">
            {studentName(attempt.student)}
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
              ? "success"
              : attempt.status === "Voided"
                ? "neutral"
                : "warning"
          }
        >
          {attempt.status}
        </Badge>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "end",
      render: (attempt) =>
        attempt.status === "Submitted"
          ? `${attempt.score ?? 0}/${attempt.totalMarks ?? 0} (${attempt.percentage ?? 0}%)`
          : "—",
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (attempt) => fmtDateTime(attempt.submittedAt),
    },
  ];

  if (examQ.isLoading) {
    return <PageLoader />;
  }

  if (!exam) {
    return (
      <div>
        <PageHeader title="CBT exam" />
        <Alert tone="error">
          This exam could not be loaded. It may have been deleted.
        </Alert>
        <Link
          to="/teacher/cbt"
          className="mt-4 inline-flex rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-800 hover:border-primary-300 hover:bg-primary-50"
        >
          Back to CBT
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={exam.title}
        description="Add questions, set marks, monitor attempts, and publish results."
        breadcrumb={
          <Link to="/teacher/cbt" className="hover:text-primary-700">
            <ArrowLeft className="mr-1 inline size-3" aria-hidden />
            CBT
          </Link>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              loading={publishState.isLoading}
              onClick={async () => {
                try {
                  await publishExam({
                    id,
                    isPublished: !exam.isPublished,
                  }).unwrap();
                } catch (error) {
                  setBanner({
                    tone: "error",
                    message: cbtErrorMessage(error),
                  });
                }
              }}
            >
              {exam.isPublished ? "Unpublish exam" : "Publish exam"}
            </Button>
            <Button
              size="sm"
              icon={<Send className="size-4" aria-hidden />}
              loading={publishResultsState.isLoading}
              onClick={async () => {
                try {
                  await publishResults({
                    id,
                    isPublished: !exam.resultsPublished,
                  }).unwrap();
                  setBanner({
                    tone: "success",
                    message: exam.resultsPublished
                      ? "Results hidden."
                      : "Results published to students.",
                  });
                } catch (error) {
                  setBanner({
                    tone: "error",
                    message: cbtErrorMessage(error),
                  });
                }
              }}
            >
              {exam.resultsPublished ? "Hide results" : "Publish results"}
            </Button>
          </>
        }
      />

      {banner && (
        <Alert tone={banner.tone} className="mb-4">
          {banner.message}
        </Alert>
      )}

      <StatGrid className="mb-6">
        <StatCard
          label="Questions"
          value={examQuestions.length}
          sub={`${totalMarks} total marks`}
        />
        <StatCard label="Attempts" value={attempts.length} />
        <StatCard
          label="Duration"
          value={`${exam.durationMinutes} min`}
          sub={`Pass mark ${exam.passMark}%`}
        />
        <StatCard
          label="Window"
          value={fmtDateTime(exam.startAt)}
          sub={`to ${fmtDateTime(exam.endAt)}`}
        />
      </StatGrid>

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-500">Status</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge tone={exam.isPublished ? "success" : "neutral"}>
                {exam.isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge tone={exam.resultsPublished ? "success" : "warning"}>
                {exam.resultsPublished
                  ? "Results visible"
                  : "Results hidden"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-xs text-ink-500">Settings</p>
            <p className="mt-1 text-sm text-ink-700">
              {exam.shuffleQuestions
                ? "Shuffled questions"
                : "Fixed order"}{" "}
              ·{" "}
              {exam.shuffleOptions
                ? "Shuffled options"
                : "Fixed options"}
            </p>
            <p className="text-xs text-ink-500">
              {exam.maxAttempts} attempt
              {exam.maxAttempts === 1 ? "" : "s"} ·{" "}
              {exam.resultVisibility}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-500">Instructions</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-700">
              {exam.instructions || "No instructions provided."}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card
          title="Exam questions"
          description="Questions are snapshotted per exam, so later bank edits do not change this exam."
        >
          <DataTable
            columns={questionColumns}
            data={examQuestions}
            isLoading={examQuestionsQ.isLoading}
            rowKey={(entry) => entry._id}
            emptyTitle="No questions attached"
            emptyDescription="Select questions from the bank on the right."
          />
        </Card>

        <Card
          title="Add from question bank"
          description={
            subjectId
              ? "Pick active questions from this exam's subject."
              : "The linked class subject does not have a subject."
          }
        >
          {availableQuestions.length === 0 ? (
            <p className="text-sm text-ink-500">
              No more active questions are available for this subject.
            </p>
          ) : (
            <>
              <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
                {availableQuestions.map((question) => (
                  <label
                    key={question._id}
                    className="flex items-start gap-2 rounded-lg border border-ink-100 p-2 text-sm hover:bg-forest-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.includes(question._id)}
                      onChange={(event) =>
                        setSelected((prev) =>
                          event.target.checked
                            ? [...prev, question._id]
                            : prev.filter((id) => id !== question._id),
                        )
                      }
                    />
                    <span>
                      <span className="block text-ink-900">
                        {question.questionText}
                      </span>
                      <span className="text-xs text-ink-500">
                        {question.type === "TrueFalse"
                          ? "True / False"
                          : "Multiple choice"}{" "}
                        · {question.defaultMarks} mark
                        {question.defaultMarks === 1 ? "" : "s"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button
                className="mt-3"
                size="sm"
                icon={<Plus className="size-3.5" aria-hidden />}
                loading={attachState.isLoading}
                disabled={selected.length === 0}
                onClick={async () => {
                  try {
                    await attach({
                      id,
                      questions: selected.map((question) => ({
                        question,
                      })),
                    }).unwrap();
                    setSelected([]);
                    setBanner({
                      tone: "success",
                      message: "Questions added to the exam.",
                    });
                  } catch (error) {
                    setBanner({
                      tone: "error",
                      message: cbtErrorMessage(error),
                    });
                  }
                }}
              >
                Add selected ({selected.length})
              </Button>
            </>
          )}
        </Card>
      </div>

      <Card
        className="mt-6"
        title="Attempts"
        description="Attempts are graded automatically on submission."
      >
        <DataTable
          columns={attemptColumns}
          data={attempts}
          isLoading={attemptsQ.isLoading}
          rowKey={(attempt) => attempt._id}
          emptyTitle="No attempts yet"
          emptyDescription="Students will appear here once they start the exam."
        />
      </Card>

      <ConfirmDialog
        open={Boolean(toRemove)}
        onClose={() => setToRemove(null)}
        title="Remove question from exam?"
        description="The question stays in the bank and is only detached from this exam."
        confirmLabel="Remove"
        tone="danger"
        loading={removeState.isLoading}
        onConfirm={async () => {
          if (!toRemove) return;
          try {
            await removeQuestion({
              id,
              examQuestionId: toRemove._id,
            }).unwrap();
            setBanner({
              tone: "success",
              message: "Question removed from the exam.",
            });
            setToRemove(null);
          } catch (error) {
            setBanner({
              tone: "error",
              message: cbtErrorMessage(error),
            });
          }
        }}
      />
    </div>
  );
}
