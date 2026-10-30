import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";

import {
  cbtErrorMessage,
  useGetStudentCbtAttemptQuery,
  useSaveCbtAnswersMutation,
  useSubmitCbtAttemptMutation,
} from "@/features/cbt/api";

const AUTOSAVE_MS = 15000;

function fmtClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function CbtAttemptPage() {
  const { attemptId = "" } = useParams();
  const navigate = useNavigate();
  const attemptQ = useGetStudentCbtAttemptQuery(attemptId, {
    skip: !attemptId,
  });
  const payload = attemptQ.data?.data;
  const questions = useMemo(
    () => payload?.questions ?? [],
    [payload?.questions],
  );

  const [saveAnswers, saveState] = useSaveCbtAnswersMutation();
  const [submit, submitState] = useSubmitCbtAttemptMutation();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const answersRef = useRef<Record<string, string>>({});
  const dirtyRef = useRef(false);
  const submittingRef = useRef(false);
  const offsetRef = useRef(0);
  const expiresAtRef = useRef<number>(0);

  useEffect(() => {
    if (!payload) return;
    const initial: Record<string, string> = {};
    payload.questions.forEach((question) => {
      if (question.selectedAnswer) {
        initial[question._id] = question.selectedAnswer;
      }
    });
    setAnswers(initial);
    answersRef.current = initial;
    const serverTime = new Date(payload.serverTime).getTime();
    offsetRef.current = Number.isNaN(serverTime)
      ? 0
      : serverTime - Date.now();
    const expires = new Date(payload.attempt.expiresAt).getTime();
    expiresAtRef.current = Number.isNaN(expires) ? 0 : expires;
  }, [payload]);

  const flush = useCallback(async () => {
    if (!attemptId || !dirtyRef.current) return;
    const entries = Object.entries(answersRef.current);
    try {
      await saveAnswers({
        attemptId,
        answers: entries.map(([question, selectedAnswer]) => ({
          question,
          selectedAnswer,
        })),
      }).unwrap();
      dirtyRef.current = false;
    } catch (err) {
      setError(cbtErrorMessage(err));
    }
  }, [attemptId, saveAnswers]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    try {
      if (dirtyRef.current) {
        const entries = Object.entries(answersRef.current);
        await saveAnswers({
          attemptId,
          answers: entries.map(([question, selectedAnswer]) => ({
            question,
            selectedAnswer,
          })),
        }).unwrap();
        dirtyRef.current = false;
      }
      await submit(attemptId).unwrap();
      navigate(`/student/cbt/results/${attemptId}`, { replace: true });
    } catch (err) {
      submittingRef.current = false;
      setError(cbtErrorMessage(err));
    }
  }, [attemptId, navigate, saveAnswers, submit]);

  useEffect(() => {
    if (!payload || payload.attempt.status !== "InProgress") return;
    const tick = () => {
      const now = Date.now() + offsetRef.current;
      const secondsLeft = (expiresAtRef.current - now) / 1000;
      setRemaining(secondsLeft);
      if (secondsLeft <= 0 && !submittingRef.current) {
        void handleSubmit();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [payload, handleSubmit]);

  useEffect(() => {
    if (!payload || payload.attempt.status !== "InProgress") return;
    const autosave = window.setInterval(() => {
      void flush();
    }, AUTOSAVE_MS);
    return () => window.clearInterval(autosave);
  }, [payload, flush]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const current = questions[index];

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      answersRef.current = next;
      return next;
    });
    dirtyRef.current = true;
    setNotice("");
  };

  if (attemptQ.isLoading) {
    return <PageLoader />;
  }

  if (!payload) {
    return (
      <div>
        <PageHeader title="CBT attempt" />
        <Alert tone="error">
          This attempt could not be loaded. It may have expired or been
          submitted already.
        </Alert>
        <Link
          to="/student/cbt"
          className="mt-4 inline-flex rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-800 hover:border-primary-300 hover:bg-primary-50"
        >
          Back to CBT exams
        </Link>
      </div>
    );
  }

  if (payload.attempt.status !== "InProgress") {
    return (
      <div>
        <PageHeader title={payload.exam.title} />
        <Alert tone="info" className="mb-4">
          This attempt has already been submitted.
        </Alert>
        <Link
          to={`/student/cbt/results/${attemptId}`}
          className="inline-flex rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          View result
        </Link>
      </div>
    );
  }

  const answeredCount = questions.filter(
    (question) => answers[question._id],
  ).length;
  const urgent = remaining <= 300;

  return (
    <div>
      <PageHeader
        title={payload.exam.title}
        description={`Attempt ${payload.attempt.attemptNumber} · ${questions.length} questions · ${payload.exam.totalMarks} marks`}
        breadcrumb={
          <Link to="/student/cbt" className="hover:text-primary-700">
            <ArrowLeft className="mr-1 inline size-3" aria-hidden />
            My CBT exams
          </Link>
        }
        actions={
          <div
            className={
              urgent
                ? "flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-800 ring-1 ring-red-200"
                : "flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-2 text-ink-800 ring-1 ring-ink-200"
            }
            role="timer"
            aria-live={urgent ? "assertive" : "off"}
          >
            <span className="text-xs font-medium uppercase tracking-wide">
              Time left
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {fmtClock(remaining)}
            </span>
          </div>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}
      {notice && (
        <Alert tone="success" className="mb-4">
          {notice}
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Questions ({answeredCount}/{questions.length})
          </p>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((question, questionIndex) => {
              const answered = Boolean(answers[question._id]);
              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => setIndex(questionIndex)}
                  aria-label={`Question ${questionIndex + 1}${
                    answered ? " answered" : ""
                  }`}
                  aria-current={index === questionIndex}
                  className={[
                    "flex h-9 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                    index === questionIndex
                      ? "border-primary-700 bg-primary-700 text-white"
                      : answered
                        ? "border-primary-200 bg-primary-50 text-primary-800"
                        : "border-ink-200 bg-white text-ink-600 hover:border-primary-300",
                  ].join(" ")}
                >
                  {questionIndex + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            {saveState.isLoading
              ? "Saving answers…"
              : "Answers save automatically."}
          </p>
          <Button
            className="mt-4 w-full"
            loading={submitState.isLoading}
            onClick={() => setConfirmOpen(true)}
          >
            Submit exam
          </Button>
        </Card>

        <Card>
          {current ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge tone="info">
                  Question {index + 1} of {questions.length}
                </Badge>
                <span className="text-xs text-ink-500">
                  {current.marks} mark{current.marks === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mb-4 whitespace-pre-line text-base font-medium text-ink-900">
                {current.questionText}
              </p>
              <div className="space-y-2">
                {current.options.map((option) => {
                  const selected =
                    answers[current._id] === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        selectAnswer(current._id, option.key)
                      }
                      aria-pressed={selected}
                      className={[
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        selected
                          ? "border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-600"
                          : "border-ink-200 bg-white text-ink-800 hover:border-primary-300 hover:bg-forest-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                          selected
                            ? "border-primary-700 bg-primary-700 text-white"
                            : "border-ink-300 text-ink-600",
                        ].join(" ")}
                      >
                        {selected ? (
                          <Check className="size-3" aria-hidden />
                        ) : (
                          option.key
                        )}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => setIndex((prev) => prev - 1)}
                  icon={<ArrowLeft className="size-3.5" aria-hidden />}
                >
                  Previous
                </Button>
                {index < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setIndex((prev) => prev + 1)}
                    iconRight={
                      <ArrowRight className="size-3.5" aria-hidden />
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Review & submit
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-500">
              This exam has no questions.
            </p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit exam?"
        description={`You have answered ${answeredCount} of ${questions.length} questions. You cannot change answers after submitting.`}
        confirmLabel="Submit now"
        loading={submitState.isLoading}
        onConfirm={handleSubmit}
      />

      {urgent && remaining > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-pop">
            <AlertTriangle className="size-4" aria-hidden />
            Less than 5 minutes remaining — submit before time runs out.
          </div>
        </div>
      )}
    </div>
  );
}
