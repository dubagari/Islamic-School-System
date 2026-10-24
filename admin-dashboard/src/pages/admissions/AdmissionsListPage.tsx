import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CircleX, Plus } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagedFooter } from "@/components/ui/Pagination";
import {
  useApproveAdmissionMutation,
  useCreateAdmissionMutation,
  useGetAdmissionsQuery,
  useRejectAdmissionMutation,
  toFieldErrors,
  type AdmissionApplication,
  type CreateAdmissionApplicationPayload,
} from "@/features/admissions/api";

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected"] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

type CreateFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: "Male" | "Female" | "";
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  currentLevel: string;
  previousMadrasa: string;
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
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  relationship: "",
  currentLevel: "",
  previousMadrasa: "",
};

type RowAction = {
  type: "approve" | "reject";
  application: AdmissionApplication;
};

export function AdmissionsListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [createFields, setCreateFields] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);

  const [rowAction, setRowAction] = useState<RowAction | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFields, setRejectFields] = useState<Record<string, string>>({});
  const [rejectError, setRejectError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdmissionsQuery({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch || undefined,
    status: statusFilter === "All" ? undefined : statusFilter,
  });

  const [createAdmission, createResult] = useCreateAdmissionMutation();
  const [approveAdmission, approveResult] = useApproveAdmissionMutation();
  const [rejectAdmission, rejectResult] = useRejectAdmissionMutation();

  // Debounce the search input (~300ms).
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchInput.trim()),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Reset to the first page whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const applications = data?.data;

  const columns: Column<AdmissionApplication>[] = [
    {
      key: "applicationNumber",
      header: "Application #",
      render: (item) => (
        <span className="font-mono text-[13px] text-ink-800">
          {item.applicationNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortValue: (item) =>
        [item.firstName, item.middleName, item.lastName]
          .filter(Boolean)
          .join(" "),
      render: (item) => (
        <span className="font-medium text-ink-900">
          {[item.firstName, item.middleName, item.lastName]
            .filter(Boolean)
            .join(" ")}
        </span>
      ),
    },
    { key: "gender", header: "Gender", render: (item) => item.gender },
    {
      key: "currentLevel",
      header: "Level",
      render: (item) => item.currentLevel,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (item) => <StatusBadge status={item.paymentStatus} />,
    },
    {
      key: "submitted",
      header: "Submitted",
      sortValue: (item) => item.createdAt,
      render: (item) =>
        new Date(item.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      render: (item) => (
        <RowActions application={item} onAction={setRowAction} />
      ),
    },
  ];

  const openCreateDialog = () => {
    setCreateForm(emptyCreateForm);
    setCreateFields({});
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const payload: CreateAdmissionApplicationPayload = {
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
      middleName: createForm.middleName.trim() || undefined,
      gender: createForm.gender as CreateAdmissionApplicationPayload["gender"],
      dateOfBirth: createForm.dateOfBirth,
      email: createForm.email.trim() || undefined,
      phone: createForm.phone.trim(),
      address: createForm.address.trim(),
      parentName: createForm.parentName.trim(),
      parentPhone: createForm.parentPhone.trim(),
      parentEmail: createForm.parentEmail.trim() || undefined,
      relationship: createForm.relationship.trim(),
      currentLevel: createForm.currentLevel.trim(),
      previousMadrasa: createForm.previousMadrasa.trim() || undefined,
    };

    try {
      await createAdmission(payload).unwrap();
      setCreateOpen(false);
    } catch (error) {
      const { message, fields } = toFieldErrors(error);
      setCreateError(message);
      setCreateFields(fields);
    }
  };

  const handleApprove = async () => {
    if (!rowAction || rowAction.type !== "approve") return;
    try {
      await approveAdmission(rowAction.application._id).unwrap();
      setRowAction(null);
    } catch (error) {
      const { message } = toFieldErrors(error);
      setCreateError(message);
      setRowAction(null);
    }
  };

  const handleReject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rowAction || rowAction.type !== "reject") return;

    try {
      const trimmed = rejectReason.trim();
      await rejectAdmission({
        id: rowAction.application._id,
        reason: trimmed || undefined,
      }).unwrap();
      setRowAction(null);
      setRejectReason("");
      setRejectFields({});
      setRejectError(null);
    } catch (error) {
      const { message, fields } = toFieldErrors(error);
      setRejectError(message);
      setRejectFields(fields);
    }
  };

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Review and process submitted admission applications."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={openCreateDialog}>
            New application
          </Button>
        }
      />

      {isError && (
        <Alert tone="error" title="Failed to load admissions" className="mb-4">
          Something went wrong while fetching applications.
          <Button size="sm" variant="outline" className="ms-2" onClick={() => refetch()}>
            Retry
          </Button>
        </Alert>
      )}

      {createError && (
        <Alert tone="error" title="Action failed" onDismiss={() => setCreateError(null)} className="mb-4">
          {createError}
        </Alert>
      )}

      <Card padded={false} className="mb-4">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Search"
            placeholder="App number, name, phone, parent…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

      <Card padded={false}>
        <DataTable
          columns={columns}
          data={applications}
          isLoading={isLoading && !data}
          rowKey={(item) => item._id}
          emptyTitle="No admission applications"
          emptyDescription={
            debouncedSearch || statusFilter !== "All"
              ? "No applications match the current filters."
              : "Applications submitted to the school will appear here."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreateDialog}>
              New application
            </Button>
          }
          mobileCard={(item) => (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-ink-500">
                  {item.applicationNumber ?? "—"}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className="font-medium text-ink-900">
                {[item.firstName, item.middleName, item.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              <p className="text-xs text-ink-500">
                {item.currentLevel} · {item.gender} · submitted{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={item.paymentStatus} />
                <Link
                  to={`/admissions/${item._id}`}
                  className="text-xs font-medium text-primary-700 hover:text-primary-800"
                >
                  View →
                </Link>
              </div>
            </div>
          )}
        />
        <PagedFooter
          pagination={data?.pagination}
          onPageChange={setPage}
        />
      </Card>

      {/* ======================================================
          Create application dialog
        ====================================================== */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New admission application"
        description="Submit an application on behalf of an applicant."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createResult.isLoading}>
              Cancel
            </Button>
            <Button type="submit" form="create-admission-form" loading={createResult.isLoading}>
              {createResult.isLoading ? "Submitting…" : "Submit application"}
            </Button>
          </>
        }
      >
        {createError && (
          <Alert tone="error" onDismiss={() => setCreateError(null)} className="mb-4">
            {createError}
          </Alert>
        )}
        <form id="create-admission-form" onSubmit={handleCreate} noValidate>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="First name"
                required
                error={createFields.firstName}
                value={createForm.firstName}
                onChange={(e) => updateCreateForm(setCreateForm, "firstName", e.target.value)}
              />
              <InputField
                label="Middle name"
                error={createFields.middleName}
                value={createForm.middleName}
                onChange={(e) => updateCreateForm(setCreateForm, "middleName", e.target.value)}
              />
              <InputField
                label="Last name"
                required
                error={createFields.lastName}
                value={createForm.lastName}
                onChange={(e) => updateCreateForm(setCreateForm, "lastName", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Gender"
                required
                error={createFields.gender}
                value={createForm.gender}
                onChange={(e) =>
                  updateCreateForm(setCreateForm, "gender", e.target.value)
                }
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SelectField>
              <InputField
                label="Date of birth"
                required
                type="date"
                error={createFields.dateOfBirth}
                value={createForm.dateOfBirth}
                onChange={(e) => updateCreateForm(setCreateForm, "dateOfBirth", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Phone"
                required
                error={createFields.phone}
                value={createForm.phone}
                onChange={(e) => updateCreateForm(setCreateForm, "phone", e.target.value)}
              />
              <InputField
                label="Email"
                hint="Optional"
                type="email"
                error={createFields.email}
                value={createForm.email}
                onChange={(e) => updateCreateForm(setCreateForm, "email", e.target.value)}
              />
            </div>

            <InputField
              label="Address"
              required
              error={createFields.address}
              value={createForm.address}
              onChange={(e) => updateCreateForm(setCreateForm, "address", e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="Parent / guardian name"
                required
                error={createFields.parentName}
                value={createForm.parentName}
                onChange={(e) => updateCreateForm(setCreateForm, "parentName", e.target.value)}
              />
              <InputField
                label="Parent phone"
                required
                error={createFields.parentPhone}
                value={createForm.parentPhone}
                onChange={(e) => updateCreateForm(setCreateForm, "parentPhone", e.target.value)}
              />
              <InputField
                label="Parent email"
                hint="Optional"
                type="email"
                error={createFields.parentEmail}
                value={createForm.parentEmail}
                onChange={(e) => updateCreateForm(setCreateForm, "parentEmail", e.target.value)}
              />
            </div>

            <InputField
              label="Relationship to applicant"
              required
              hint="e.g. Father, Mother, Guardian"
              error={createFields.relationship}
              value={createForm.relationship}
              onChange={(e) => updateCreateForm(setCreateForm, "relationship", e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Current level"
                required
                hint="e.g. Primary 5"
                error={createFields.currentLevel}
                value={createForm.currentLevel}
                onChange={(e) => updateCreateForm(setCreateForm, "currentLevel", e.target.value)}
              />
              <InputField
                label="Previous madrasa"
                hint="Optional"
                error={createFields.previousMadrasa}
                value={createForm.previousMadrasa}
                onChange={(e) => updateCreateForm(setCreateForm, "previousMadrasa", e.target.value)}
              />
            </div>
          </div>
        </form>
      </Dialog>

      {/* ======================================================
          Approve (confirm) dialog
        ====================================================== */}
      <ConfirmDialog
        open={rowAction?.type === "approve"}
        onClose={() => setRowAction(null)}
        onConfirm={handleApprove}
        title="Approve application"
        description={
          rowAction?.application
            ? `Approve ${rowAction.application.firstName} ${rowAction.application.lastName}? This allows payment collection to begin.`
            : undefined
        }
        confirmLabel="Approve"
        loading={approveResult.isLoading}
      />

      {/* ======================================================
          Reject dialog
        ====================================================== */}
      <Dialog
        open={rowAction?.type === "reject"}
        onClose={() => {
          setRowAction(null);
          setRejectReason("");
          setRejectFields({});
          setRejectError(null);
        }}
        title="Reject application"
        description="This application will be marked as rejected."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRowAction(null)} disabled={rejectResult.isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reject-admission-form"
              variant="danger"
              loading={rejectResult.isLoading}
            >
              Reject
            </Button>
          </>
        }
      >
        {rejectError && (
          <Alert tone="error" onDismiss={() => setRejectError(null)} className="mb-3">
            {rejectError}
          </Alert>
        )}
        {rejectFields.reason && (
          <Alert tone="error" className="mb-3">
            {rejectFields.reason}
          </Alert>
        )}
        <form id="reject-admission-form" onSubmit={handleReject}>
          <TextareaField
            label="Reason (optional)"
            maxLength={500}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </form>
      </Dialog>
    </>
  );
}

// ======================================================
// Sub-components
// ======================================================

function RowActions({
  application,
  onAction,
}: {
  application: AdmissionApplication;
  onAction: (action: RowAction) => void;
}) {
  if (application.status === "Pending") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="outline"
          icon={<BadgeCheck className="size-3.5" aria-hidden />}
          onClick={() => onAction({ type: "approve", application })}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<CircleX className="size-3.5" aria-hidden />}
          onClick={() => onAction({ type: "reject", application })}
        >
          Reject
        </Button>
        <Link
          to={`/admissions/${application._id}`}
          className="text-xs font-medium text-primary-700 hover:text-primary-800"
        >
          View
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={`/admissions/${application._id}`}
      className="text-xs font-medium text-primary-700 hover:text-primary-800"
    >
      View
    </Link>
  );
}

function updateCreateForm(
  setForm: Dispatch<SetStateAction<CreateFormState>>,
  key: keyof CreateFormState,
  value: string,
) {
  setForm((prev) => ({ ...prev, [key]: value }));
}
