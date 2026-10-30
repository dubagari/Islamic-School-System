import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PencilLine, Plus, Send, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

import { useGetMyAssignmentsQuery } from "@/features/teacher/api";
import {
  cbtErrorMessage,
  cbtSubjectLabel,
  useCreateCbtExamMutation,
  useCreateCbtQuestionMutation,
  useDeleteCbtExamMutation,
  useDeleteCbtQuestionMutation,
  useListCbtExamsQuery,
  useListCbtQuestionsQuery,
  usePublishCbtExamMutation,
  usePublishCbtResultsMutation,
  useUpdateCbtExamMutation,
  useUpdateCbtQuestionMutation,
  type CbtDifficulty,
  type CbtExam,
  type CbtQuestion,
  type CbtQuestionType,
  type CbtResultVisibility,
} from "@/features/cbt/api";

const optionKeys = ["A", "B", "C", "D", "E", "F"];
const difficultyOptions: CbtDifficulty[] = ["Easy", "Medium", "Hard"];
const resultVisibilityOptions: CbtResultVisibility[] = [
  "AfterPublish",
  "Immediate",
  "Hidden",
];

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

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

type ExamForm = {
  title: string;
  classSubject: string;
  description: string;
  instructions: string;
  startAt: string;
  endAt: string;
  durationMinutes: string;
  passMark: string;
  maxAttempts: string;
  resultVisibility: CbtResultVisibility;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
};

const emptyExam = (classSubject = ""): ExamForm => ({
  title: "",
  classSubject,
  description: "",
  instructions: "",
  startAt: "",
  endAt: "",
  durationMinutes: "30",
  passMark: "50",
  maxAttempts: "1",
  resultVisibility: "AfterPublish",
  shuffleQuestions: true,
  shuffleOptions: true,
  allowReview: false,
});

type OptionDraft = { key: string; text: string };

type QuestionForm = {
  subject: string;
  questionText: string;
  type: CbtQuestionType;
  options: OptionDraft[];
  correctAnswer: string;
  explanation: string;
  difficulty: CbtDifficulty;
  defaultMarks: string;
  isActive: boolean;
};

const emptyQuestion = (subject = ""): QuestionForm => ({
  subject,
  questionText: "",
  type: "MultipleChoice",
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctAnswer: "A",
  explanation: "",
  difficulty: "Medium",
  defaultMarks: "1",
  isActive: true,
});

export function TeacherCbtPage() {
  const [tab, setTab] = useState<"exams" | "bank">("exams");
  const assignmentsQ = useGetMyAssignmentsQuery();
  const assignments = assignmentsQ.data?.data ?? [];

  const classSubjects = useMemo(() => {
    const map = new Map<
      string,
      { _id: string; label: string; subjectId: string; subjectName: string }
    >();
    assignments.forEach((assignment) => {
      const classSubject = assignment.classSubject;
      if (!classSubject || typeof classSubject === "string") return;
      const subject =
        typeof classSubject.subject === "object"
          ? classSubject.subject
          : null;
      const academicClass =
        typeof classSubject.academicClass === "object"
          ? classSubject.academicClass
          : null;
      const subjectName =
        subject?.name ?? subject?.code ?? "Subject";
      const label = [subjectName, academicClass?.name]
        .filter(Boolean)
        .join(" — ");
      map.set(classSubject._id, {
        _id: classSubject._id,
        label,
        subjectId: subject?._id ?? "",
        subjectName,
      });
    });
    return [...map.values()];
  }, [assignments]);

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    classSubjects.forEach((subject) => {
      if (subject.subjectId) {
        map.set(subject.subjectId, subject.subjectName);
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [classSubjects]);

  const [examFilter, setExamFilter] = useState("");
  const examsQ = useListCbtExamsQuery({
    classSubject: examFilter || undefined,
    page: 1,
    limit: 200,
  });
  const exams = examsQ.data?.data ?? [];

  const [subjectFilter, setSubjectFilter] = useState("");
  const questionsQ = useListCbtQuestionsQuery({
    subject: subjectFilter || undefined,
    page: 1,
    limit: 200,
  });
  const questions = questionsQ.data?.data ?? [];

  const [examDialog, setExamDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<CbtExam | null>(null);
  const [examForm, setExamForm] = useState<ExamForm>(emptyExam());
  const [toDeleteExam, setToDeleteExam] = useState<CbtExam | null>(null);

  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CbtQuestion | null>(
    null,
  );
  const [questionForm, setQuestionForm] = useState<QuestionForm>(
    emptyQuestion(),
  );
  const [toDeleteQuestion, setToDeleteQuestion] = useState<CbtQuestion | null>(
    null,
  );

  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [createExam, createExamState] = useCreateCbtExamMutation();
  const [updateExam, updateExamState] = useUpdateCbtExamMutation();
  const [deleteExam, deleteExamState] = useDeleteCbtExamMutation();
  const [publishExam] = usePublishCbtExamMutation();
  const [publishResults] = usePublishCbtResultsMutation();

  const [createQuestion, createQuestionState] =
    useCreateCbtQuestionMutation();
  const [updateQuestion, updateQuestionState] =
    useUpdateCbtQuestionMutation();
  const [deleteQuestion, deleteQuestionState] =
    useDeleteCbtQuestionMutation();

  const examSaving = createExamState.isLoading || updateExamState.isLoading;
  const questionSaving =
    createQuestionState.isLoading || updateQuestionState.isLoading;

  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm(emptyExam(classSubjects[0]?._id ?? ""));
    setExamDialog(true);
  };

  const openEditExam = (exam: CbtExam) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title,
      classSubject:
        typeof exam.classSubject === "object"
          ? exam.classSubject._id
          : exam.classSubject ?? "",
      description: exam.description ?? "",
      instructions: exam.instructions ?? "",
      startAt: toLocalInput(exam.startAt),
      endAt: toLocalInput(exam.endAt),
      durationMinutes: String(exam.durationMinutes),
      passMark: String(exam.passMark),
      maxAttempts: String(exam.maxAttempts ?? 1),
      resultVisibility: exam.resultVisibility,
      shuffleQuestions: exam.shuffleQuestions,
      shuffleOptions: exam.shuffleOptions,
      allowReview: exam.allowReview,
    });
    setExamDialog(true);
  };

  const submitExam = async () => {
    setBanner(null);
    if (
      !examForm.title.trim() ||
      !examForm.classSubject ||
      !examForm.startAt ||
      !examForm.endAt
    ) {
      setBanner({
        tone: "error",
        message: "Title, class subject, start and end times are required.",
      });
      return;
    }

    const body = {
      title: examForm.title.trim(),
      classSubject: examForm.classSubject,
      description: examForm.description.trim(),
      instructions: examForm.instructions.trim(),
      startAt: new Date(examForm.startAt).toISOString(),
      endAt: new Date(examForm.endAt).toISOString(),
      durationMinutes: Number(examForm.durationMinutes),
      passMark: Number(examForm.passMark),
      maxAttempts: Number(examForm.maxAttempts),
      resultVisibility: examForm.resultVisibility,
      shuffleQuestions: examForm.shuffleQuestions,
      shuffleOptions: examForm.shuffleOptions,
      allowReview: examForm.allowReview,
    };

    try {
      if (editingExam) {
        await updateExam({ id: editingExam._id, body }).unwrap();
        setBanner({ tone: "success", message: "CBT exam updated." });
      } else {
        await createExam(body).unwrap();
        setBanner({
          tone: "success",
          message: "CBT exam created. Add questions before publishing.",
        });
      }
      setExamDialog(false);
    } catch (error) {
      setBanner({ tone: "error", message: cbtErrorMessage(error) });
    }
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm(emptyQuestion(subjectFilter || subjects[0]?.id || ""));
    setQuestionDialog(true);
  };

  const openEditQuestion = (question: CbtQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      subject:
        typeof question.subject === "string"
          ? question.subject
          : question.subject._id,
      questionText: question.questionText,
      type: question.type,
      options: question.options.map((option) => ({ ...option })),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? "",
      difficulty: question.difficulty,
      defaultMarks: String(question.defaultMarks),
      isActive: question.isActive,
    });
    setQuestionDialog(true);
  };

  const submitQuestion = async () => {
    setBanner(null);
    if (!questionForm.subject || !questionForm.questionText.trim()) {
      setBanner({
        tone: "error",
        message: "Subject and question text are required.",
      });
      return;
    }

    const options = questionForm.options.filter((option) =>
      option.text.trim(),
    );
    if (questionForm.type === "MultipleChoice" && options.length < 2) {
      setBanner({
        tone: "error",
        message: "Provide at least two options.",
      });
      return;
    }

    const body = {
      subject: questionForm.subject,
      questionText: questionForm.questionText.trim(),
      type: questionForm.type,
      options:
        questionForm.type === "MultipleChoice"
          ? options.map((option) => ({
              key: option.key,
              text: option.text.trim(),
            }))
          : undefined,
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation.trim(),
      difficulty: questionForm.difficulty,
      defaultMarks: Number(questionForm.defaultMarks) || 1,
      isActive: questionForm.isActive,
    };

    try {
      if (editingQuestion) {
        await updateQuestion({
          id: editingQuestion._id,
          body,
        }).unwrap();
        setBanner({ tone: "success", message: "Question updated." });
      } else {
        await createQuestion(body).unwrap();
        setBanner({
          tone: "success",
          message: "Question added to the bank.",
        });
      }
      setQuestionDialog(false);
    } catch (error) {
      setBanner({ tone: "error", message: cbtErrorMessage(error) });
    }
  };

  const examColumns: Column<CbtExam>[] = [
    {
      key: "title",
      header: "Exam",
      sortValue: (exam) => exam.title,
      render: (exam) => (
        <div>
          <Link
            to={`/teacher/cbt/${exam._id}`}
            className="font-medium text-ink-900 hover:text-primary-700"
          >
            {exam.title}
          </Link>
          <p className="text-xs text-ink-500">
            {cbtSubjectLabel(exam.classSubject)}
          </p>
        </div>
      ),
    },
    {
      key: "window",
      header: "Window",
      render: (exam) => (
        <div className="text-xs text-ink-600">
          <div>{fmtDateTime(exam.startAt)}</div>
          <div className="text-ink-400">to {fmtDateTime(exam.endAt)}</div>
        </div>
      ),
    },
    {
      key: "marks",
      header: "Marks",
      align: "end",
      render: (exam) => exam.totalMarks,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (exam) => (
        <div className="flex flex-wrap justify-center gap-1">
          <Badge tone={exam.isPublished ? "success" : "neutral"}>
            {exam.isPublished ? "Published" : "Draft"}
          </Badge>
          <Badge tone={exam.resultsPublished ? "success" : "warning"}>
            {exam.resultsPublished ? "Results visible" : "Results hidden"}
          </Badge>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (exam) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditExam(exam)}
            icon={<PencilLine className="size-3.5" aria-hidden />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Send className="size-3.5" aria-hidden />}
            onClick={async () => {
              try {
                await publishExam({
                  id: exam._id,
                  isPublished: !exam.isPublished,
                }).unwrap();
                setBanner({
                  tone: "success",
                  message: exam.isPublished
                    ? "Exam unpublished."
                    : "Exam published.",
                });
              } catch (error) {
                setBanner({
                  tone: "error",
                  message: cbtErrorMessage(error),
                });
              }
            }}
          >
            {exam.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await publishResults({
                  id: exam._id,
                  isPublished: !exam.resultsPublished,
                }).unwrap();
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
          <Button
            size="sm"
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            icon={<Trash2 className="size-3.5" aria-hidden />}
            onClick={() => setToDeleteExam(exam)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const questionColumns: Column<CbtQuestion>[] = [
    {
      key: "question",
      header: "Question",
      render: (question) => (
        <p className="max-w-xl font-medium text-ink-900">
          {question.questionText}
        </p>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (question) => (
        <Badge tone="info">
          {question.type === "MultipleChoice" ? "MCQ" : "True/False"}
        </Badge>
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (question) => (
        <Badge
          tone={
            question.difficulty === "Easy"
              ? "success"
              : question.difficulty === "Hard"
                ? "danger"
                : "warning"
          }
        >
          {question.difficulty}
        </Badge>
      ),
    },
    {
      key: "marks",
      header: "Marks",
      align: "end",
      render: (question) => question.defaultMarks,
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (question) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<PencilLine className="size-3.5" aria-hidden />}
            onClick={() => openEditQuestion(question)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            icon={<Trash2 className="size-3.5" aria-hidden />}
            onClick={() => setToDeleteQuestion(question)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CBT"
        arabic="الاختبارات الإلكترونية"
        description="Author exams and reusable questions for your assigned subjects."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={tab === "exams" ? openCreateExam : openCreateQuestion}
            disabled={
              tab === "exams"
                ? classSubjects.length === 0
                : subjects.length === 0
            }
          >
            {tab === "exams" ? "New exam" : "New question"}
          </Button>
        }
      />

      {banner && (
        <Alert tone={banner.tone} className="mb-4">
          {banner.message}
        </Alert>
      )}

      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={tab === "exams" ? "secondary" : "outline"}
          onClick={() => setTab("exams")}
        >
          Exams
        </Button>
        <Button
          size="sm"
          variant={tab === "bank" ? "secondary" : "outline"}
          onClick={() => setTab("bank")}
        >
          Question bank
        </Button>
      </div>

      {tab === "exams" ? (
        <>
          <Card className="mb-4">
            <SelectField
              label="Class subject"
              value={examFilter}
              onChange={(event) => setExamFilter(event.target.value)}
            >
              <option value="">All my class subjects</option>
              {classSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.label}
                </option>
              ))}
            </SelectField>
          </Card>
          <Card>
            <DataTable
              columns={examColumns}
              data={exams}
              isLoading={examsQ.isLoading}
              rowKey={(exam) => exam._id}
              emptyTitle="No CBT exams"
              emptyDescription="Create an exam for one of your class subjects."
            />
          </Card>
        </>
      ) : (
        <>
          <Card className="mb-4">
            <SelectField
              label="Subject"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="">All my subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </SelectField>
          </Card>
          <Card>
            <DataTable
              columns={questionColumns}
              data={questions}
              isLoading={questionsQ.isLoading}
              rowKey={(question) => question._id}
              emptyTitle="No questions yet"
              emptyDescription="Add questions to the bank for your subjects."
            />
          </Card>
        </>
      )}

      <Dialog
        open={examDialog}
        onClose={() => setExamDialog(false)}
        title={editingExam ? "Edit CBT exam" : "New CBT exam"}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setExamDialog(false)}
              disabled={examSaving}
            >
              Cancel
            </Button>
            <Button onClick={submitExam} loading={examSaving}>
              {editingExam ? "Save changes" : "Create exam"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField
            label="Title"
            required
            className="sm:col-span-2"
            value={examForm.title}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
          />
          <SelectField
            label="Class subject"
            required
            value={examForm.classSubject}
            disabled={Boolean(editingExam)}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                classSubject: event.target.value,
              }))
            }
          >
            <option value="">Select class subject…</option>
            {classSubjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.label}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Duration (minutes)"
            type="number"
            min={1}
            max={480}
            value={examForm.durationMinutes}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                durationMinutes: event.target.value,
              }))
            }
          />
          <InputField
            label="Starts at"
            type="datetime-local"
            value={examForm.startAt}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                startAt: event.target.value,
              }))
            }
          />
          <InputField
            label="Ends at"
            type="datetime-local"
            value={examForm.endAt}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                endAt: event.target.value,
              }))
            }
          />
          <InputField
            label="Pass mark (%)"
            type="number"
            min={0}
            max={100}
            value={examForm.passMark}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                passMark: event.target.value,
              }))
            }
          />
          <InputField
            label="Attempts allowed"
            type="number"
            min={1}
            max={5}
            value={examForm.maxAttempts}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                maxAttempts: event.target.value,
              }))
            }
          />
          <SelectField
            label="Result visibility"
            value={examForm.resultVisibility}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                resultVisibility: event.target
                  .value as CbtResultVisibility,
              }))
            }
          >
            {resultVisibilityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
          <TextareaField
            label="Instructions"
            className="sm:col-span-2"
            value={examForm.instructions}
            onChange={(event) =>
              setExamForm((prev) => ({
                ...prev,
                instructions: event.target.value,
              }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={examForm.shuffleQuestions}
              onChange={(event) =>
                setExamForm((prev) => ({
                  ...prev,
                  shuffleQuestions: event.target.checked,
                }))
              }
            />
            Shuffle questions
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={examForm.shuffleOptions}
              onChange={(event) =>
                setExamForm((prev) => ({
                  ...prev,
                  shuffleOptions: event.target.checked,
                }))
              }
            />
            Shuffle options
          </label>
        </div>
      </Dialog>

      <Dialog
        open={questionDialog}
        onClose={() => setQuestionDialog(false)}
        title={editingQuestion ? "Edit question" : "New question"}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setQuestionDialog(false)}
              disabled={questionSaving}
            >
              Cancel
            </Button>
            <Button onClick={submitQuestion} loading={questionSaving}>
              {editingQuestion ? "Save changes" : "Add question"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <SelectField
            label="Subject"
            required
            value={questionForm.subject}
            onChange={(event) =>
              setQuestionForm((prev) => ({
                ...prev,
                subject: event.target.value,
              }))
            }
          >
            <option value="">Select subject…</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </SelectField>
          <TextareaField
            label="Question text"
            required
            value={questionForm.questionText}
            onChange={(event) =>
              setQuestionForm((prev) => ({
                ...prev,
                questionText: event.target.value,
              }))
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Type"
              value={questionForm.type}
              disabled={Boolean(editingQuestion)}
              onChange={(event) => {
                const type = event.target.value as CbtQuestionType;
                setQuestionForm((prev) => ({
                  ...prev,
                  type,
                  correctAnswer: type === "TrueFalse" ? "true" : "A",
                }));
              }}
            >
              <option value="MultipleChoice">Multiple choice</option>
              <option value="TrueFalse">True / False</option>
            </SelectField>
            <SelectField
              label="Difficulty"
              value={questionForm.difficulty}
              onChange={(event) =>
                setQuestionForm((prev) => ({
                  ...prev,
                  difficulty: event.target.value as CbtDifficulty,
                }))
              }
            >
              {difficultyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Default marks"
              type="number"
              min={0.5}
              step={0.5}
              value={questionForm.defaultMarks}
              onChange={(event) =>
                setQuestionForm((prev) => ({
                  ...prev,
                  defaultMarks: event.target.value,
                }))
              }
            />
          </div>

          {questionForm.type === "MultipleChoice" ? (
            <div className="space-y-2">
              <SectionTitle>Options</SectionTitle>
              {questionForm.options.map((option, index) => (
                <div
                  key={option.key}
                  className="flex items-center gap-2"
                >
                  <span className="w-5 text-xs font-semibold text-ink-500">
                    {option.key}
                  </span>
                  <input
                    className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    value={option.text}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        options: prev.options.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, text: event.target.value }
                              : item,
                        ),
                      }))
                    }
                    placeholder={`Option ${option.key}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700"
                    disabled={questionForm.options.length <= 2}
                    onClick={() =>
                      setQuestionForm((prev) => {
                        if (prev.options.length <= 2) return prev;
                        const options = prev.options
                          .filter((_, itemIndex) => itemIndex !== index)
                          .map((item, itemIndex) => ({
                            ...item,
                            key: optionKeys[itemIndex],
                          }));
                        return {
                          ...prev,
                          options,
                          correctAnswer: options.some(
                            (item) =>
                              item.key === prev.correctAnswer,
                          )
                            ? prev.correctAnswer
                            : options[0].key,
                        };
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                disabled={questionForm.options.length >= 6}
                onClick={() =>
                  setQuestionForm((prev) =>
                    prev.options.length >= 6
                      ? prev
                      : {
                          ...prev,
                          options: [
                            ...prev.options,
                            {
                              key: optionKeys[prev.options.length],
                              text: "",
                            },
                          ],
                        },
                  )
                }
              >
                Add option
              </Button>
            </div>
          ) : null}

          <SelectField
            label="Correct answer"
            value={questionForm.correctAnswer}
            onChange={(event) =>
              setQuestionForm((prev) => ({
                ...prev,
                correctAnswer: event.target.value,
              }))
            }
          >
            {questionForm.type === "TrueFalse" ? (
              <>
                <option value="true">True</option>
                <option value="false">False</option>
              </>
            ) : (
              questionForm.options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.key}
                  {option.text ? ` — ${option.text}` : ""}
                </option>
              ))
            )}
          </SelectField>

          <TextareaField
            label="Explanation (optional)"
            value={questionForm.explanation}
            onChange={(event) =>
              setQuestionForm((prev) => ({
                ...prev,
                explanation: event.target.value,
              }))
            }
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={questionForm.isActive}
              onChange={(event) =>
                setQuestionForm((prev) => ({
                  ...prev,
                  isActive: event.target.checked,
                }))
              }
            />
            Active
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDeleteExam)}
        onClose={() => setToDeleteExam(null)}
        title="Delete CBT exam?"
        description="Only possible before any attempt is made."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteExamState.isLoading}
        onConfirm={async () => {
          if (!toDeleteExam) return;
          try {
            await deleteExam(toDeleteExam._id).unwrap();
            setBanner({ tone: "success", message: "Exam deleted." });
            setToDeleteExam(null);
          } catch (error) {
            setBanner({
              tone: "error",
              message: cbtErrorMessage(error),
            });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(toDeleteQuestion)}
        onClose={() => setToDeleteQuestion(null)}
        title="Delete question?"
        description="Questions used by an exam cannot be deleted; deactivate instead."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteQuestionState.isLoading}
        onConfirm={async () => {
          if (!toDeleteQuestion) return;
          try {
            await deleteQuestion(toDeleteQuestion._id).unwrap();
            setBanner({
              tone: "success",
              message: "Question deleted.",
            });
            setToDeleteQuestion(null);
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
