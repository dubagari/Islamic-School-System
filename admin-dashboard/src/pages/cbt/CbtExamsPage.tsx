import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, PencilLine, Plus, Send, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  useCreateCbtExamMutation,
  useDeleteCbtExamMutation,
  useListCbtExamsQuery,
  usePublishCbtExamMutation,
  usePublishCbtResultsMutation,
  useUpdateCbtExamMutation,
  type CbtExam,
  type CbtExamPayload,
  type CbtResultVisibility,
} from "@/features/cbt/api";
import { getApiErrorMessage } from "@/features/staff/api";
import { useGetAcademicSemestersQuery } from "@/features/students/api";
import {
  useListClassSubjectsQuery,
  type ClassSubjectRef,
} from "@/features/academics-records/api";

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

function classSubjectLabel(
  subject:
    | CbtExam["classSubject"]
    | ClassSubjectRef
    | string
    | undefined,
) {
  if (!subject || typeof subject === "string") return "—";
  const name =
    typeof subject.subject === "object" && subject.subject
      ? subject.subject.name ?? subject.subject.prefix ?? "Subject"
      : "Subject";
  const className =
    typeof subject.academicClass === "object" && subject.academicClass
      ? subject.academicClass.name
      : "";
  return className ? `${name} — ${className}` : name;
}

const emptyForm = {
  title: "",
  description: "",
  instructions: "",
  classSubject: "",
  startAt: "",
  endAt: "",
  durationMinutes: "30",
  passMark: "50",
  maxAttempts: "1",
  resultVisibility: "AfterPublish" as CbtResultVisibility,
  shuffleQuestions: true,
  shuffleOptions: true,
  allowReview: false,
};

export function CbtExamsPage() {
  const [semesterId, setSemesterId] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CbtExam | null>(null);
  const [toDelete, setToDelete] = useState<CbtExam | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const semestersQ = useGetAcademicSemestersQuery();
  const semesters = semestersQ.data?.data ?? [];

  useEffect(() => {
    if (semesters.length === 0) return;
    setSemesterId((prev) =>
      prev && semesters.some((semester) => semester._id === prev)
        ? prev
        : semesters.find((semester) => semester.isCurrent)?._id ??
          semesters[0]._id,
    );
  }, [semesters]);

  const classSubjectsQ = useListClassSubjectsQuery(
    { academicSemester: semesterId || undefined, isActive: true },
    { skip: !semesterId },
  );
  const classSubjects = classSubjectsQ.data?.data ?? [];

  const examsQ = useListCbtExamsQuery(
    {
      academicSemester: semesterId || undefined,
      classSubject: classSubjectId || undefined,
      search: search || undefined,
      page: 1,
      limit: 200,
    },
    { skip: !semesterId },
  );
  const exams = examsQ.data?.data ?? [];

  const [createExam, createState] = useCreateCbtExamMutation();
  const [updateExam, updateState] = useUpdateCbtExamMutation();
  const [deleteExam, deleteState] = useDeleteCbtExamMutation();
  const [publishExam] = usePublishCbtExamMutation();
  const [publishResults] = usePublishCbtResultsMutation();

  const saving = createState.isLoading || updateState.isLoading;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      classSubject: classSubjectId || classSubjects[0]?._id || "",
    });
    setDialogOpen(true);
  };

  const openEdit = (exam: CbtExam) => {
    const linkedClassSubject =
      typeof exam.classSubject === "object"
        ? exam.classSubject._id
        : exam.classSubject;

    setEditing(exam);
    setForm({
      title: exam.title,
      description: exam.description ?? "",
      instructions: exam.instructions ?? "",
      classSubject: linkedClassSubject,
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
    setDialogOpen(true);
  };

  const submit = async () => {
    setBanner(null);

    if (
      !form.title.trim() ||
      !form.classSubject ||
      !form.startAt ||
      !form.endAt
    ) {
      setBanner({
        tone: "error",
        message: "Title, class subject, start and end times are required.",
      });
      return;
    }

    const payload: CbtExamPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructions: form.instructions.trim(),
      classSubject: form.classSubject,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      passMark: Number(form.passMark),
      maxAttempts: Number(form.maxAttempts),
      resultVisibility: form.resultVisibility,
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      allowReview: form.allowReview,
    };

    try {
      if (editing) {
        await updateExam({ id: editing._id, body: payload }).unwrap();
        setBanner({
          tone: "success",
          message: "CBT exam updated.",
        });
      } else {
        await createExam(payload).unwrap();
        setBanner({
          tone: "success",
          message: "CBT exam created. Add questions before publishing.",
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

  const togglePublish = async (exam: CbtExam) => {
    setBanner(null);
    try {
      await publishExam({
        id: exam._id,
        isPublished: !exam.isPublished,
      }).unwrap();
      setBanner({
        tone: "success",
        message: exam.isPublished
          ? "Exam unpublished."
          : "Exam published to students.",
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getApiErrorMessage(error),
      });
    }
  };

  const toggleResults = async (exam: CbtExam) => {
    setBanner(null);
    try {
      await publishResults({
        id: exam._id,
        isPublished: !exam.resultsPublished,
      }).unwrap();
      setBanner({
        tone: "success",
        message: exam.resultsPublished
          ? "Results hidden from students."
          : "Results published to students.",
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: getApiErrorMessage(error),
      });
    }
  };

  const columns: Column<CbtExam>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Exam",
        sortValue: (exam) => exam.title,
        render: (exam) => (
          <div className="flex flex-col">
            <Link
              to={`/cbt/exams/${exam._id}`}
              className="font-medium text-ink-900 hover:text-primary-700"
            >
              {exam.title}
            </Link>
            <span className="text-xs text-ink-500">
              {classSubjectLabel(exam.classSubject)}
            </span>
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
        key: "duration",
        header: "Duration",
        align: "end",
        sortValue: (exam) => exam.durationMinutes,
        render: (exam) => `${exam.durationMinutes} min`,
      },
      {
        key: "marks",
        header: "Marks",
        align: "end",
        sortValue: (exam) => exam.totalMarks,
        render: (exam) => exam.totalMarks,
      },
      {
        key: "published",
        header: "Exam",
        align: "center",
        render: (exam) =>
          exam.isPublished ? (
            <Badge tone="success">Published</Badge>
          ) : (
            <Badge tone="neutral">Draft</Badge>
          ),
      },
      {
        key: "results",
        header: "Results",
        align: "center",
        render: (exam) =>
          exam.resultsPublished ? (
            <Badge tone="success">Visible</Badge>
          ) : (
            <Badge tone="warning">Hidden</Badge>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (exam) => (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Link
              to={`/cbt/exams/${exam._id}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-forest-100"
            >
              <Eye className="size-3.5" aria-hidden />
              Open
            </Link>
            <Button
              size="sm"
              variant="ghost"
              icon={<PencilLine className="size-3.5" aria-hidden />}
              onClick={() => openEdit(exam)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Send className="size-3.5" aria-hidden />}
              onClick={() => togglePublish(exam)}
            >
              {exam.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleResults(exam)}
            >
              {exam.resultsPublished ? "Hide results" : "Publish results"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              onClick={() => setToDelete(exam)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="CBT Exams"
        arabic="الاختبارات"
        description="Create timed computer-based exams and publish results."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={openCreate}
            disabled={!semesterId}
          >
            New exam
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
            label="Semester"
            value={semesterId}
            onChange={(event) => {
              setSemesterId(event.target.value);
              setClassSubjectId("");
            }}
          >
            <option value="">Select semester…</option>
            {semesters.map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semester.name}
                {semester.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Class subject"
            value={classSubjectId}
            onChange={(event) => setClassSubjectId(event.target.value)}
          >
            <option value="">All class subjects</option>
            {classSubjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {classSubjectLabel(subject)}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title…"
          />
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={exams}
          isLoading={examsQ.isLoading}
          rowKey={(exam) => exam._id}
          emptyTitle="No CBT exams"
          emptyDescription="Create an exam, add questions from the bank, then publish it."
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit CBT exam" : "New CBT exam"}
        description="Questions and marks are managed after the exam is created."
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
              {editing ? "Save changes" : "Create exam"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InputField
            label="Title"
            required
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="sm:col-span-2"
          />
          <SelectField
            label="Class subject"
            required
            value={form.classSubject}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                classSubject: event.target.value,
              }))
            }
            disabled={Boolean(editing)}
          >
            <option value="">Select class subject…</option>
            {classSubjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {classSubjectLabel(subject)}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Duration (minutes)"
            type="number"
            min={1}
            max={480}
            value={form.durationMinutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                durationMinutes: event.target.value,
              }))
            }
          />
          <InputField
            label="Starts at"
            type="datetime-local"
            value={form.startAt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startAt: event.target.value }))
            }
          />
          <InputField
            label="Ends at"
            type="datetime-local"
            value={form.endAt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endAt: event.target.value }))
            }
          />
          <InputField
            label="Pass mark (%)"
            type="number"
            min={0}
            max={100}
            value={form.passMark}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, passMark: event.target.value }))
            }
          />
          <InputField
            label="Attempts allowed"
            type="number"
            min={1}
            max={5}
            value={form.maxAttempts}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                maxAttempts: event.target.value,
              }))
            }
          />
          <SelectField
            label="Result visibility"
            value={form.resultVisibility}
            onChange={(event) =>
              setForm((prev) => ({
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
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            className="sm:col-span-2"
          />
          <TextareaField
            label="Instructions"
            value={form.instructions}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                instructions: event.target.value,
              }))
            }
            className="sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.shuffleQuestions}
              onChange={(event) =>
                setForm((prev) => ({
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
              checked={form.shuffleOptions}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  shuffleOptions: event.target.checked,
                }))
              }
            />
            Shuffle options
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.allowReview}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  allowReview: event.target.checked,
                }))
              }
            />
            Allow students to review answers after results are visible
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Delete CBT exam?"
        description="This is only possible when no attempts have been made. Questions in the bank are not deleted."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteState.isLoading}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await deleteExam(toDelete._id).unwrap();
            setBanner({ tone: "success", message: "CBT exam deleted." });
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
