import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PencilLine, Plus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import {
  FormField,
  Select,
  SelectField,
} from "@/components/ui/Fields";
import { DataTable, type Column, type SortDir } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  classLabel,
  isPopulated,
  refName,
  studentFullName,
  useCreateEnrollmentMutation,
  useDeactivateEnrollmentMutation,
  useGetAcademicClassesQuery,
  useGetAcademicSessionsQuery,
  useGetEnrollmentsQuery,
  useGetStudentsQuery,
  useUpdateEnrollmentMutation,
  type EnrollmentStatus,
  type Student,
  type StudentEnrollment,
} from "@/features/students/api";

const PAGE_SIZE = 20;

const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  "Active",
  "Completed",
  "Transferred",
  "Withdrawn",
];

const STATUS_FILTER_OPTIONS: { label: string; value: EnrollmentStatus | "" }[] = [
  { label: "All statuses", value: "" },
  ...ENROLLMENT_STATUSES.map((s) => ({ label: s, value: s })),
];

export function EnrollmentsPage() {
  const [page, setPage] = useState(1);
  const [sessionFilter, setSessionFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "">("");
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({
    key: null,
    dir: "asc",
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StudentEnrollment | null>(null);
  const [deactivating, setDeactivating] = useState<StudentEnrollment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetEnrollmentsQuery({
    page,
    limit: PAGE_SIZE,
    academicSession: sessionFilter || undefined,
    academicClass: classFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: sessionsData } = useGetAcademicSessionsQuery();
  const { data: classesData } = useGetAcademicClassesQuery();
  const { data: studentsData } = useGetStudentsQuery({ limit: 200 });

  const sessions = sessionsData?.data ?? [];
  const classes = classesData?.data ?? [];
  const students = studentsData?.data ?? [];

  const enrollments = data?.data;
  const pagination = data?.pagination;

  const [createEnrollment, { isLoading: creating }] = useCreateEnrollmentMutation();
  const [updateEnrollment, { isLoading: updating }] = useUpdateEnrollmentMutation();
  const [deactivateEnrollment, { isLoading: deactivatingRow }] =
    useDeactivateEnrollmentMutation();

  const columns: Column<StudentEnrollment>[] = useMemo(
    () => [
      {
        key: "student",
        header: "Student",
        sortValue: (e) =>
          isPopulated(e.student) ? studentFullName(e.student) : "",
        render: (e) => {
          const s = e.student;
          return isPopulated(s) ? (
            <div className="flex flex-col">
              <Link
                to={`/students/${s._id}`}
                onClick={(ev) => ev.stopPropagation()}
                className="font-medium text-primary-700 hover:underline"
              >
                {studentFullName(s)}
              </Link>
              <span className="font-mono text-xs text-ink-500">
                {s.registrationNumber}
              </span>
            </div>
          ) : (
            "—"
          );
        },
      },
      {
        key: "academicSession",
        header: "Session",
        render: (e) => refName(e.academicSession),
      },
      {
        key: "academicClass",
        header: "Class",
        render: (e) => refName(classLabel(e.academicClass)),
      },
      {
        key: "status",
        header: "Status",
        sortValue: (e) => e.status,
        render: (e) => <StatusBadge status={e.status} />,
      },
      {
        key: "enrollmentDate",
        header: "Enrolled",
        sortValue: (e) => e.enrollmentDate,
        render: (e) => fmtDate(e.enrollmentDate),
      },
      {
        key: "isActive",
        header: "Current",
        align: "center",
        render: (e) =>
          e.isActive ? (
            <Badge tone="success">Yes</Badge>
          ) : (
            <Badge tone="neutral">No</Badge>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (e) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<PencilLine className="size-3.5" aria-hidden />}
              onClick={(ev) => {
                ev.stopPropagation();
                setEditing(e);
              }}
            >
              Edit
            </Button>
            {e.isActive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setDeactivating(e);
                }}
              >
                Deactivate
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const mobileCard = (e: StudentEnrollment) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">
          {isPopulated(e.student) ? studentFullName(e.student) : "—"}
        </p>
        <StatusBadge status={e.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-ink-500">Reg #</dt>
        <dd className="font-mono text-ink-800">
          {isPopulated(e.student) ? e.student.registrationNumber : "—"}
        </dd>
        <dt className="text-ink-500">Session</dt>
        <dd className="text-ink-800">{refName(e.academicSession)}</dd>
        <dt className="text-ink-500">Class</dt>
        <dd className="text-ink-800">{refName(classLabel(e.academicClass))}</dd>
        <dt className="text-ink-500">Enrolled</dt>
        <dd className="text-ink-800">{fmtDate(e.enrollmentDate)}</dd>
        <dt className="text-ink-500">Active</dt>
        <dd className="text-ink-800">{e.isActive ? "Yes" : "No"}</dd>
      </dl>
      <div className="mt-1 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
          Edit
        </Button>
        {e.isActive && (
          <Button size="sm" variant="ghost" onClick={() => setDeactivating(e)}>
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );

  const onSortChange = (key: string | null) => {
    setSort((prev) =>
      prev.key === key
        ? key
          ? { key, dir: "desc" }
          : { key: null, dir: "asc" }
        : { key, dir: "asc" },
    );
  };

  const filtersChanged = (apply: () => void) => {
    apply();
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="Student enrollment into academic classes and sessions per academic year."
        actions={
          <Button
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            Enroll student
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load enrollments" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{(error as Error | undefined)?.message ?? "Request failed."}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {notice && (
        <Alert
          tone="success"
          title="Enrollment updated"
          className="mb-4"
          onDismiss={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      <Card padded={false}>
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-3">
          <FormField label="Session">
            {(aria) => (
              <Select
                {...aria}
                value={sessionFilter}
                onChange={(e) =>
                  filtersChanged(() => setSessionFilter(e.target.value))
                }
              >
                <option value="">All sessions</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.isCurrent ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Class">
            {(aria) => (
              <Select
                {...aria}
                value={classFilter}
                onChange={(e) => filtersChanged(() => setClassFilter(e.target.value))}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Status">
            {(aria) => (
              <Select
                {...aria}
                value={statusFilter}
                onChange={(e) =>
                  filtersChanged(() =>
                    setStatusFilter(e.target.value as EnrollmentStatus | ""),
                  )
                }
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>

        <DataTable
          columns={columns}
          data={enrollments}
          isLoading={isLoading}
          emptyTitle="No enrollments found"
          emptyDescription={
            sessionFilter || classFilter || statusFilter
              ? "Try adjusting or clearing the filters."
              : "No students have been enrolled yet."
          }
          emptyAction={
            isError ? (
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            ) : undefined
          }
          rowKey={(e) => e._id}
          sort={sort}
          onSortChange={onSortChange}
          mobileCard={mobileCard}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      <CreateEnrollmentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        students={students}
        sessions={sessions}
        classes={classes}
        creating={creating}
        onCreated={(message) => {
          setCreateOpen(false);
          setNotice(message);
        }}
        onCreate={async (body) => {
          await createEnrollment(body).unwrap();
          return "Student enrolled successfully.";
        }}
      />

      <EditEnrollmentDialog
        key={editing?._id ?? "none"}
        enrollment={editing}
        onClose={() => setEditing(null)}
        classes={classes}
        updating={updating}
        onUpdated={(message) => {
          setEditing(null);
          setNotice(message);
        }}
        onUpdate={async (id, body) => {
          await updateEnrollment({ id, ...body }).unwrap();
          return "Enrollment updated successfully.";
        }}
      />

      <ConfirmDialog
        open={deactivating !== null}
        tone="danger"
        title="Deactivate enrollment"
        confirmLabel="Deactivate"
        loading={deactivatingRow}
        onClose={() => setDeactivating(null)}
        description={
          deactivating
            ? "The enrollment will be marked Withdrawn and deactivated."
            : undefined
        }
        onConfirm={() => {
          void (async () => {
            if (!deactivating) return;
            try {
              await deactivateEnrollment(deactivating._id).unwrap();
              setDeactivating(null);
              setNotice("Enrollment deactivated successfully.");
            } catch {
              // error handled by refetch/list state; dialog stays until closed
              setDeactivating(null);
            }
          })();
        }}
      />
    </div>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

type CreateBody = {
  student: string;
  academicSession: string;
  academicClass: string;
};

function CreateEnrollmentDialog({
  open,
  onClose,
  students,
  sessions,
  classes,
  creating,
  onCreate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  students: Student[];
  sessions: { _id: string; name: string; isCurrent: boolean }[];
  classes: { _id: string; name: string }[];
  creating: boolean;
  onCreate: (body: CreateBody) => Promise<string>;
  onCreated: (message: string) => void;
}) {
  const [student, setStudent] = useState("");
  const [session, setSession] = useState("");
  const [academicClass, setAcademicClass] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const valid = student && session && academicClass;

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        const message = await onCreate({ student, academicSession: session, academicClass });
        setStudent("");
        setSession("");
        setAcademicClass("");
        onCreated(message);
      } catch (err) {
        setFormError((err as Error | undefined)?.message ?? "Enrollment failed.");
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Enroll student"
      description="A student can only have one enrollment per academic session."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating} disabled={!valid}>
            Enroll
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Student"
          required
          value={student}
          onChange={(e) => setStudent(e.target.value)}
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {studentFullName(s)} ({s.registrationNumber})
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Academic session"
          required
          value={session}
          onChange={(e) => setSession(e.target.value)}
        >
          <option value="">Select session…</option>
          {sessions.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
              {s.isCurrent ? " (current)" : ""}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Academic class"
          required
          value={academicClass}
          onChange={(e) => setAcademicClass(e.target.value)}
        >
          <option value="">Select class…</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        {formError && (
          <Alert tone="error" title="Could not enroll student">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

function EditEnrollmentDialog({
  enrollment,
  onClose,
  classes,
  updating,
  onUpdate,
  onUpdated,
}: {
  enrollment: StudentEnrollment | null;
  onClose: () => void;
  classes: { _id: string; name: string }[];
  updating: boolean;
  onUpdate: (
    id: string,
    body: { academicClass?: string; status?: EnrollmentStatus },
  ) => Promise<string>;
  onUpdated: (message: string) => void;
}) {
  const [status, setStatus] = useState<EnrollmentStatus | "">("");
  const [academicClass, setAcademicClass] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (!enrollment) return null;

  const currentStatus = status || enrollment.status;
  const currentClass = academicClass || studentClassId(enrollment);

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        const message = await onUpdate(enrollment._id, {
          status: currentStatus,
          academicClass: currentClass,
        });
        onUpdated(message);
      } catch (err) {
        setFormError((err as Error | undefined)?.message ?? "Update failed.");
      }
    })();
  };

  return (
    <Dialog
      open={enrollment !== null}
      onClose={onClose}
      title="Edit enrollment"
      description="Update the class or status transition for this enrollment."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={submit} loading={updating}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Status"
          required
          value={currentStatus}
          onChange={(e) => setStatus(e.target.value as EnrollmentStatus)}
        >
          {ENROLLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Class"
          required
          value={currentClass}
          onChange={(e) => setAcademicClass(e.target.value)}
        >
          <option value="">Select class…</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </SelectField>

        <Alert tone="info">
          Setting the status to anything other than Active also deactivates the
          enrollment.
        </Alert>

        {formError && (
          <Alert tone="error" title="Could not update enrollment">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}

function studentClassId(enrollment: StudentEnrollment): string {
  return isPopulated(enrollment.academicClass) ? enrollment.academicClass._id : "";
}
