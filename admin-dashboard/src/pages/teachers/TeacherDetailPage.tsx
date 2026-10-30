import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, GraduationCap, IdCard, Mail, MapPin, Phone, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Fieldset, InputField, SelectField } from "@/components/ui/Fields";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";
import { PageLoader } from "@/components/ui/PageLoader";

import {
  getApiErrorMessage,
  getApiFieldErrors,
  useDeactivateTeacherMutation,
  useGetTeacherQuery,
  useListTeacherAssignmentsByTeacherQuery,
  useTeacherAttendanceSummaryQuery,
  useUpdateTeacherMutation,
} from "@/features/staff/api";
import type {
  Teacher,
  TeacherAssignment,
  TeacherEmploymentType,
  TeacherStatus,
} from "@/features/staff/api";

const STATUS_OPTIONS: TeacherStatus[] = [
  "Active",
  "Suspended",
  "Retired",
  "Resigned",
  "Terminated",
];

const EMPLOYMENT_TYPE_OPTIONS: TeacherEmploymentType[] = [
  "Full Time",
  "Contract",
  "Part-Time",
  "Temporary",
  "Volunteer",
];

type EditFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: "Male" | "Female" | "";
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  qualification: string;
  specialization: string;
  employmentDate: string;
  employmentType: TeacherEmploymentType;
  status: TeacherStatus;
  statusReason: string;
};

function toEditState(t: Teacher): EditFormState {
  return {
    firstName: t.firstName ?? "",
    middleName: t.middleName ?? "",
    lastName: t.lastName ?? "",
    gender: t.gender ?? "",
    dateOfBirth: t.dateOfBirth ? t.dateOfBirth.slice(0, 10) : "",
    email: t.email ?? "",
    phone: t.phone ?? "",
    address: t.address ?? "",
    qualification: t.qualification ?? "",
    specialization: t.specialization ?? "",
    employmentDate: t.employmentDate ? t.employmentDate.slice(0, 10) : "",
    employmentType: t.employmentType ?? "Full Time",
    status: t.status ?? "Active",
    statusReason: t.statusReason ?? "",
  };
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function fmtDateOnly(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function userIdOf(t: Teacher): string | null {
  if (!t.user || typeof t.user === "string") return t.user ?? null;
  return t.user._id;
}

export function TeacherDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useGetTeacherQuery(id, { skip: !id });
  const teacher = data?.data;

  const teacherUserId = teacher ? userIdOf(teacher) : null;

  const { data: assignmentsData } = useListTeacherAssignmentsByTeacherQuery(
    teacherUserId ?? "",
    { skip: !teacherUserId },
  );

  const { data: summaryData } = useTeacherAttendanceSummaryQuery(
    { teacher: id },
    { skip: !id },
  );

  const summaryRow = summaryData?.data?.find((row) => row.teacherId === id);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !teacher) {
    return (
      <>
        <PageHeader title="Teacher" description="Teacher details could not be loaded." />
        <Card>
          <Alert tone="error" title="Could not load teacher">
            <span>{error ? getApiErrorMessage(error, "Teacher not found.") : "Teacher not found."} </span>
            <button
              type="button"
              className="font-medium text-red-800 underline underline-offset-2"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </Alert>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            to="/teachers"
            className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Teachers
          </Link>
        }
        title={teacher.fullName}
        description="Teacher profile, assignments and employment status."
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit teacher
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setDeactivateOpen(true)}
            >
              Deactivate
            </Button>
          </>
        }
      />

      {successMessage && (
        <div className="mb-4">
          <Alert tone="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Header card */}
      <Card className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink-900">{teacher.fullName}</h2>
              <StatusBadge status={teacher.status} />
              {teacher.isActive ? (
                <Badge tone="success">Profile active</Badge>
              ) : (
                <Badge tone="danger">Profile inactive</Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-ink-500">{teacher.teacherNumber}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:shrink-0">
            <DetailRow label="Employment type" value={teacher.employmentType} />
            <DetailRow label="Employed since" value={fmtDateOnly(teacher.employmentDate)} />
            <DetailRow label="Qualification" value={teacher.qualification || "—"} />
            <DetailRow label="Specialization" value={teacher.specialization || "—"} />
          </dl>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="Contact information">
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailLine icon={<IdCard className="size-4" />} label="Teacher number" value={teacher.teacherNumber} mono />
            <DetailLine icon={<Mail className="size-4" />} label="Email" value={teacher.email || "—"} />
            <DetailLine icon={<Phone className="size-4" />} label="Phone" value={teacher.phone || "—"} />
            <DetailLine icon={<MapPin className="size-4" />} label="Address" value={teacher.address || "—"} />
            <DetailLine icon={<CalendarDays className="size-4" />} label="Date of birth" value={fmtDateOnly(teacher.dateOfBirth)} />
            <DetailLine icon={<GraduationCap className="size-4" />} label="Gender" value={teacher.gender} />
          </dl>
        </Card>

        <Card title="Account">
          <dl className="divide-y divide-ink-100 text-sm">
            <DetailLine
              label="Username"
              value={teacher.user && typeof teacher.user !== "string" ? teacher.user.username : "—"}
              mono
            />
            <DetailLine
              label="Account status"
              value={
                teacher.user && typeof teacher.user !== "string" ? (
                  <Badge tone={teacher.user.isActive ? "success" : "danger"}>
                    {teacher.user.isActive ? "Active" : "Inactive"}
                  </Badge>
                ) : "—"
              }
            />
            <DetailLine
              label="Must change password"
              value={
                teacher.user && typeof teacher.user !== "string" ? (
                  <Badge tone={teacher.user.mustChangePassword ? "warning" : "success"}>
                    {teacher.user.mustChangePassword ? "Yes" : "No"}
                  </Badge>
                ) : "—"
              }
            />
            <DetailLine
              label="Last login"
              value={
                teacher.user && typeof teacher.user !== "string" && teacher.user.lastLogin
                  ? fmtDate(teacher.user.lastLogin)
                  : "—"
              }
            />
            {teacher.statusReason && (
              <DetailLine label="Status reason" value={teacher.statusReason} />
            )}
          </dl>
        </Card>
      </div>

      {/* Academic assignments */}
      <Card title="Academic assignments" className="mb-4" padded={false}>
        <AssignmentsTable assignments={assignmentsData?.data} />
      </Card>

      {/* Attendance summary */}
      <Card title="Attendance summary" description="All recorded teacher attendance for this teacher.">
        {summaryRow ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryStat label="Present" value={summaryRow.present} tone="success" />
            <SummaryStat label="Absent" value={summaryRow.absent} tone="danger" />
            <SummaryStat label="Late" value={summaryRow.late} tone="warning" />
            <SummaryStat label="Excused" value={summaryRow.excused} tone="info" />
            <SummaryStat label="Leave" value={summaryRow.leave} tone="info" />
            <SummaryStat label="Total days" value={summaryRow.total} tone="neutral" />
            <SummaryStat
              label="Rate"
              value={`${summaryRow.attendanceRate.toLocaleString()}%`}
              tone="gold"
            />
          </div>
        ) : (
          <EmptyState title="No attendance yet" description="No teacher attendance has been recorded for this teacher." />
        )}
      </Card>

      <UpdateTeacherDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        teacher={teacher}
        onSaveStatus={setSuccessMessage}
      />

      <DeactivateTeacherDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        teacher={teacher}
        onDone={() => {
          setSuccessMessage("Teacher deactivated.");
          void navigate("/teachers");
        }}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value ?? "—"}</dd>
    </div>
  );
}

function DetailLine({
  icon,
  label,
  value,
  mono,
}: {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="flex items-center gap-2 text-xs font-medium text-ink-500">
        {icon}
        {label}
      </dt>
      <dd className={`min-w-0 truncate text-[13px] font-medium text-ink-900 ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "success" | "danger" | "warning" | "info" | "neutral" | "gold";
}) {
  return (
    <div className="rounded-lg border border-ink-100 bg-forest-50/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5">
        <Badge tone={tone}>{typeof value === "number" ? value.toLocaleString() : value}</Badge>
      </p>
    </div>
  );
}

function AssignmentsTable({ assignments }: { assignments?: TeacherAssignment[] }) {
  const columns: Column<TeacherAssignment>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (a) => {
        if (typeof a.classSubject === "string") return "—";
        const cs = a.classSubject;
        if (!cs.subject || typeof cs.subject === "string") return "—";
        return cs.subject.name;
      },
    },
    {
      key: "class",
      header: "Class",
      render: (a) => {
        if (typeof a.classSubject === "string") return "—";
        const cs = a.classSubject;
        if (!cs.academicClass || typeof cs.academicClass === "string") return "—";
        return cs.academicClass.name;
      },
    },
    {
      key: "semester",
      header: "Semester",
      render: (a) => {
        if (typeof a.classSubject === "string") return "—";
        const cs = a.classSubject;
        if (!cs.academicSemester || typeof cs.academicSemester === "string") return "—";
        return cs.academicSemester.name;
      },
    },
    {
      key: "assignedDate",
      header: "Assigned",
      className: "whitespace-nowrap",
      render: (a) => fmtDateOnly(a.assignedDate),
    },
    {
      key: "isActive",
      header: "Active",
      render: (a) => (
        <Badge tone={a.isActive ? "success" : "danger"}>{a.isActive ? "Active" : "Inactive"}</Badge>
      ),
    },
  ];

  return (
    <div className="p-5 pt-5">
      <SectionTitle>Assigned class subjects</SectionTitle>
      {assignments && assignments.length > 0 ? (
        <div className="overflow-x-auto">
          <DataTable<TeacherAssignment>
            columns={columns}
            data={assignments}
            rowKey={(a) => a._id}
            className="-mx-5"
          />
        </div>
      ) : (
        <EmptyState title="No assignments" description="This teacher has no active class-subject assignments." />
      )}
    </div>
  );
}

type UpdateTeacherDialogProps = {
  open: boolean;
  onClose: () => void;
  teacher: Teacher;
  onSaveStatus: (message: string) => void;
};

function UpdateTeacherDialog({ open, onClose, teacher, onSaveStatus }: UpdateTeacherDialogProps) {
  const [form, setForm] = useState<EditFormState>(toEditState(teacher));

  useEffect(() => {
    if (open) {
      setForm(toEditState(teacher));
    }
  }, [open, teacher]);

  const [updateTeacher, { isLoading: saving, error: updateError }] = useUpdateTeacherMutation();

  const fieldErrors = updateError ? getApiFieldErrors(updateError) : {};
  const submitError = updateError ? getApiErrorMessage(updateError, "Failed to update teacher.") : null;

  const setField =
    (key: keyof EditFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }) as EditFormState);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await updateTeacher({
        id: teacher._id,
        body: {
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || undefined,
          lastName: form.lastName.trim(),
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          email: form.email.trim() || "",
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          qualification: form.qualification.trim() || undefined,
          specialization: form.specialization.trim() || undefined,
          employmentDate: form.employmentDate || undefined,
          employmentType: form.employmentType,
          status: form.status,
          statusReason: form.statusReason.trim() || undefined,
        },
      }).unwrap();
      onSaveStatus("Teacher updated successfully.");
      onClose();
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit teacher"
      description={`Updating ${teacher.fullName} (${teacher.teacherNumber})`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="update-teacher-form" type="submit" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      {updateError && (
        <div className="mb-4">
          <Alert tone="error" title="Could not update teacher">
            {submitError}
          </Alert>
        </div>
      )}
      <form
        id="update-teacher-form"
        className="space-y-4"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <Fieldset legend="Personal">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="First name"
              required
              error={fieldErrors.firstName}
              value={form.firstName}
              onChange={setField("firstName")}
            />
            <InputField
              label="Middle name"
              error={fieldErrors.middleName}
              value={form.middleName}
              onChange={setField("middleName")}
            />
            <InputField
              label="Last name"
              required
              error={fieldErrors.lastName}
              value={form.lastName}
              onChange={setField("lastName")}
            />
            <SelectField
              label="Gender"
              error={fieldErrors.gender}
              value={form.gender}
              onChange={setField("gender")}
            >
              <option value="">Select gender…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </SelectField>
            <InputField
              label="Date of birth"
              type="date"
              error={fieldErrors.dateOfBirth}
              value={form.dateOfBirth}
              onChange={setField("dateOfBirth")}
            />
          </div>
        </Fieldset>
        <Fieldset legend="Contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Email"
              type="email"
              error={fieldErrors.email}
              value={form.email}
              onChange={setField("email")}
            />
            <InputField
              label="Phone"
              error={fieldErrors.phone}
              value={form.phone}
              onChange={setField("phone")}
            />
            <InputField
              label="Address"
              error={fieldErrors.address}
              value={form.address}
              onChange={setField("address")}
            />
          </div>
        </Fieldset>
        <Fieldset legend="Employment">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Employment type"
              error={fieldErrors.employmentType}
              value={form.employmentType}
              onChange={setField("employmentType")}
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Employment date"
              type="date"
              error={fieldErrors.employmentDate}
              value={form.employmentDate}
              onChange={setField("employmentDate")}
            />
            <InputField
              label="Qualification"
              error={fieldErrors.qualification}
              value={form.qualification}
              onChange={setField("qualification")}
            />
            <InputField
              label="Specialization"
              error={fieldErrors.specialization}
              value={form.specialization}
              onChange={setField("specialization")}
            />
            <SelectField
              label="Status"
              error={fieldErrors.status}
              value={form.status}
              onChange={setField("status")}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Status reason"
              error={fieldErrors.statusReason}
              value={form.statusReason}
              onChange={setField("statusReason")}
            />
          </div>
        </Fieldset>
      </form>
    </Dialog>
  );
}

type DeactivateTeacherDialogProps = {
  open: boolean;
  onClose: () => void;
  teacher: Teacher;
  onDone: () => void;
};

function DeactivateTeacherDialog({ open, onClose, teacher, onDone }: DeactivateTeacherDialogProps) {
  const [deactivateTeacher, { isLoading: deactivating, error: deactivateError }] =
    useDeactivateTeacherMutation();

  const errorMessage = deactivateError
    ? getApiErrorMessage(deactivateError, "Failed to deactivate teacher.")
    : null;

  const handleConfirm = async () => {
    try {
      await deactivateTeacher(teacher._id).unwrap();
      onDone();
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <div className="space-y-3">
      <ConfirmDialog
        open={open}
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        title="Deactivate teacher"
        description={`${teacher.fullName} (${teacher.teacherNumber}) will be deactivated. The linked teacher account will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        tone="danger"
        loading={deactivating}
      />
      {errorMessage && (
        <Alert tone="error" title="Could not deactivate teacher" onDismiss={onClose}>
          {errorMessage}
        </Alert>
      )}
    </div>
  );
}
