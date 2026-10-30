import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { KeyRound, Pencil, Search, ShieldCheck, UserX } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { Fieldset, InputField } from "@/components/ui/Fields";
import { PagedFooter } from "@/components/ui/Pagination";
import { DataTable, type Column } from "@/components/ui/DataTable";

import {
  getApiErrorMessage,
  getApiFieldErrors,
  useListUsersQuery,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
} from "@/features/staff/api";
import type { ResetUserPasswordResponse, UsersAdminUser } from "@/features/staff/api";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

const PAGE_SIZE = 20;

const ROLE_OPTIONS: UsersAdminUser["role"][] = [
  "admin",
  "teacher",
  "student",
  "parent",
];

function roleTone(role: string): BadgeTone {
  switch (role) {
    case "admin":
      return "gold";
    case "teacher":
      return "success";
    case "student":
      return "info";
    case "parent":
      return "neutral";
    default:
      return "neutral";
  }
}

function fmtDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

// ======================================================
// Page
// ======================================================

export function UsersAdminPage() {
  const currentUser = useAppSelector(selectCurrentUser);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | UsersAdminUser["role"]>("");
  const [active, setActive] = useState<"" | "true" | "false">("");

  const [editTarget, setEditTarget] = useState<UsersAdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<UsersAdminUser | null>(null);
  const [resetResult, setResetResult] =
    useState<ResetUserPasswordResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<UsersAdminUser | null>(null);
  const [activateTarget, setActivateTarget] = useState<UsersAdminUser | null>(null);
  const [banner, setBanner] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useListUsersQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    role: role || "all",
    isActive: active === "" ? undefined : active === "true",
  });

  const [deactivateUser, { isLoading: deactivating }] = useDeactivateUserMutation();
  const [updateUser, { isLoading: togglingActive }] = useUpdateUserMutation();

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const listError = error ? getApiErrorMessage(error, "Failed to load users.") : null;

  const isSelf = (user: UsersAdminUser): boolean =>
    Boolean(currentUser && currentUser._id === user._id);

  const handleActivate = async (user: UsersAdminUser) => {
    setBanner(null);
    try {
      await updateUser({ id: user._id, body: { isActive: true } }).unwrap();
      setBanner({
        tone: "success",
        text: `${user.fullName} (@${user.username}) was activated.`,
      });
      setActivateTarget(null);
    } catch (mutationError) {
      setBanner({
        tone: "error",
        text: getApiErrorMessage(mutationError, "Failed to activate the user."),
      });
      setActivateTarget(null);
    }
  };

  const handleDeactivate = async (user: UsersAdminUser) => {
    setBanner(null);
    try {
      await deactivateUser(user._id).unwrap();
      setBanner({
        tone: "success",
        text: `${user.fullName} (@${user.username}) was deactivated.`,
      });
      setDeactivateTarget(null);
    } catch (mutationError) {
      setBanner({
        tone: "error",
        text: getApiErrorMessage(mutationError, "Failed to deactivate the user."),
      });
      setDeactivateTarget(null);
    }
  };

  const columns: Column<UsersAdminUser>[] = [
    {
      key: "username",
      header: "Username",
      sortValue: (u) => u.username,
      className: "whitespace-nowrap",
      render: (u) => (
        <span className="font-mono text-[13px]">
          @{u.username}
          {isSelf(u) ? <span className="ml-1 text-[11px] text-ink-400">(you)</span> : null}
        </span>
      ),
    },
    {
      key: "fullName",
      header: "Full name",
      sortValue: (u) => u.fullName,
      render: (u) => <span className="truncate font-medium text-ink-900">{u.fullName}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="truncate">{u.email || "—"}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortValue: (u) => u.role,
      render: (u) => <Badge tone={roleTone(u.role)}>{u.role}</Badge>,
    },
    {
      key: "isActive",
      header: "Status",
      sortValue: (u) => String(u.isActive),
      render: (u) => <StatusBadge status={u.isActive ? "Active" : "Inactive"} />,
    },
    {
      key: "mustChangePassword",
      header: "Password",
      render: (u) => (
        <Badge tone={u.mustChangePassword ? "warning" : "neutral"}>
          {u.mustChangePassword ? "Must change" : "Up to date"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last login",
      sortValue: (u) => (u.lastLogin ?? ""),
      className: "whitespace-nowrap",
      render: (u) => <span className="text-xs">{fmtDateTime(u.lastLogin)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "end",
      className: "whitespace-nowrap",
      render: (u) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            icon={<KeyRound className="size-3.5" />}
            disabled={isSelf(u)}
            onClick={() => setResetTarget(u)}
          >
            Reset password
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Pencil className="size-3.5" />}
            onClick={() => setEditTarget(u)}
          >
            Edit
          </Button>
          {u.isActive ? (
            <Button
              size="sm"
              variant="ghost"
              icon={<UserX className="size-3.5" />}
              disabled={isSelf(u)}
              onClick={() => setDeactivateTarget(u)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              icon={<ShieldCheck className="size-3.5" />}
              disabled={isSelf(u) || togglingActive}
              onClick={() => setActivateTarget(u)}
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
        title="Users"
        description="Every sign-in account in the system, with password and activation controls."
        arabic="المستخدمون"
        actions={
          <Button variant="outline" onClick={() => void refetch()}>
            Refresh
          </Button>
        }
      />

      {banner && (
        <div className="mb-4">
          <Alert tone={banner.tone} onDismiss={() => setBanner(null)}>
            {banner.text}
          </Alert>
        </div>
      )}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="user-search"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Search
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
                aria-hidden
              />
              <input
                id="user-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, username or email…"
                className="block w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>
          <div className="w-full sm:w-40">
            <label
              htmlFor="user-role"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as "" | UsersAdminUser["role"]);
                setPage(1);
              }}
              className="block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label
              htmlFor="user-active"
              className="mb-1.5 block text-xs font-medium text-ink-700"
            >
              Status
            </label>
            <select
              id="user-active"
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
                ? `${pagination.total.toLocaleString()} user${pagination.total === 1 ? "" : "s"}`
                : "—"}
            </p>
          </div>
        </div>

        {listError && (
          <div className="px-5 pt-4">
            <Alert tone="error" title="Could not load users">
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

        <DataTable<UsersAdminUser>
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyTitle="No users found"
          emptyDescription={
            search || role || active
              ? "Try a different search term or filter."
              : "No accounts exist yet."
          }
          rowKey={(u) => u._id}
          mobileCard={(u) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{u.fullName}</p>
                  <p className="truncate font-mono text-xs text-ink-500">@{u.username}</p>
                  <p className="truncate text-xs text-ink-500">{u.email || "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                  <StatusBadge status={u.isActive ? "Active" : "Inactive"} />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
                <span>Last login: {fmtDateTime(u.lastLogin)}</span>
                <Badge tone={u.mustChangePassword ? "warning" : "neutral"}>
                  {u.mustChangePassword ? "Must change password" : "Password up to date"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<KeyRound className="size-3.5" />}
                  disabled={isSelf(u)}
                  onClick={() => setResetTarget(u)}
                >
                  Reset password
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => setEditTarget(u)}
                >
                  Edit
                </Button>
                {u.isActive ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<UserX className="size-3.5" />}
                    disabled={isSelf(u)}
                    onClick={() => setDeactivateTarget(u)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isSelf(u) || togglingActive}
                    onClick={() => setActivateTarget(u)}
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

      <EditUserDialog
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={setBanner}
      />

      <ResetPasswordDialog
        target={resetTarget}
        result={resetResult}
        onResult={setResetResult}
        onClose={() => {
          setResetTarget(null);
          setResetResult(null);
        }}
      />

      {deactivateTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeactivateTarget(null)}
          onConfirm={() => void handleDeactivate(deactivateTarget)}
          title="Deactivate user"
          description={`${deactivateTarget.fullName} (@${deactivateTarget.username}) will be deactivated and will no longer be able to sign in.`}
          confirmLabel="Deactivate"
          tone="danger"
          loading={deactivating}
        />
      )}

      {activateTarget && (
        <ConfirmDialog
          open
          onClose={() => setActivateTarget(null)}
          onConfirm={() => void handleActivate(activateTarget)}
          title="Activate user"
          description={`${activateTarget.fullName} (@${activateTarget.username}) will be reactivated and will regain sign-in access.`}
          confirmLabel="Activate"
          loading={togglingActive}
        />
      )}
    </>
  );
}

// ======================================================
// Edit identity dialog
// ======================================================

type EditUserDialogProps = {
  user: UsersAdminUser | null;
  onClose: () => void;
  onSaved: (banner: { tone: "success" | "error"; text: string }) => void;
};

function EditUserDialog({ user, onClose, onSaved }: EditUserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setEmail(user.email ?? "");
      setMustChangePassword(Boolean(user.mustChangePassword));
    }
  }, [user]);

  const [updateUser, { isLoading: saving, error: updateError }] =
    useUpdateUserMutation();

  const fieldErrors = updateError ? getApiFieldErrors(updateError) : {};
  const submitError = updateError
    ? getApiErrorMessage(updateError, "Failed to update user.")
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateUser({
        id: user._id,
        body: {
          fullName: fullName.trim(),
          email: email.trim(),
          mustChangePassword,
        },
      }).unwrap();
      onSaved({
        tone: "success",
        text: `${fullName} (@${user.username}) was updated.`,
      });
      onClose();
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  return (
    <Dialog
      open={user !== null}
      onClose={onClose}
      title="Edit user"
      description={user ? `${user.fullName} (@${user.username}) · ${user.role}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button form="edit-user-form" type="submit" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-user-form"
        className="space-y-4"
        onSubmit={(e) => void handleSubmit(e)}
      >
        {submitError && (
          <div className="mb-2">
            <Alert tone="error" title="Could not update user">
              {submitError}
            </Alert>
          </div>
        )}
        <Fieldset legend="Identity">
          <div className="grid gap-3 sm:grid-cols-2">
            <InputField
              label="Full name"
              required
              error={fieldErrors.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <InputField
              label="Email"
              type="email"
              error={fieldErrors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={mustChangePassword}
              onChange={(e) => setMustChangePassword(e.target.checked)}
              className="size-4 rounded border-ink-300 text-primary-700 focus:ring-primary-500/40"
            />
            Force password change on next sign-in
          </label>
        </Fieldset>
      </form>
    </Dialog>
  );
}

// ======================================================
// Reset password dialog
// ======================================================

type ResetPasswordDialogProps = {
  target: UsersAdminUser | null;
  result: ResetUserPasswordResponse | null;
  onResult: (result: ResetUserPasswordResponse | null) => void;
  onClose: () => void;
};

function ResetPasswordDialog({ target, result, onResult, onClose }: ResetPasswordDialogProps) {
  const [resetUserPassword, { isLoading: resetting, error: resetError }] =
    useResetUserPasswordMutation();

  const submitError = resetError
    ? getApiErrorMessage(resetError, "Failed to reset the password.")
    : null;

  const handleConfirm = async () => {
    if (!target) return;

    try {
      // No newPassword → the server generates a temporary password.
      const response = await resetUserPassword({ id: target._id }).unwrap();
      onResult(response.data);
    } catch {
      // Error is rendered from the mutation state.
    }
  };

  if (!target) return null;

  if (result) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="Temporary password generated"
        description={`Password reset for ${result.user.fullName} (@${result.user.username})`}
        footer={
          <Button onClick={onClose}>Close</Button>
        }
      >
        <div className="space-y-4">
          <Alert tone="success" title="Password was reset">
            The user must change this password at next sign-in. Show it only once, over a secure channel.
          </Alert>
          <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-forest-50 px-4 py-3 font-mono text-sm text-ink-900">
            {result.temporaryPassword ?? "—"}
          </pre>
          <p className="text-xs text-ink-500">
            <Badge tone="info">Username</Badge>{" "}
            <span className="ml-1 font-mono">{result.user.username}</span>
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <div className="space-y-3">
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={() => void handleConfirm()}
        title="Reset password"
        description={`A new temporary password will be generated for ${target.fullName} (@${target.username}). The current password stops working and the user must change the temporary password at next sign-in.`}
        confirmLabel="Reset password"
        loading={resetting}
      />
      {submitError && (
        <Alert tone="error" title="Could not reset password" onDismiss={onClose}>
          {submitError}
        </Alert>
      )}
    </div>
  );
}
