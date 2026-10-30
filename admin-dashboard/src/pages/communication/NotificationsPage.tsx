import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { EmptyState } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  extractUnreadCount,
  useBroadcastNotificationMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetNotificationsUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type NotificationType,
} from "@/features/communication/api";
import {
  getApiErrorMessage,
  useListUsersQuery,
  type UsersAdminUser,
} from "@/features/staff/api";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

const PAGE_SIZE = 20;

const NOTIFICATION_TYPES: NotificationType[] = [
  "announcement",
  "message",
  "fee",
  "result",
  "attendance",
  "exam",
  "system",
];

function typeTone(type: string): BadgeTone {
  switch (type) {
    case "announcement":
      return "info";
    case "message":
      return "neutral";
    case "fee":
      return "gold";
    case "result":
      return "success";
    case "attendance":
      return "warning";
    case "exam":
      return "info";
    default:
      return "neutral";
  }
}

function fmtRelative(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diff / day), "day");
  if (abs < month) return rtf.format(Math.round(diff / week), "week");
  if (abs < year) return rtf.format(Math.round(diff / month), "month");
  return rtf.format(Math.round(diff / year), "year");
}

export function NotificationsPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === "admin";

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");
  const [readFilter, setReadFilter] = useState<"" | "true" | "false">("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const broadcastUsers = useBroadcastUsers(isAdmin);

  const { data, isLoading, isError, error, refetch } = useGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    type: typeFilter || undefined,
    isRead: readFilter === "" ? undefined : readFilter === "true",
  });
  const { data: unreadEnvelope } = useGetNotificationsUnreadCountQuery();

  const unread = extractUnreadCount(unreadEnvelope);

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const [markRead, { isLoading: markingOne }] =
    useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();
  const [deleteNotification, { isLoading: deletingOne }] =
    useDeleteNotificationMutation();

  const markAll = () => {
    void (async () => {
      setBannerError(null);
      try {
        await markAllRead().unwrap();
        setNotice("All notifications marked read.");
      } catch (err) {
        setBannerError(getApiErrorMessage(err, "Could not mark all read."));
      }
    })();
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app notifications: announcements, messages, fees, results, attendance, and system alerts."
        actions={
          <>
            {unread !== null && unread > 0 && (
              <Button
                variant="outline"
                icon={<CheckCheck className="size-4" aria-hidden />}
                loading={markingAll}
                onClick={markAll}
              >
                Mark all read
              </Button>
            )}
            {isAdmin && (
              <Button
                icon={<Megaphone className="size-4" aria-hidden />}
                onClick={() => setBroadcastOpen(true)}
              >
                Broadcast
              </Button>
            )}
          </>
        }
      />

      {bannerError && (
        <Alert
          tone="error"
          className="mb-4"
          onDismiss={() => setBannerError(null)}
        >
          {bannerError}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" className="mb-4" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {isError && (
        <Alert
          tone="error"
          title="Could not load notifications"
          className="mb-4"
        >
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Card padded={false}>
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as NotificationType | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Read state"
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value as "" | "true" | "false");
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </SelectField>
        </div>

        <div className="space-y-3 p-4">
          {isLoading && (
            <div
              className="space-y-3"
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">Loading notifications…</span>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-card border border-ink-100 bg-white"
                />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex justify-center py-8">
              <EmptyState
                icon={<Bell className="size-8" aria-hidden />}
                title="You're all caught up."
                description={
                  typeFilter || readFilter
                    ? "No notifications match the selected filters."
                    : "New notifications will appear here."
                }
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void refetch()}
                  >
                    Refresh
                  </Button>
                }
              />
            </div>
          )}

          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification._id}
                className={
                  "rounded-card border bg-white p-4 shadow-card transition-colors " +
                  (notification.isRead
                    ? "border-ink-100"
                    : "border-primary-200 bg-primary-50/40")
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone={typeTone(notification.type)}>
                      {notification.type}
                    </Badge>
                    {!notification.isRead && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 ring-1 ring-inset ring-red-200"
                        aria-label={`Unread notification: ${notification.title}`}
                      >
                        <span
                          className="size-1.5 rounded-full bg-red-600"
                          aria-hidden
                        />
                        Unread
                      </span>
                    )}
                  </div>
                  <time
                    className="text-xs text-ink-500"
                    dateTime={notification.createdAt}
                    title={new Date(notification.createdAt).toLocaleString()}
                  >
                    {fmtRelative(notification.createdAt)}
                  </time>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-semibold text-ink-900">
                    {notification.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-700">
                    {notification.message}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Check className="size-3.5" aria-hidden />}
                      loading={markingOne}
                      onClick={() => {
                        void (async () => {
                          try {
                            await markRead(notification._id).unwrap();
                          } catch (err) {
                            setBannerError(getApiErrorMessage(err));
                          }
                        })();
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    loading={deletingOne}
                    onClick={() => {
                      void (async () => {
                        try {
                          await deleteNotification(notification._id).unwrap();
                        } catch (err) {
                          setBannerError(getApiErrorMessage(err));
                        }
                      })();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <PagedFooter pagination={pagination} onPageChange={setPage} />
      </Card>

      {broadcastOpen && (
        <BroadcastDialog
          users={broadcastUsers}
          onClose={() => setBroadcastOpen(false)}
          onDone={(message) => {
            setBroadcastOpen(false);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}

// The users list is admin-only (13.1); broadcast is admin-only too.
function useBroadcastUsers(enabled: boolean): UsersAdminUser[] {
  const { data } = useListUsersQuery(
    { isActive: true, limit: 200, role: "all" },
    { skip: !enabled },
  );
  return data?.data ?? [];
}

function BroadcastDialog({
  users,
  onClose,
  onDone,
}: {
  users: UsersAdminUser[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("system");
  const [role, setRole] = useState("all");
  const [targetUsers, setTargetUsers] = useState<Set<string>>(
    () => new Set(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const [broadcast, { isLoading: broadcasting }] =
    useBroadcastNotificationMutation();

  const valid = title.trim() && message.trim();

  const toggleUser = (id: string) => {
    setTargetUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const submit = () => {
    void (async () => {
      setFormError(null);
      try {
        await broadcast({
          title: title.trim(),
          message: message.trim(),
          type,
          role,
          userIds: [...targetUsers],
        }).unwrap();
        onDone("Broadcast sent.");
      } catch (err) {
        setFormError(getApiErrorMessage(err, "Broadcast failed."));
      }
    })();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Broadcast notification"
      description="Send an in-app notification to a role or specific users."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={broadcasting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={broadcasting} disabled={!valid}>
            Send broadcast
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InputField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextareaField
          label="Message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType)}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Role"
            required
            hint={targetUsers.size > 0 ? "Specific users take precedence" : undefined}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </SelectField>
        </div>
        <fieldset className="rounded-card border border-ink-100 bg-forest-50/50 p-4">
          <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Or notify specific users
          </legend>
          <p className="text-xs text-ink-500">
            Select none to broadcast to the whole role above.
          </p>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {users.length === 0 && (
              <p className="text-xs text-ink-500">No active users found.</p>
            )}
            {users.map((u) => (
              <label
                key={u._id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-ink-800 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={targetUsers.has(u._id)}
                  onChange={() => toggleUser(u._id)}
                  className="accent-primary-700"
                />
                <span className="truncate">
                  {u.fullName}{" "}
                  <span className="text-xs text-ink-500">({u.role})</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {formError && (
          <Alert tone="error" title="Broadcast failed">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
