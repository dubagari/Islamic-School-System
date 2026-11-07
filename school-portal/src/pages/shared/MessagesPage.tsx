import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Inbox,
  MailQuestion,
  Send,
  SendHorizonal,
  UserRound,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";
import { EmptyState } from "@/components/ui/DataTable";
import { PagedFooter } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";

import {
  extractMessages,
  extractUnreadCount,
  getApiErrorMessage,
  useGetConversationQuery,
  useGetMessagesQuery,
  useGetMessagesUnreadCountQuery,
  useMarkAllMessagesReadMutation,
  useMarkMessageReadMutation,
  useSendMessageMutation,
  type Message,
  type UserRef,
} from "@/features/communication/api";

import { useAppSelector } from "@/app/hooks";
import { selectCurrentUser } from "@/features/auth/authSlice";

const PAGE_SIZE = 20;

type Participant = {
  _id: string;
  fullName: string;
  username?: string;
  role?: string;
  email?: string | null;
};

function refId(value: UserRef | string | null | undefined): string {
  if (!value) return "";
  return typeof value === "string" ? value : value._id;
}

function refName(value: UserRef | string | null | undefined): string {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  return value.fullName || `@${value.username ?? value._id}`;
}

function useMessageContacts(
  envelope: ReturnType<typeof useGetMessagesQuery>["data"],
  currentUserId: string,
): Participant[] {
  return useMemo(() => {
    const byId = new Map<string, Participant>();
    for (const message of extractMessages(envelope)) {
      for (const ref of [message.sender, message.recipient]) {
        const id = refId(ref);
        if (!id || id === currentUserId || byId.has(id)) continue;
        if (typeof ref === "string") continue;
        byId.set(id, {
          _id: id,
          fullName: refName(ref),
          username: ref.username,
          role: ref.role,
        });
      }
    }
    return [...byId.values()];
  }, [envelope, currentUserId]);
}

function fmtTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString();
}

type Tab = "inbox" | "sent";

export function MessagesPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const currentUserId = currentUser?._id ?? "";

  const [tab, setTab] = useState<Tab>("inbox");
  const [page, setPage] = useState(1);
  const [activeUser, setActiveUser] = useState<Participant | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useGetMessagesQuery({
    box: tab,
    page,
    limit: PAGE_SIZE,
  });
  const { data: unreadEnvelope } = useGetMessagesUnreadCountQuery();

  // There is no user directory for portal roles; new-conversation options are
  // derived from the user's own message history instead.
  const { data: historyData } = useGetMessagesQuery({
    box: "all",
    limit: 200,
  });

  const contacts = useMessageContacts(historyData, currentUserId);

  const unread = extractUnreadCount(unreadEnvelope);

  const messages = data?.data ?? [];
  const pagination = data?.pagination;

  const [markMessageRead] = useMarkMessageReadMutation();
  const [markAllMessagesRead, { isLoading: markingAll }] =
    useMarkAllMessagesReadMutation();

  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const markRead = (message: Message) => {
    if (message.isRead || tab !== "inbox" || marked.has(message._id)) return;
    const next = new Set(marked);
    next.add(message._id);
    setMarked(next);
    void markMessageRead(message._id)
      .unwrap()
      .catch(() => {
        setMarked((prev) => {
          const copy = new Set(prev);
          copy.delete(message._id);
          return copy;
        });
      });
  };

  const markAllRead = () => {
    void (async () => {
      setBannerError(null);
      try {
        await markAllMessagesRead().unwrap();
      } catch (err) {
        setBannerError(getApiErrorMessage(err, "Could not mark messages read."));
      }
    })();
  };

  const rowUser = (message: Message): Participant | null => {
    const other =
      tab === "inbox"
        ? refId(message.sender) === currentUserId
          ? message.recipient
          : message.sender
        : message.recipient;
    const id = refId(other);
    if (!id) return null;
    const contact = contacts.find((c) => c._id === id);
    if (contact) return contact;
    return {
      _id: id,
      fullName: refName(other),
    };
  };

  const openConversation = (message: Message) => {
    markRead(message);
    setActiveUser(rowUser(message));
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Direct messages between accounts."
        actions={
          unread !== null && unread > 0 ? (
            <Button
              variant="outline"
              icon={<Check className="size-4" aria-hidden />}
              loading={markingAll}
              onClick={markAllRead}
            >
              Mark all read
            </Button>
          ) : undefined
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

      {isError && (
        <Alert tone="error" title="Could not load messages" className="mb-4">
          <div className="flex items-center gap-3">
            <span>{getApiErrorMessage(error, "Request failed.")}</span>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card padded={false} className="self-start">
          <div className="flex border-b border-ink-100">
            {(
              [
                { key: "inbox" as Tab, label: "Inbox" },
                { key: "sent" as Tab, label: "Sent" },
              ]
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                aria-current={tab === t.key ? "page" : undefined}
                className={
                  "flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-forest-50 " +
                  (tab === t.key
                    ? "border-b-2 border-primary-700 text-primary-800"
                    : "text-ink-600")
                }
              >
                {t.key === "inbox" ? (
                  <Inbox className="size-4" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {t.label}
                {t.key === "inbox" && unread !== null && unread > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <ul className="max-h-[480px] overflow-y-auto">
            {isLoading && (
              <li className="space-y-2 p-4" role="status" aria-live="polite">
                <span className="sr-only">Loading messages…</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-ink-100"
                  />
                ))}
              </li>
            )}
            {!isLoading && messages.length === 0 && (
              <li className="p-4">
                <p className="text-center text-xs text-ink-500">
                  {tab === "inbox"
                    ? "Your inbox is empty."
                    : "No sent messages yet."}
                </p>
              </li>
            )}
            {messages.map((message) => {
              const other = rowUser(message);
              const selected = activeUser && other?._id === activeUser._id;
              return (
                <li key={message._id}>
                  <button
                    type="button"
                    onClick={() => openConversation(message)}
                    className={
                      "w-full border-b border-ink-100 px-4 py-3 text-left transition-colors hover:bg-forest-50 " +
                      (selected ? "bg-primary-50" : "")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink-900">
                        {tab === "inbox"
                          ? refName(message.sender)
                          : `To: ${refName(message.recipient)}`}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-500">
                        {fmtTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-700">
                      {message.subject || "(no subject)"}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {message.body}
                    </p>
                    {tab === "inbox" && !message.isRead && (
                      <span
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-700"
                        aria-label={`Unread message from ${refName(message.sender)}`}
                      >
                        <span
                          className="size-1.5 rounded-full bg-red-600"
                          aria-hidden
                        />
                        Unread
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <PagedFooter pagination={pagination} onPageChange={setPage} />
        </Card>

        <ConversationPanel
          activeUser={activeUser}
          onSetActive={setActiveUser}
          userOptions={contacts.filter((c) => c._id !== currentUserId)}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

function ConversationPanel({
  activeUser,
  onSetActive,
  userOptions,
  currentUserId,
}: {
  activeUser: Participant | null;
  onSetActive: (user: Participant | null) => void;
  userOptions: Participant[];
  currentUserId: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const { data: conversationData, isLoading: isLoadingThread } =
    useGetConversationQuery(activeUser?._id ?? "", {
      skip: !activeUser,
      pollingInterval: 30,
    });

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [markMessageRead] = useMarkMessageReadMutation();

  const thread = extractMessages(conversationData);

  // Mark received messages read when the conversation opens / refetches.
  const [markedRead, setMarkedRead] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!activeUser) return;
    for (const message of thread) {
      if (refId(message.recipient) !== currentUserId || message.isRead) continue;
      if (markedRead.has(message._id)) continue;
      const next = new Set(markedRead);
      next.add(message._id);
      setMarkedRead(next);
      void markMessageRead(message._id)
        .unwrap()
        .catch(() => {
          setMarkedRead((prev) => {
            const copy = new Set(prev);
            copy.delete(message._id);
            return copy;
          });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, activeUser, currentUserId]);

  const submit = () => {
    if (!activeUser || !body.trim()) return;
    void (async () => {
      setSendError(null);
      try {
        await sendMessage({
          recipient: activeUser._id,
          subject: subject.trim() || undefined,
          body: body.trim(),
        }).unwrap();
        setSubject("");
        setBody("");
      } catch (err) {
        setSendError(getApiErrorMessage(err, "Failed to send message."));
      }
    })();
  };

  return (
    <Card padded={false} className="flex min-h-[480px] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <div className="min-w-0">
          {activeUser ? (
            <>
              <h2 className="flex items-center gap-2 truncate text-sm font-semibold text-ink-900">
                <UserRound className="size-4 text-primary-700" aria-hidden />
                {activeUser.fullName}
              </h2>
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {activeUser.email ?? `@${activeUser.username ?? activeUser._id}`}
              </p>
            </>
          ) : (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <MailQuestion className="size-4 text-ink-400" aria-hidden />
              Select a conversation
            </h2>
          )}
        </div>
        {activeUser && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSetActive(null)}
          >
            Close
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!activeUser ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">
              Choose a conversation from the inbox or sent list to view and
              reply.
            </p>
            <SelectField
              label="Or start a new conversation"
              value=""
              onChange={(e) => {
                const selected = userOptions.find(
                  (u) => u._id === e.target.value,
                );
                if (selected) {
                  onSetActive({
                    _id: selected._id,
                    fullName: selected.fullName,
                    username: selected.username,
                    role: selected.role,
                    email: selected.email ?? null,
                  });
                }
              }}
              disabled={userOptions.length === 0}
            >
              <option value="">Select user…</option>
              {userOptions.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </SelectField>
            {userOptions.length === 0 && (
              <p className="text-xs text-ink-500">
                No other active accounts available to message.
              </p>
            )}
          </div>
        ) : isLoadingThread && thread.length === 0 ? (
          <div className="space-y-3" role="status" aria-live="polite">
            <span className="sr-only">Loading conversation…</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={
                  "h-14 w-3/4 animate-pulse rounded-xl bg-ink-100 " +
                  (i % 2 ? "ml-auto" : "")
                }
              />
            ))}
          </div>
        ) : thread.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description="Send the first message to start this conversation."
          />
        ) : (
          <ul className="space-y-3">
            {thread.map((message) => {
              const mine = refId(message.sender) === currentUserId;
              return (
                <li
                  key={message._id}
                  className={mine ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-card " +
                      (mine
                        ? "rounded-br-md bg-primary-700 text-white"
                        : "rounded-bl-md bg-ink-100 text-ink-900")
                    }
                  >
                    {message.subject && (
                      <p
                        className={
                          "mb-1 text-xs font-medium " +
                          (mine ? "text-primary-50" : "text-ink-500")
                        }
                      >
                        {message.subject}
                      </p>
                    )}
                    <p className="whitespace-pre-line">{message.body}</p>
                    <p
                      className={
                        "mt-1 text-[10px] " +
                        (mine ? "text-primary-50/70" : "text-ink-400")
                      }
                    >
                      {fmtTime(message.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {activeUser && (
        <div className="border-t border-ink-100 px-4 py-4">
          <div className="space-y-3">
            <InputField
              label="Subject"
              value={subject}
              placeholder="Optional subject"
              onChange={(e) => setSubject(e.target.value)}
            />
            <TextareaField
              label="Message"
              required
              rows={3}
              value={body}
              placeholder="Write a message…"
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                icon={<SendHorizonal className="size-4" aria-hidden />}
                disabled={!body.trim()}
                loading={sending}
                onClick={submit}
              >
                Send
              </Button>
            </div>
            {sendError && (
              <Alert tone="error" title="Failed to send">
                {sendError}
              </Alert>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
