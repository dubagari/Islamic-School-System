import { useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { InputField, SelectField, TextareaField } from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  useCreateCbtQuestionMutation,
  useDeleteCbtQuestionMutation,
  useListCbtQuestionsQuery,
  useUpdateCbtQuestionMutation,
  type CbtDifficulty,
  type CbtQuestion,
  type CbtQuestionPayload,
  type CbtQuestionType,
} from "@/features/cbt/api";
import { useListSubjectsQuery } from "@/features/academic/api";
import { getApiErrorMessage } from "@/features/staff/api";

const difficultyOptions: CbtDifficulty[] = ["Easy", "Medium", "Hard"];
const optionKeys = ["A", "B", "C", "D", "E", "F"];

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

const emptyForm = (subject = ""): QuestionForm => ({
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

export function QuestionBankPage() {
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<CbtQuestionType | "">("");
  const [difficulty, setDifficulty] = useState<CbtDifficulty | "">("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CbtQuestion | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm());
  const [toDelete, setToDelete] = useState<CbtQuestion | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const subjectsQ = useListSubjectsQuery({ page: 1, limit: 200 });
  const subjects = subjectsQ.data?.data ?? [];

  const questionsQ = useListCbtQuestionsQuery({
    subject: subjectId || undefined,
    type: type || undefined,
    difficulty: difficulty || undefined,
    search: search || undefined,
    page: 1,
    limit: 200,
  });
  const questions = questionsQ.data?.data ?? [];

  const [createQuestion, createState] = useCreateCbtQuestionMutation();
  const [updateQuestion, updateState] = useUpdateCbtQuestionMutation();
  const [deleteQuestion, deleteState] = useDeleteCbtQuestionMutation();

  const saving = createState.isLoading || updateState.isLoading;

  const subjectName = (question: CbtQuestion) => {
    if (typeof question.subject === "object" && question.subject) {
      return (
        question.subject.name ?? question.subject.prefix ?? "Subject"
      );
    }
    return (
      subjects.find((subject) => subject._id === question.subject)?.name ??
      "Subject"
    );
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(subjectId || subjects[0]?._id || ""));
    setDialogOpen(true);
  };

  const openEdit = (question: CbtQuestion) => {
    setEditing(question);
    setForm({
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
    setDialogOpen(true);
  };

  const fullMarks = useMemo(() => {
    const marks = Number(form.defaultMarks);
    return Number.isFinite(marks) && marks > 0 ? marks : 1;
  }, [form.defaultMarks]);

  const updateOption = (index: number, text: string) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    }));
  };

  const addOption = () => {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev;
      const key = optionKeys[prev.options.length];
      return {
        ...prev,
        options: [...prev.options, { key, text: "" }],
      };
    });
  };

  const removeOption = (index: number) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev;
      const options = prev.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({
          ...option,
          key: optionKeys[optionIndex],
        }));
      return {
        ...prev,
        options,
        correctAnswer: options.some(
          (option) => option.key === prev.correctAnswer,
        )
          ? prev.correctAnswer
          : options[0].key,
      };
    });
  };

  const submit = async () => {
    setBanner(null);

    if (!form.subject || !form.questionText.trim()) {
      setBanner({
        tone: "error",
        message: "Subject and question text are required.",
      });
      return;
    }

    if (form.type === "MultipleChoice") {
      const cleaned = form.options.filter((option) =>
        option.text.trim(),
      );
      if (cleaned.length < 2) {
        setBanner({
          tone: "error",
          message: "Provide at least two options.",
        });
        return;
      }
    }

    const payload: CbtQuestionPayload = {
      subject: form.subject,
      questionText: form.questionText.trim(),
      type: form.type,
      options:
        form.type === "MultipleChoice"
          ? form.options
              .filter((option) => option.text.trim())
              .map((option) => ({
                key: option.key,
                text: option.text.trim(),
              }))
          : undefined,
      correctAnswer: form.correctAnswer,
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      defaultMarks: fullMarks,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateQuestion({
          id: editing._id,
          body: payload,
        }).unwrap();
        setBanner({
          tone: "success",
          message: "Question updated.",
        });
      } else {
        await createQuestion(payload).unwrap();
        setBanner({
          tone: "success",
          message: "Question added to the bank.",
        });
      }
      setDialogOpen(false);
    } catch (error) {
      setBanner({
        tone: "error",
        message: getApiErrorMessage(error),
      });
    }
  };

  const columns: Column<CbtQuestion>[] = [
    {
      key: "question",
      header: "Question",
      sortValue: (question) => question.questionText,
      render: (question) => (
        <div className="max-w-xl">
          <p className="font-medium text-ink-900">
            {question.questionText}
          </p>
          <p className="text-xs text-ink-500">
            {subjectName(question)}
          </p>
        </div>
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
      sortValue: (question) => question.defaultMarks,
      render: (question) => question.defaultMarks,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (question) =>
        question.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        ),
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
            onClick={() => openEdit(question)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            icon={<Trash2 className="size-3.5" aria-hidden />}
            onClick={() => setToDelete(question)}
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
        title="CBT Question Bank"
        arabic="بنك الأسئلة"
        description="Reusable multiple-choice and true/false questions for CBT exams."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={openCreate}
            disabled={subjects.length === 0}
          >
            New question
          </Button>
        }
      />

      {banner && (
        <Alert tone={banner.tone} className="mb-4">
          {banner.message}
        </Alert>
      )}

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <SelectField
            label="Subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as CbtQuestionType | "")
            }
          >
            <option value="">All types</option>
            <option value="MultipleChoice">Multiple choice</option>
            <option value="TrueFalse">True / False</option>
          </SelectField>
          <SelectField
            label="Difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as CbtDifficulty | "")
            }
          >
            <option value="">All levels</option>
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions…"
          />
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={questions}
          isLoading={questionsQ.isLoading}
          rowKey={(question) => question._id}
          emptyTitle="No questions yet"
          emptyDescription="Add reusable questions, then attach them to an exam."
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit question" : "New question"}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? "Save changes" : "Add question"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <SelectField
            label="Subject"
            required
            value={form.subject}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                subject: event.target.value,
              }))
            }
          >
            <option value="">Select subject…</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </SelectField>

          <TextareaField
            label="Question text"
            required
            value={form.questionText}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                questionText: event.target.value,
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Type"
              value={form.type}
              onChange={(event) => {
                const nextType = event.target.value as CbtQuestionType;
                setForm((prev) => ({
                  ...prev,
                  type: nextType,
                  correctAnswer: nextType === "TrueFalse" ? "true" : "A",
                }));
              }}
              disabled={Boolean(editing)}
            >
              <option value="MultipleChoice">Multiple choice</option>
              <option value="TrueFalse">True / False</option>
            </SelectField>
            <SelectField
              label="Difficulty"
              value={form.difficulty}
              onChange={(event) =>
                setForm((prev) => ({
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
              value={form.defaultMarks}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  defaultMarks: event.target.value,
                }))
              }
            />
          </div>

          {form.type === "MultipleChoice" ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink-700">Options</p>
              {form.options.map((option, index) => (
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
                      updateOption(index, event.target.value)
                    }
                    placeholder={`Option ${option.key}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700"
                    onClick={() => removeOption(index)}
                    disabled={form.options.length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addOption}
                disabled={form.options.length >= 6}
              >
                Add option
              </Button>
            </div>
          ) : null}

          <SelectField
            label="Correct answer"
            value={form.correctAnswer}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                correctAnswer: event.target.value,
              }))
            }
          >
            {form.type === "TrueFalse" ? (
              <>
                <option value="true">True</option>
                <option value="false">False</option>
              </>
            ) : (
              form.options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.key}
                  {option.text ? ` — ${option.text}` : ""}
                </option>
              ))
            )}
          </SelectField>

          <TextareaField
            label="Explanation (optional)"
            value={form.explanation}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                explanation: event.target.value,
              }))
            }
          />

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: event.target.checked,
                }))
              }
            />
            Active (available when building exams)
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete question?"
        description="Questions used by an exam cannot be deleted; deactivate them instead."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteState.isLoading}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteQuestion(toDelete._id).unwrap();
            setBanner({
              tone: "success",
              message: "Question deleted.",
            });
            setToDelete(null);
          } catch (error) {
            setBanner({
              tone: "error",
              message: getApiErrorMessage(error),
            });
          }
        }}
      />
    </div>
  );
}
