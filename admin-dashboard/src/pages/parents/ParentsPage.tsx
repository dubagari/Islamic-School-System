import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link2, Loader2, UserPlus, UsersRound, XCircle } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { Fieldset, InputField } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { DataTable, EmptyState, type Column } from "@/components/ui/DataTable";

import {
  getApiErrorMessage,
  getApiFieldErrors,
  useCreateParentMutation,
  useDeactivateParentMutation,
  useGetParentQuery,
  useLinkParentStudentsMutation,
  useListParentsQuery,
  useListStudentsBasicQuery,
  useUnlinkParentStudentMutation,
  useUpdateParentMutation,
} from "@/features/staff/api";
import type { ParentChild, ParentPlan } from "@/features/staff/api";

const PAGE_SIZE = 20;

function childName(child: ParentChild): string {
  return [child.firstName, child.middleName, child.lastName]
    .filter(Boolean)
    .join(" ");
}

function parentUsernameOf(parent: ParentPlan): string {
  return parent.user && typeof parent.user !== "string"
    ? parent.user.username
    : "";
}

function parentNameOf(parent: ParentPlan): string {
  return parent.user && typeof parent.user !== "string"
    ? parent.user.fullName
    : "";
}

function studentsOf(parent: ParentPlan): ParentChild[] {
  return Array.isArray(parent.students) ? (parent.students as ParentChild[]) : [];
}

// ======================================================
// Page
// ======================================================

export function ParentsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [manageParent, setManageParent] = useState<ParentPlan | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    parent: ParentPlan;
    mode: "activate" | "deactivate";
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useListParentsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    isActive: active === "" ? undefined : active === "true",
  });

  const [deactivateParent, { isLoading: deactivating }] =
    useDeactivateParentMutation();
  const [updateParent, { isLoading: reactivating }] = useUpdateParentMutation();

  const parents = data?.data ?? [];
  const pagination = data?.pagination;
  const listError = error
    ? getApiErrorMessage(error, "Failed to load parents.")
    : null;

  const childrenCount = (p: ParentPlan) => studentsOf(p).length;
  const busy = deactivating || reactivating;

  const applyParentStatus = async (
    parent: ParentPlan,
    mode: "activate" | "deactivate",
  ) => {
    setFeedback(null);
    try {
      if (mode === "deactivate") {
        await deactivateParent(parent._id).unwrap();
        setFeedbackTone("success");
        setFeedback(`${parentNameOf(parent) || "Parent"} was deactivated.`);
      } else {
        await updateParent({ id: parent._id, body: { isActive: true } }).unwrap();
        setFeedbackTone("success");
        setFeedback(`${parentNameOf(parent) || "Parent"} was activated.`);
      }
      setConfirmTarget(null);
    } catch (mutationError) {
      setFeedbackTone("error");
      setFeedback(
        getApiErrorMessage(
          mutationError,
          `Failed to ${mode} the parent account.`,
        ),
      );
      setConfirmTarget(null);
    }
  };

  const columns: Column<ParentPlan>[] = [
    {
      key: "name",
      header: "Parent",
      sortValue: (p) => parentNameOf(p),
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">
            {parentNameOf(p) || "—"}
          </p>
          <p className="truncate font-mono text-xs text-ink-500">
            {parentUsernameOf(p) || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "whitespace-nowrap",
      render: (p) => <span className="whitespace-nowrap">{p.phone || "—"}</span>,
    },
    {
      key: "children",
      header: "Children",
      sortValue: (p) => childrenCount(p),
      align: "center",
      render: (p) => {
        const count = childrenCount(p);
        return (
          <Badge tone={count > 0 ? "success" : "neutral"}>
            {count > 0
              ? `${count.toLocaleString()} child${count === 1 ? "" : "ren"}`
              : "None linked"}
          </Badge>
        );
      },
    },
    {
      key: "active",
      header: "Status",
      sortValue: (p) => String(p.isActive),
      render: (p) => <StatusBadge status={p.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      className: "whitespace-nowrap",
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={<UsersRound className="size-3.5" />}
            onClick={() => setManageParent(p)}
          >
            Manage children
          </Button>
          {p.isActive ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<XCircle className="size-3.5" />}
              disabled={busy}
              onClick={() => setConfirmTarget({ parent: p, mode: "deactivate" })}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmTarget({ parent: p, mode: "activate" })}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Parents"
        description="Create parent accounts, link children and manage parent status."
        arabic="الآباء"
        actions={
          <Button
            icon={<UserPlus className="size-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Add parent
          </Button>
        }
      />

      {feedback && (
        <div className="mb-4">
          <Alert tone={feedbackTone} onDismiss={() => setFeedback(null)}>
            {feedback}
          </Alert>
        </div>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="parent-search"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Search
            </label>
            <input
              id="parent-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by parent name, username or email…"
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div className="w-full sm:w-48">
            <label
              htmlFor="parent-active"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Status
            </label>
            <select
              id="parent-active"
              value={active}
              onChange={(e) => {
                setActive(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="w-full sm:w-40">
            <span className="mb-1.5 block text-xs font-medium text-ink-700">
              Records
            </span>
            <p className="py-2 text-xs text-ink-500">
              {pagination?.total !== undefined
                ? `${pagination.total.toLocaleString()} parent${
                    pagination.total === 1 ? "" : "s"
                  }`
                : "—"}
            </p>
          </div>
        </div>

        {listError && (
          <div className="px-5 pt-4">
            <Alert tone="error" title="Could not load parents">
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

        <DataTable<ParentPlan>
          columns={columns}
          data={parents}
          isLoading={isLoading}
          emptyTitle="No parents found"
          emptyDescription={
            search || active
              ? "Try a different search term or status filter."
              : "Create a parent account and link their children."
          }
          emptyAction={
            <Button
              size="sm"
              variant="outline"
              icon={<UserPlus className="size-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              Add parent
            </Button>
          }
          rowKey={(p) => p._id}
          mobileCard={(p) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {parentNameOf(p) || "—"}
                  </p>
                  <p className="truncate font-mono text-xs text-ink-500">
                    {parentUsernameOf(p) || "—"}
                  </p>
                </div>
                <StatusBadge status={p.isActive ? "Active" : "Inactive"} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
                <span>Phone: {p.phone || "—"}</span>
                <Badge tone={childrenCount(p) > 0 ? "success" : "neutral"}>
                  {childrenCount(p).toLocaleString()} child
                  {childrenCount(p) === 1 ? "" : "ren"}
                </Badge>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<UsersRound className="size-3.5" />}
                  onClick={() => setManageParent(p)}
                >
                  Manage children
                </Button>
                {p.isActive ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<XCircle className="size-3.5" />}
                    disabled={busy}
                    onClick={() =>
                      setConfirmTarget({ parent: p, mode: "deactivate" })
                    }
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      setConfirmTarget({ parent: p, mode: "activate" })
                    }
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          )}
        />

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      <CreateParentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setFeedbackTone("success");
          setFeedback("Parent created successfully. children were linked.");
        }}
      />

      {manageParent && (
        <ManageChildrenDialog
          parent={manageParent}
          onClose={() => setManageParent(null)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          open
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => void applyParentStatus(confirmTarget.parent, confirmTarget.mode)}
          title={confirmTarget.mode === "deactivate" ? "Deactivate parent" : "Activate parent"}
          description={
            confirmTarget.mode === "deactivate"
              ? `${parentNameOf(confirmTarget.parent) || "This parent"} will be deactivated and will no longer be able to use the parent portal.`
              : `${parentNameOf(confirmTarget.parent) || "This parent"} will be reactivated and will regain access to the parent portal.`
          }
          confirmLabel={
            confirmTarget.mode === "deactivate" ? "Deactivate" : "Activate"
          }
          tone={confirmTarget.mode === "deactivate" ? "danger" : "default"}
          loading={busy}
        />
      )}
    </>
  );
}

// ======================================================
// Create parent dialog
// ======================================================

type CreateParentDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function CreateParentDialog({ open, onClose, onCreated }: CreateParentDialogProps) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    alternatePhone: "",
    address: "",
    occupation: "",
    studentIds: [] as string[],
  });

  useEffect(() => {
    if (open) {
      setForm({
        fullName: "",
        username: "",
        email: "",
        password: "",
        phone: "",
        alternatePhone: "",
        address: "",
        occupation: "",
        studentIds: [],
      });
    }
  }, [open]);

  const [createParent, { isLoading: creating, error: createError }] =
    useCreateParentMutation();

  const fieldErrors = createError ? getApiFieldErrors(createError) : {};
  const submitError = createError
    ? getApiErrorMessage(createError, "Failed to create parent.")
    : null;

  const setField =
    (key: "fullName" | "username" | "email" | "password" | "phone" | "alternatePhone" | "address" | "occupation") =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleStudent = (studentId: string) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((s) => s !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createParent({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        phone: form.phone.trim() || undefined,
        alternatePhone: form.alternatePhone.trim() || undefined,
        address: form.address.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        studentIds: form.studentIds,
      }).unwrap();
      onCreated();
      onClose();
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create parent"
      description="Creates a parent sign-in account and links at least one child."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button form="create-parent-form" type="submit" loading={creating}>
            Create parent
          </Button>
        </>
      }
    >
      <form
        id="create-parent-form"
        className="space-y-4"
        onSubmit={(e) => void handleSubmit(e)}
      >
        {submitError && (
          <div className="mb-4">
            <Alert tone="error" title="Could not create parent">
              {submitError}
            </Alert>
          </div>
        )}
        <Fieldset legend="Account">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Full name"
              required
              error={fieldErrors.fullName}
              value={form.fullName}
              onChange={setField("fullName")}
            />
            <InputField
              label="Username"
              required
              hint="e.g. parent.ibrahim"
              error={fieldErrors.username}
              value={form.username}
              onChange={setField("username")}
            />
            <InputField
              label="Email"
              type="email"
              error={fieldErrors.email}
              value={form.email}
              onChange={setField("email")}
            />
            <InputField
              label="Password"
              required
              type="text"
              hint="Minimum 8 characters. The parent must use it at first sign-in."
              error={fieldErrors.password}
              value={form.password}
              onChange={setField("password")}
            />
          </div>
        </Fieldset>
        <Fieldset legend="Contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Phone"
              error={fieldErrors.phone}
              value={form.phone}
              onChange={setField("phone")}
            />
            <InputField
              label="Alternate phone"
              error={fieldErrors.alternatePhone}
              value={form.alternatePhone}
              onChange={setField("alternatePhone")}
            />
            <InputField
              label="Address"
              error={fieldErrors.address}
              value={form.address}
              onChange={setField("address")}
            />
            <InputField
              label="Occupation"
              error={fieldErrors.occupation}
              value={form.occupation}
              onChange={setField("occupation")}
            />
          </div>
        </Fieldset>
        <Fieldset legend="Children">
          <StudentMultiselect
            selected={form.studentIds}
            onToggle={toggleStudent}
            error={fieldErrors.studentIds}
            hint="Select at least one child to link to this parent."
          />
        </Fieldset>
      </form>
    </Dialog>
  );
}

// ======================================================
// Shared student multiselect
// ======================================================

type StudentMultiselectProps = {
  selected: string[];
  onToggle: (studentId: string) => void;
  error?: string;
  hint?: ReactNode;
};

function StudentMultiselect({
  selected,
  onToggle,
  error,
  hint,
}: StudentMultiselectProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListStudentsBasicQuery({
    page: 1,
    limit: 100,
    search: search || undefined,
  });

  const students = useMemo(
    () => (data?.data ?? []).filter((s) => s.isActive),
    [data],
  );

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search students by name or registration number…"
        aria-label="Search students"
        className="mb-2 block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      />
      {isLoading ? (
        <p className="flex items-center gap-2 py-2 text-xs text-ink-500">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading students…
        </p>
      ) : students.length === 0 ? (
        <p className="py-2 text-xs text-ink-500">No matching students.</p>
      ) : (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-ink-200 bg-white p-2">
          {students.map((student) => {
            const isSelected = selected.includes(student._id);
            return (
              <label
                key={student._id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-primary-50"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(student._id)}
                    className="size-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500/40"
                  />
                  <span className="truncate text-ink-900">
                    {[student.firstName, student.middleName, student.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                  <span className="font-mono text-[11px] text-ink-500">
                    {student.registrationNumber}
                  </span>
                </span>
                {isSelected && <Badge tone="success">Selected</Badge>}
              </label>
            );
          })}
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
          <span aria-hidden>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ======================================================
// Manage children dialog (link / unlink)
// ======================================================

type ManageChildrenDialogProps = {
  parent: ParentPlan;
  onClose: () => void;
};

function ManageChildrenDialog({ parent, onClose }: ManageChildrenDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingUnlink, setPendingUnlink] = useState<ParentChild | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fresh copy so link/unlink results appear without closing the dialog.
  const { data: freshParent } = useGetParentQuery(parent._id);
  const current = freshParent?.data ?? parent;
  const children = studentsOf(current);

  const [linkStudents, { isLoading: linking }] = useLinkParentStudentsMutation();
  const [unlinkStudent, { isLoading: unlinking }] =
    useUnlinkParentStudentMutation();

  const handleLink = async () => {
    if (selected.length === 0) {
      setLinkError("Select at least one student to link.");
      return;
    }

    try {
      await linkStudents({ id: current._id, studentIds: selected }).unwrap();
      setLinkError(null);
      setFeedback("The selected children were linked.");
      setSelected([]);
    } catch (mutationError) {
      setLinkError(getApiErrorMessage(mutationError, "Failed to link students."));
    }
  };

  const handleUnlink = async (child: ParentChild) => {
    try {
      await unlinkStudent({ id: current._id, studentId: child._id }).unwrap();
      setUnlinkError(null);
      setFeedback(`${childName(child)} was unlinked.`);
      setPendingUnlink(null);
    } catch (mutationError) {
      setUnlinkError(getApiErrorMessage(mutationError, "Failed to unlink student."));
      setPendingUnlink(null);
    }
  };

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title="Manage children"
        description={`${parentNameOf(current) || "Parent"} · ${current.phone || "no phone"}`}
        size="lg"
        footer={
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          {feedback && (
            <Alert tone="success" onDismiss={() => setFeedback(null)}>
              {feedback}
            </Alert>
          )}
          {linkError && (
            <Alert tone="error" onDismiss={() => setLinkError(null)}>
              {linkError}
            </Alert>
          )}
          {unlinkError && (
            <Alert tone="error" onDismiss={() => setUnlinkError(null)}>
              {unlinkError}
            </Alert>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Linked children ({children.length.toLocaleString()})
            </p>
            {children.length === 0 ? (
              <EmptyState
                title="No children linked"
                description="Link students below so this parent can follow their school records."
              />
            ) : (
              <ul className="space-y-1 rounded-lg border border-ink-200 bg-white p-2">
                {children.map((child) => (
                  <li
                    key={child._id}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="truncate text-ink-900">
                        {childName(child)}
                      </span>
                      <span className="ml-2 font-mono text-[11px] text-ink-500">
                        {child.registrationNumber}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<XCircle className="size-3.5" />}
                      disabled={unlinking}
                      onClick={() => {
                        setUnlinkError(null);
                        setPendingUnlink(child);
                      }}
                    >
                      Unlink
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Link children
            </p>
            <StudentMultiselect
              selected={selected}
              onToggle={(studentId) => {
                setLinkError(null);
                setSelected((prev) =>
                  prev.includes(studentId)
                    ? prev.filter((s) => s !== studentId)
                    : [...prev, studentId],
                );
              }}
            />
            <Button
              className="mt-2"
              size="sm"
              icon={<Link2 className="size-3.5" />}
              loading={linking}
              onClick={() => void handleLink()}
            >
              Link selected children
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={pendingUnlink !== null}
        onClose={() => setPendingUnlink(null)}
        onConfirm={() => void handleUnlink(pendingUnlink as ParentChild)}
        title="Unlink child"
        description={`This will unlink the child ${
          pendingUnlink ? childName(pendingUnlink) : ""
        } from this parent account. The parent will lose access to the child's records.`}
        confirmLabel="Unlink"
        tone="danger"
        loading={unlinking}
      />
    </>
  );
}
