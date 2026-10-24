import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import {
  Fieldset,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  academicClassLabel,
  apiErrorInfo,
  refId,
  subjectLabel,
  useCreateClassSubjectMutation,
  useDeleteClassSubjectMutation,
  useListAcademicClassesQuery,
  useListAcademicSemestersQuery,
  useListAcademicSessionsQuery,
  useListClassSubjectsQuery,
  useListSubjectsQuery,
  useUpdateClassSubjectMutation,
  type AcademicSemesterRecord,
  type ClassSubjectRecord,
} from "@/features/academic/api";

const PAGE_SIZE = 20;

type SortState = { key: string | null; dir: SortDir };

function semesterLabel(value: AcademicSemesterRecord | string | null | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.name;
}

export function ClassSubjectsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [classFilter, setClassFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSubjectRecord | null>(null);
  const [deleting, setDeleting] = useState<ClassSubjectRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCodeSearch(codeInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [codeInput]);

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useListClassSubjectsQuery({
    page,
    limit: PAGE_SIZE,
    class: classFilter || undefined,
    semester: semesterFilter || undefined,
    subject: subjectFilter || undefined,
    courseCode: codeSearch || undefined,
  });

  const { data: classesData } = useListAcademicClassesQuery({ limit: 200 });
  const { data: semestersData } = useListAcademicSemestersQuery({ limit: 200 });
  const { data: subjectsData } = useListSubjectsQuery({ limit: 200 });

  const classes = classesData?.data ?? [];
  const semesters = semestersData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  const [deleteClassSubject, { isLoading: removing }] =
    useDeleteClassSubjectMutation();

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteClassSubject(deleting._id).unwrap();
        setNotice(
          `Course ${deleting.courseCode ?? ""} (${subjectLabel(deleting.subject)}) deleted.`,
        );
        setDeleting(null);
      } catch (err) {
        setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const columns: Column<ClassSubjectRecord>[] = useMemo(
    () => [
      {
        key: "courseCode",
        header: "Course code",
        sortValue: (r) => r.courseCode ?? "",
        render: (r) => (
          <span className="font-mono text-xs font-medium text-ink-800">
            {r.courseCode || "—"}
          </span>
        ),
      },
      {
        key: "subject",
        header: "Subject",
        sortValue: (r) => subjectLabel(r.subject),
        render: (r) => (
          <span className="font-medium text-ink-900">{subjectLabel(r.subject)}</span>
        ),
      },
      {
        key: "class",
        header: "Class",
        sortValue: (r) => academicClassLabel(r.academicClass),
        render: (r) => academicClassLabel(r.academicClass),
      },
      {
        key: "semester",
        header: "Semester",
        sortValue: (r) => semesterLabel(r.academicSemester),
        render: (r) => semesterLabel(r.academicSemester),
      },
      {
        key: "description",
        header: "Description",
        render: (r) => (
          <span className="block max-w-xs truncate text-ink-600">
            {r.description || "—"}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Status",
        align: "center",
        render: (r) =>
          r.isActive ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <Badge tone="neutral">Inactive</Badge>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (r) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const mobileCard = (r: ClassSubjectRecord) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-medium text-ink-900">
            {r.courseCode || "—"}
          </p>
          <p className="text-sm font-medium text-ink-900">
            {subjectLabel(r.subject)}
          </p>
        </div>
        {r.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Class</dt>
        <dd className="text-ink-800">{academicClassLabel(r.academicClass)}</dd>
        <dt className="text-ink-500">Semester</dt>
        <dd className="text-ink-800">{semesterLabel(r.academicSemester)}</dd>
      </dl>
      {r.description && <p className="text-xs text-ink-600">{r.description}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
          Delete
        </Button>
      </div>
    </div>
  );

  const hasFilters = Boolean(
    classFilter || semesterFilter || subjectFilter || codeSearch,
  );

  return (
    <div>
      <PageHeader
        title="Class subjects"
        arabic="مواد الصفوف"
        description="Assign subjects to classes per semester. Course codes are shared across class arms in the same level."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            New class subject
          </Button>
        }
      />

      {isError && (
        <Alert
          tone="error"
          title="Could not load class subjects"
          className="mb-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {actionError && (
        <Alert
          tone="error"
          className="mb-4"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-end">
          <div className="w-full lg:w-44">
            <SelectField
              label="Class"
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {academicClassLabel(c)}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-full lg:w-44">
            <SelectField
              label="Semester"
              value={semesterFilter}
              onChange={(e) => {
                setSemesterFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All semesters</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                  {typeof s.academicSession === "object" && s.academicSession
                    ? ` (${s.academicSession.name})`
                    : ""}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-full lg:w-44">
            <SelectField
              label="Subject"
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-full lg:max-w-xs">
            <InputField
              label="Course code"
              placeholder="Search by course code…"
              className="font-mono"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:mb-1"
            onClick={() => {
              setClassFilter("");
              setSemesterFilter("");
              setSubjectFilter("");
              setCodeInput("");
              setCodeSearch("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data}
          isLoading={isLoading}
          emptyTitle={isError ? "Could not load class subjects" : "No class subjects found"}
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : hasFilters
                ? "No assignments match your filters."
                : "Assign a subject to a class and semester to get started."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(r) => r._id}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter pagination={data?.pagination} onPageChange={setPage} />
      </Card>

      {createOpen && (
        <ClassSubjectDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            setNotice(message);
          }}
        />
      )}
      {editing && (
        <ClassSubjectDialog
          key={editing._id}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={
          deleting
            ? `Delete course "${deleting.courseCode ?? subjectLabel(deleting.subject)}"?`
            : "Delete class subject?"
        }
        description="This permanently removes the class subject."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

type ClassSubjectForm = {
  academicClass: string;
  subject: string;
  academicSession: string;
  academicSemester: string;
  courseCode: string;
  description: string;
  isActive: boolean;
};

function ClassSubjectDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: ClassSubjectRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createClassSubject, { isLoading: creating }] =
    useCreateClassSubjectMutation();
  const [updateClassSubject, { isLoading: updating }] =
    useUpdateClassSubjectMutation();
  const busy = creating || updating;

  const { data: classesData } = useListAcademicClassesQuery({ limit: 200 });
  const { data: subjectsData } = useListSubjectsQuery({ limit: 200 });
  const { data: sessionsData } = useListAcademicSessionsQuery({ limit: 200 });
  const { data: allSemestersData } = useListAcademicSemestersQuery({
    limit: 200,
  });

  const classes = classesData?.data ?? [];
  const subjects = subjectsData?.data ?? [];
  const sessions = sessionsData?.data ?? [];
  const allSemesters = allSemestersData?.data ?? [];

  const [form, setForm] = useState<ClassSubjectForm>(
    item
      ? {
          academicClass: refId(item.academicClass),
          subject: refId(item.subject),
          academicSession:
            item.academicSemester &&
            typeof item.academicSemester === "object"
              ? refId(item.academicSemester.academicSession)
              : "",
          academicSemester: refId(item.academicSemester),
          courseCode: item.courseCode ?? "",
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : {
          academicClass: "",
          subject: "",
          academicSession: "",
          academicSemester: "",
          courseCode: "",
          description: "",
          isActive: true,
        },
  );

  const semesters = allSemesters.filter(
    (s) =>
      !form.academicSession ||
      refId(s.academicSession) === form.academicSession,
  );

  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<ClassSubjectForm>) =>
    setForm((f) => ({ ...f, ...patch }));
  const valid = form.academicClass && form.subject && form.academicSemester;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        academicClass: form.academicClass,
        subject: form.subject,
        academicSemester: form.academicSemester,
        courseCode: form.courseCode.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateClassSubject({ id: item._id, ...body }).unwrap();
          onSaved("Class subject updated.");
        } else {
          await createClassSubject(body).unwrap();
          onSaved("Class subject created.");
        }
      } catch (err) {
        const info = apiErrorInfo(err);
        setFields(info.fieldErrors);
        setError(info.message);
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={item ? "Edit class subject" : "New class subject"}
      description="Assign a subject to a class for one semester. A subject cannot be assigned twice to the same class and semester."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create class subject"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert tone="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Class"
            required
            value={form.academicClass}
            onChange={(e) => set({ academicClass: e.target.value })}
            error={fields.academicClass}
          >
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {academicClassLabel(c)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => set({ subject: e.target.value })}
            error={fields.subject}
          >
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Session"
            required
            value={form.academicSession}
            onChange={(e) =>
              set({ academicSession: e.target.value, academicSemester: "" })
            }
          >
            <option value="">Select session…</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            required
            value={form.academicSemester}
            onChange={(e) => set({ academicSemester: e.target.value })}
            error={fields.academicSemester}
          >
            <option value="">Select semester…</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </div>
        <InputField
          label="Course code"
          className="font-mono"
          value={form.courseCode}
          onChange={(e) => set({ courseCode: e.target.value })}
          placeholder="e.g. JSS-ARL-001"
          error={fields.courseCode}
          hint="Leave blank to let the server generate one. Codes are shared across class arms in the same level."
        />
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description…"
        />
        <Fieldset legend="Status">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set({ isActive: e.target.checked })}
              className="mt-0.5 size-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500"
            />
            <span>
              Active
              <span className="block text-xs text-ink-500">
                Inactive assignments are hidden from assessments and results.
              </span>
            </span>
          </label>
        </Fieldset>
      </div>
    </Dialog>
  );
}
