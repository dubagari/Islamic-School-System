import { useMemo, useState } from "react";
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
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  apiErrorInfo,
  classSubjectLabel,
  isPopulated as isRecordPopulated,
  refId,
  subjectLabel,
  useCreateTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
  useListClassSubjectsQuery,
  useListTeacherAssignmentsQuery,
  useListTeacherUsersQuery,
  useUpdateTeacherAssignmentMutation,
  type ClassSubjectRecord,
  type TeacherAssignmentRecord,
} from "@/features/academic/api";

const PAGE_SIZE = 20;

type SortState = { key: string | null; dir: SortDir };

const todayISO = () => new Date().toISOString().slice(0, 10);

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function teacherLabel(value: TeacherAssignmentRecord["teacher"]): string {
  return isRecordPopulated(value) ? (value.fullName || value.username) : "—";
}

function teacherUsername(value: TeacherAssignmentRecord["teacher"]): string {
  return isRecordPopulated(value) ? value.username : "";
}

export function TeacherAssignmentsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [teacherFilter, setTeacherFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherAssignmentRecord | null>(null);
  const [deleting, setDeleting] = useState<TeacherAssignmentRecord | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
  } = useListTeacherAssignmentsQuery({
    page,
    limit: PAGE_SIZE,
    teacher: teacherFilter || undefined,
    isActive:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
  });

  const { data: teachersData } = useListTeacherUsersQuery();
  const teachers = teachersData?.data ?? [];

  const [updateAssignment] = useUpdateTeacherAssignmentMutation();
  const [deleteAssignment, { isLoading: removing }] =
    useDeleteTeacherAssignmentMutation();

  const toggleActive = (assignment: TeacherAssignmentRecord) => {
    void (async () => {
      try {
        await updateAssignment({
          id: assignment._id,
          isActive: !assignment.isActive,
        }).unwrap();
        setNotice(
          `Assignment for ${teacherLabel(assignment.teacher)} ${assignment.isActive ? "deactivated" : "activated"}.`,
        );
      } catch (err) {
        setActionError(apiErrorInfo(err).message);
      }
    })();
  };

  const confirmDelete = () => {
    if (!deleting) return;
    void (async () => {
      try {
        await deleteAssignment(deleting._id).unwrap();
        setNotice(
          `Assignment for ${teacherLabel(deleting.teacher)} deleted.`,
        );
        setDeleting(null);
      } catch (err) {
        setActionError(apiErrorInfo(err).message);
        setDeleting(null);
      }
    })();
  };

  const columns: Column<TeacherAssignmentRecord>[] = useMemo(
    () => [
      {
        key: "teacher",
        header: "Teacher",
        sortValue: (r) => teacherLabel(r.teacher),
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">{teacherLabel(r.teacher)}</span>
            {teacherUsername(r.teacher) && (
              <span className="font-mono text-xs text-ink-500">
                @{teacherUsername(r.teacher)}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "classSubject",
        header: "Class subject",
        sortValue: (r) => classSubjectLabel(r.classSubject),
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-medium text-ink-900">
              {isRecordPopulated(r.classSubject)
                ? subjectLabel(r.classSubject.subject)
                : "—"}
            </span>
            <span className="max-w-xs truncate text-xs text-ink-500">
              {classSubjectLabelText(r.classSubject)}
            </span>
          </div>
        ),
      },
      {
        key: "assignedDate",
        header: "Assigned",
        sortValue: (r) => r.assignedDate,
        render: (r) => fmtDate(r.assignedDate),
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
            <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
              {r.isActive ? "Deactivate" : "Activate"}
            </Button>
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

  const mobileCard = (r: TeacherAssignmentRecord) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{teacherLabel(r.teacher)}</p>
          {teacherUsername(r.teacher) && (
            <p className="font-mono text-xs text-ink-500">
              @{teacherUsername(r.teacher)}
            </p>
          )}
        </div>
        {r.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Inactive</Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Class subject</dt>
        <dd className="text-ink-800">{classSubjectLabelText(r.classSubject)}</dd>
        <dt className="text-ink-500">Assigned</dt>
        <dd className="text-ink-800">{fmtDate(r.assignedDate)}</dd>
      </dl>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toggleActive(r)}
        >
          {r.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
          Delete
        </Button>
      </div>
    </div>
  );

  const hasFilters = Boolean(teacherFilter || statusFilter);

  return (
    <div>
      <PageHeader
        title="Teacher assignments"
        arabic="تكليفات المعلمين"
        description="Assign teacher user accounts to class subjects for the semester."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            New assignment
          </Button>
        }
      />

      {isError && (
        <Alert
          tone="error"
          title="Could not load teacher assignments"
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
          <div className="w-full lg:w-56">
            <SelectField
              label="Teacher"
              value={teacherFilter}
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} (@{t.username})
                </option>
              ))}
            </SelectField>
          </div>
          <div className="w-full lg:w-44">
            <SelectField
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | "active" | "inactive");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </SelectField>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:mb-1"
            onClick={() => {
              setTeacherFilter("");
              setStatusFilter("");
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
          emptyTitle={
            isError ? "Could not load assignments" : "No teacher assignments found"
          }
          emptyDescription={
            isError
              ? "Check the error above and try again."
              : hasFilters
                ? "No assignments match your filters."
                : "Assign a teacher to a class subject to get started."
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
        <AssignmentDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(message) => {
            setCreateOpen(false);
            setNotice(message);
          }}
        />
      )}
      {editing && (
        <AssignmentDialog
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
            ? `Delete assignment for "${teacherLabel(deleting.teacher)}"?`
            : "Delete assignment?"
        }
        description="This permanently removes the teacher assignment."
        tone="danger"
        confirmLabel="Delete"
        loading={removing}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function classSubjectLabelText(
  value: TeacherAssignmentRecord["classSubject"],
): string {
  if (!isRecordPopulated(value)) return "—";
  const semester = isRecordPopulated(value.academicSemester)
    ? value.academicSemester.name
    : "—";
  const klass = isRecordPopulated(value.academicClass)
    ? value.academicClass.name
    : "—";
  return `${klass} · ${semester}`;
}

type AssignmentForm = {
  teacher: string;
  classSubject: string;
  assignedDate: string;
  isActive: boolean;
};

function AssignmentDialog({
  item,
  onClose,
  onSaved,
}: {
  item?: TeacherAssignmentRecord;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [createAssignment, { isLoading: creating }] =
    useCreateTeacherAssignmentMutation();
  const [updateAssignment, { isLoading: updating }] =
    useUpdateTeacherAssignmentMutation();
  const busy = creating || updating;

  const { data: teachersData } = useListTeacherUsersQuery();
  const { data: classSubjectsData } = useListClassSubjectsQuery({ limit: 200 });

  const teachers = (teachersData?.data ?? []).filter((t) => t.isActive);
  const classSubjects = classSubjectsData?.data ?? [];

  const [form, setForm] = useState<AssignmentForm>(
    item
      ? {
          teacher: refId(item.teacher),
          classSubject: refId(item.classSubject),
          assignedDate: item.assignedDate?.slice(0, 10) ?? "",
          isActive: item.isActive,
        }
      : {
          teacher: "",
          classSubject: "",
          assignedDate: todayISO(),
          isActive: true,
        },
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<AssignmentForm>) =>
    setForm((f) => ({ ...f, ...patch }));
  const valid = form.teacher && form.classSubject;

  const submit = () => {
    void (async () => {
      setFields({});
      setError(null);
      const body = {
        teacher: form.teacher,
        classSubject: form.classSubject,
        assignedDate: form.assignedDate || undefined,
        isActive: form.isActive,
      };
      try {
        if (item) {
          await updateAssignment({ id: item._id, ...body }).unwrap();
          onSaved("Assignment updated.");
        } else {
          await createAssignment(body).unwrap();
          onSaved("Assignment created.");
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
      title={item ? "Edit assignment" : "New assignment"}
      description="Assign a teacher user account to a class subject. The class-subject's own semester defines the active term."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={!valid}>
            {item ? "Save changes" : "Create assignment"}
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
        <SelectField
          label="Teacher"
          required
          value={form.teacher}
          onChange={(e) => set({ teacher: e.target.value })}
          error={fields.teacher}
          hint="Only active teacher user accounts are listed."
        >
          <option value="">Select teacher…</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.fullName} (@{t.username})
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Class subject"
          required
          value={form.classSubject}
          onChange={(e) => set({ classSubject: e.target.value })}
          error={fields.classSubject}
        >
          <option value="">Select class subject…</option>
          {classSubjects.map((cs: ClassSubjectRecord) => (
            <option key={cs._id} value={cs._id}>
              {classSubjectLabel(cs)}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Assigned date"
          type="date"
          value={form.assignedDate}
          onChange={(e) => set({ assignedDate: e.target.value })}
          error={fields.assignedDate}
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
                Inactive assignments do not grant teaching access.
              </span>
            </span>
          </label>
        </Fieldset>
      </div>
    </Dialog>
  );
}
