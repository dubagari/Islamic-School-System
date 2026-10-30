import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Megaphone,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";

import {
  extractUnreadCount,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAcademicClassesQuery,
  useGetAnnouncementUnreadCountQuery,
  useGetAnnouncementsQuery,
  useMarkAnnouncementReadMutation,
  useUpdateAnnouncementMutation,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementPayload,
  type AnnouncementPriority,
} from "@/features/communication/api";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

const PAGE_SIZE = 20;

const AUDIENCES: AnnouncementAudience[] = [
  "all",
  "students",
  "teachers",
  "parents",
  "class",
];

const PRIORITIES: AnnouncementPriority[] = ["Low", "Normal", "High", "Urgent"];

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message) || "Request failed.";
  }
  return "Request failed.";
}

function priorityTone(priority: string): BadgeTone {
  switch (priority) {
    case "Urgent":
      return "danger";
    case "High":
      return "warning";
    case "Low":
      return "neutral";
    default:
      return "info";
  }
}

function audienceLabel(announcement: Announcement): string {
  const value = announcement.audience;
  if (value === "class") {
    const cls = announcement.academicClass;
    const name = cls && typeof cls === "object" ? cls.name : undefined;
    return name ? `Class — ${name}` : "Class";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function isExpired(announcement: Announcement): boolean {
  if (!announcement.expiresAt) return false;
  const expires = new Date(announcement.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() < Date.now();
}

function UnreadBadge({ title }: { title: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 ring-1 ring-inset ring-red-200"
      aria-label={`Unread announcement: ${title}`}
    >
      <span className="size-1.5 rounded-full bg-red-600" aria-hidden />
      Unread
    </span>
  );
}

export function AnnouncementsPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAdmin = currentUser?.role === "admin";

  const [page, setPage] = useState(1);
  const [showExpired, setShowExpired] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAnnouncementsQuery({ page, limit: PAGE_SIZE });
  const { data: unreadEnvelope } = useGetAnnouncementUnreadCountQuery();

  const unread = extractUnreadCount(unreadEnvelope);

  const announcements = data?.data ?? [];
  const pagination = data?.pagination;

  const [updateAnnouncement] =
    useUpdateAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: deleting }] =
    useDeleteAnnouncementMutation();
  const [markRead, { isLoading: markingRead }] =
    useMarkAnnouncementReadMutation();

  const publishNow = (announcement: Announcement) => {
    void (async () => {
      setBannerError(null);
      try {
        await updateAnnouncement({
          id: announcement._id,
          isPublished: true,
        }).unwrap();
        setNotice("Announcement published — the audience has been notified in-app.");
      } catch (err) {
        setBannerError(getErrorMessage(err));
      }
    })();
  };

  const columns: Column<Announcement>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortValue: (a) => a.title,
        render: (a) => (
          <div className="max-w-xs">
            <p className="font-medium text-ink-900">{a.title}</p>
            <p className="mt-0.5 truncate text-xs text-ink-500" title={a.content}>
              {a.content}
            </p>
          </div>
        ),
      },
      {
        key: "audience",
        header: "Audience",
        sortValue: (a) => a.audience,
        render: (a) => <Badge tone="neutral">{audienceLabel(a)}</Badge>,
      },
      {
        key: "priority",
        header: "Priority",
        sortValue: (a) => a.priority,
        render: (a) => (
          <Badge tone={priorityTone(a.priority)}>{a.priority}</Badge>
        ),
      },
      {
        key: "publishState",
        header: "Publishing",
        render: (a) => (
          <span className="flex items-center gap-2">
            {isExpired(a) ? (
              <Badge tone="neutral">Expired</Badge>
            ) : a.isPublished ? (
              <Badge tone="success">Published</Badge>
            ) : (
              <Badge tone="warning">Draft</Badge>
            )}
            {a.isRead === false && <UnreadBadge title={a.title} />}
          </span>
        ),
      },
      {
        key: "publishAt",
        header: "Publish at",
        sortValue: (a) => a.publishAt ?? a.createdAt,
        render: (a) =>
          fmtDateTime(a.publishAt ?? a.publishedAt ?? a.createdAt),
      },
      {
        key: "expiresAt",
        header: "Expires at",
        render: (a) => fmtDateTime(a.expiresAt),
      },
      {
        key: "actions",
        header: "Actions",
        align: "end",
        render: (a) => (
          <div className="flex items-center justify-end gap-2">
            {!isExpired(a) && !a.isPublished && (
              <Button size="sm" onClick={() => publishNow(a)}>
                Publish now
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              icon={<PencilLine className="size-3.5" aria-hidden />}
              onClick={() => {
                setEditing(a);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="size-3.5" aria-hidden />}
              aria-label={`Delete announcement: ${a.title}`}
              onClick={() => setDeleteTarget(a)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const activeAnnouncements = announcements.filter((a) => !isExpired(a));
  const expiredAnnouncements = announcements.filter(isExpired);

  const renderFeedCard = (announcement: Announcement) => (
    <Card key={announcement._id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge tone={priorityTone(announcement.priority)}>
            {announcement.priority}
          </Badge>
          <Badge tone="neutral">{audienceLabel(announcement)}</Badge>
          {announcement.isRead === false && (
            <UnreadBadge title={announcement.title} />
          )}
        </div>
        <p className="text-xs text-ink-500">
          {fmtDateTime(announcement.publishAt ?? announcement.createdAt)}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">
          {announcement.title}
        </h3>
        <p className="mt-1 whitespace-pre-line text-sm text-ink-700">
          {announcement.content}
        </p>
      </div>
      <div>
        <Button
          size="sm"
          variant="outline"
          icon={<Check className="size-3.5" aria-hidden />}
          loading={markingRead}
          disabled={announcement.isRead !== false}
          onClick={() => {
            void (async () => {
              try {
                await markRead(announcement._id).unwrap();
              } catch (err) {
                setBannerError(getErrorMessage(err));
              }
            })();
          }}
        >
          Mark as read
        </Button>
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="School announcements broadcast in-app to the selected audience."
        actions={
          isAdmin ? (
            <Button
              icon={<Plus className="size-4" aria-hidden />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New announcement
            </Button>
          ) : undefined
        }
      />

      {isError && (
        <Alert tone="error" title="Could not load announcements" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getErrorMessage(error)}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {bannerError && (
        <Alert
          tone="error"
          title="Announcement action failed"
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

      {unread !== null && unread > 0 && (
        <Alert tone="info" className="mb-4">
          You have {unread} unread announcement{unread === 1 ? "" : "s"}.
        </Alert>
      )}

      {isAdmin ? (
        <Card padded={false}>
          <DataTable
            columns={columns}
            data={announcements}
            isLoading={isLoading}
            emptyTitle="No announcements yet"
            emptyDescription="Create an announcement to notify students, teachers, or parents."
            rowKey={(a) => a._id}
            mobileCard={(a) => (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone(a.priority)}>{a.priority}</Badge>
                  <Badge tone="neutral">{audienceLabel(a)}</Badge>
                  {isExpired(a) ? (
                    <Badge tone="neutral">Expired</Badge>
                  ) : a.isPublished ? (
                    <Badge tone="success">Published</Badge>
                  ) : (
                    <Badge tone="warning">Draft</Badge>
                  )}
                  {a.isRead === false && <UnreadBadge title={a.title} />}
                </div>
                <p className="font-medium text-ink-900">{a.title}</p>
                <p className="text-xs text-ink-500">
                  Publish at {fmtDateTime(a.publishAt ?? a.publishedAt ?? a.createdAt)}{" "}
                  · Expires {fmtDateTime(a.expiresAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isExpired(a) && !a.isPublished && (
                    <Button size="sm" onClick={() => publishNow(a)}>
                      Publish now
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(a)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          />
          <PagedFooter pagination={pagination} onPageChange={setPage} />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" role="status" aria-live="polite">
          <span className="sr-only">Loading announcements…</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-card border border-ink-100 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <SectionTitle
              className="mb-3"
              actions={
                unread !== null && unread > 0 ? (
                  <Badge tone="danger">{unread} unread</Badge>
                ) : undefined
              }
            >
              Announcements feed
            </SectionTitle>
            {activeAnnouncements.length === 0 ? (
              <div className="max-w-md">
                <Badge tone="neutral" icon={<Megaphone className="size-3" aria-hidden />}>
                  No current announcements
                </Badge>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeAnnouncements.map(renderFeedCard)}
              </div>
            )}
          </div>

          {expiredAnnouncements.length > 0 && (
            <Card padded={false}>
              <button
                type="button"
                onClick={() => setShowExpired((prev) => !prev)}
                className="flex items-center gap-2 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-500 hover:text-ink-800"
                aria-expanded={showExpired}
              >
                {showExpired ? (
                  <ChevronDown className="size-3.5" aria-hidden />
                ) : (
                  <ChevronRight className="size-3.5" aria-hidden />
                )}
                Expired ({expiredAnnouncements.length})
              </button>
              {showExpired && (
                <div className="grid gap-4 border-t border-ink-100 p-5 opacity-80 md:grid-cols-2">
                  {expiredAnnouncements.map((a) => (
                    <div
                      key={a._id}
                      className="rounded-card border border-ink-100 bg-forest-50/40 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone="neutral">Expired</Badge>
                        <p className="text-xs text-ink-500">{fmtDateTime(a.createdAt)}</p>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-ink-900">
                        {a.title}
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-xs text-ink-500">
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {formOpen && (
      <AnnouncementFormDialog
        open
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onDone={(message) => {
          setFormOpen(false);
          setEditing(null);
          setNotice(message);
        }}
      />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        tone="danger"
        title="Delete announcement"
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        description={
          deleteTarget
            ? `This permanently removes "${deleteTarget.title}".`
            : undefined
        }
        onConfirm={() => {
          void (async () => {
            if (!deleteTarget) return;
            try {
              await deleteAnnouncement(deleteTarget._id).unwrap();
              setDeleteTarget(null);
              setNotice("Announcement deleted.");
            } catch (err) {
              setDeleteTarget(null);
              setBannerError(getErrorMessage(err));
            }
          })();
        }}
      />
    </div>
  );
}

function AnnouncementFormDialog({
  open,
  editing,
  onClose,
  onDone,
}: {
  open: boolean;
  editing: Announcement | null;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  // Admin-only endpoint (section 4.5); only admins reach this dialog.
  const { data: classesData, isLoading: isLoadingClasses } =
    useGetAcademicClassesQuery();
  const [createAnnouncement, { isLoading: creating }] =
    useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: updating }] =
    useUpdateAnnouncementMutation();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [content, setContent] = useState(editing?.content ?? "");
  const [audience, setAudience] = useState<AnnouncementAudience>(
    editing?.audience ?? "all",
  );
  const [academicClass, setAcademicClass] = useState(
    editing?.academicClass && typeof editing.academicClass === "object"
      ? editing.academicClass._id
      : "",
  );
  const [priority, setPriority] = useState<AnnouncementPriority>(
    editing?.priority ?? "Normal",
  );
  const [publishAt, setPublishAt] = useState(
    editing?.publishAt?.slice(0, 16) ?? "",
  );
  const [expiresAt, setExpiresAt] = useState(
    editing?.expiresAt?.slice(0, 16) ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const valid =
    title.trim() && content.trim() && (audience !== "class" || academicClass);

  const submit = (publish: boolean) => {
    void (async () => {
      setFormError(null);
      const payload: AnnouncementPayload = {
        title: title.trim(),
        content: content.trim(),
        audience,
        priority,
        isPublished: publish,
      };
      if (audience === "class" && academicClass) {
        payload.academicClass = academicClass;
      }
      if (publishAt) payload.publishAt = publishAt;
      if (expiresAt) payload.expiresAt = expiresAt;
      try {
        if (editing) {
          await updateAnnouncement({ id: editing._id, ...payload }).unwrap();
          onDone(
            publish
              ? "Announcement published — the audience has been notified in-app."
              : "Announcement updated.",
          );
        } else {
          await createAnnouncement(payload).unwrap();
          onDone(
            publish
              ? "Announcement published — the audience has been notified in-app."
              : "Announcement saved. Use Publish now to notify the audience.",
          );
        }
      } catch (err) {
        setFormError(getErrorMessage(err));
      }
    })();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Edit announcement" : "New announcement"}
      description="Publishing broadcasts in-app notifications to the selected audience."
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating || updating}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => submit(false)}
            disabled={!valid}
            loading={creating || updating}
          >
            Save as draft
          </Button>
          <Button
            onClick={() => submit(true)}
            disabled={!valid}
            loading={creating || updating}
          >
            {editing ? "Publish changes" : "Publish now"}
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
          label="Content"
          required
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Audience"
            required
            value={audience}
            onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
          >
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </SelectField>
          {audience === "class" && (
            <SelectField
              label="Academic class"
              required
              value={academicClass}
              onChange={(e) => setAcademicClass(e.target.value)}
            >
              <option value="">Select class…</option>
              {(classesData?.data ?? []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField
            label="Priority"
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Publish at"
            type="datetime-local"
            hint={publishAt ? "Scheduled for later publishing" : "Leave empty to publish when the button is pressed"}
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />
          <InputField
            label="Expires at"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          {audience === "class" && isLoadingClasses && (
            <p className="text-xs text-ink-500">Loading classes…</p>
          )}
        </div>
        {formError && (
          <Alert tone="error" title="Could not save announcement">
            {formError}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
