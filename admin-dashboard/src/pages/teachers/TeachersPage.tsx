import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, UserPlus } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { Fieldset, InputField, SelectField } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { DataTable, type Column } from "@/components/ui/DataTable";

import {
  getApiErrorMessage,
  getApiFieldErrors,
  useCreateTeacherMutation,
  useListTeachersQuery,
} from "@/features/staff/api";
import type {
  CreateTeacherPayload,
  CreateTeacherResponse,
  Teacher,
  TeacherEmploymentType,
  TeacherStatus,
} from "@/features/staff/api";

const PAGE_SIZE = 20;

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

type CreateFormState = {
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
};

const emptyCreateForm: CreateFormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  address: "",
  qualification: "",
  specialization: "",
  employmentDate: "",
  employmentType: "Full Time",
};

export function TeachersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TeacherStatus | "">("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useListTeachersQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
  });

  const teachers = data?.data ?? [];
  const pagination = data?.pagination;
  const listError = error ? getApiErrorMessage(error, "Failed to load teachers.") : null;

  const columns: Column<Teacher>[] = [
    {
      key: "teacherNumber",
      header: "Teacher #",
      sortValue: (t) => t.teacherNumber,
      className: "whitespace-nowrap",
      render: (t) => <span className="font-mono text-[13px]">{t.teacherNumber}</span>,
    },
    {
      key: "fullName",
      header: "Name",
      sortValue: (t) => t.fullName,
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{t.fullName}</p>
          {t.email ? (
            <p className="truncate text-xs text-ink-500">{t.email}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "whitespace-nowrap",
      render: (t) => t.phone || "—",
    },
    {
      key: "employmentType",
      header: "Employment type",
      sortValue: (t) => t.employmentType,
      render: (t) => <Badge tone="info">{t.employmentType}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => t.status,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (t) => (
        <Link
          to={`/teachers/${t._id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        >
          <Eye className="size-3.5" aria-hidden />
          View
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Teachers"
        description="Create, search and manage teacher profiles and employment status."
        arabic="المعلمون"
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setCreateOpen(true)}>
            Add teacher
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="teacher-search"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Search
            </label>
            <input
              id="teacher-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Teacher number, name, email, phone or specialization…"
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div className="w-full sm:w-52">
            <label
              htmlFor="teacher-status"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Status
            </label>
            <select
              id="teacher-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TeacherStatus | "");
                setPage(1);
              }}
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">Records</span>
            <p className="py-2 text-xs text-ink-500">
              {pagination?.total !== undefined
                ? `${pagination.total.toLocaleString()} teacher${
                    pagination.total === 1 ? "" : "s"
                  }`
                : "—"}
            </p>
          </div>
        </div>

        {listError && (
          <div className="px-5 pt-4">
            <Alert tone="error" title="Could not load teachers">
              <span>{listError} </span>
              <button
                type="button"
                className="font-medium text-red-800 underline underline-offset-2"
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </Alert>
          </div>
        )}

        <DataTable<Teacher>
          columns={columns}
          data={teachers}
          isLoading={isLoading}
          emptyTitle="No teachers found"
          emptyDescription={
            search || status
              ? "Try a different search term or status filter."
              : "Add your first teacher to get started."
          }
          emptyAction={
            <Button
              size="sm"
              variant="outline"
              icon={<UserPlus className="size-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              Add teacher
            </Button>
          }
          rowKey={(t) => t._id}
          mobileCard={(t) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-500">{t.teacherNumber}</p>
                  <p className="truncate font-medium text-ink-900">{t.fullName}</p>
                  <p className="truncate text-xs text-ink-500">{t.email || "—"}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
                <span>Phone: {t.phone || "—"}</span>
                <Badge tone="info">{t.employmentType}</Badge>
              </div>
              <Link
                to={`/teachers/${t._id}`}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:border-primary-300 hover:text-primary-700"
              >
                <Eye className="size-3.5" aria-hidden />
                View profile
              </Link>
            </div>
          )}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      <CreateTeacherDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

type CreateTeacherDialogProps = {
  open: boolean;
  onClose: () => void;
};

function CreateTeacherDialog({ open, onClose }: CreateTeacherDialogProps) {
  const [form, setForm] = useState<CreateFormState>(emptyCreateForm);
  const [created, setCreated] = useState<CreateTeacherResponse | null>(null);

  const [createTeacher, { isLoading: creating, error: createError }] =
    useCreateTeacherMutation();

  const fieldErrors = createError ? getApiFieldErrors(createError) : {};
  const submitError = createError ? getApiErrorMessage(createError, "Failed to create teacher.") : null;

  useEffect(() => {
    if (!open) {
      setForm(emptyCreateForm);
      setCreated(null);
    }
  }, [open]);

  const setField =
    (key: keyof CreateFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }) as CreateFormState);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload: CreateTeacherPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender as CreateTeacherPayload["gender"],      employmentType: form.employmentType,
    };
    if (form.middleName.trim()) payload.middleName = form.middleName.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.qualification.trim()) payload.qualification = form.qualification.trim();
    if (form.specialization.trim()) payload.specialization = form.specialization.trim();
    if (form.employmentDate) payload.employmentDate = form.employmentDate;

    try {
      const result = await createTeacher(payload).unwrap();
      setCreated(result.data);
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={created ? "Teacher created" : "Create teacher"}
      description={
        created
          ? "Save the generated sign-in details — they are shown only once."
          : "A teacher number and sign-in account are generated automatically."
      }
      size="lg"
      footer={
        created ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button form="create-teacher-form" type="submit" loading={creating}>
              Create teacher
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <Alert tone="success" title="Teacher created successfully">
            The teacher profile and account were created.
          </Alert>
          <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-forest-50 px-4 py-3 font-mono text-[13px] text-ink-900">
            {`username:      ${created.login.username}
password:      ${created.login.defaultPassword}
must change:   ${created.login.mustChangePassword ? "yes" : "no"}`}
          </pre>
          <p className="text-xs text-ink-500">
            {created.teacher.fullName} ·{" "}
            <span className="font-mono">{created.teacher.teacherNumber}</span>
          </p>
        </div>
      ) : (
        <form
          id="create-teacher-form"
          className="space-y-4"
          onSubmit={(e) => void handleSubmit(e)}
        >
          {submitError && (
            <Alert tone="error" title="Could not create teacher">
              {submitError}
            </Alert>
          )}
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
                required
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
            </div>
          </Fieldset>
        </form>
      )}
    </Dialog>
  );
}
