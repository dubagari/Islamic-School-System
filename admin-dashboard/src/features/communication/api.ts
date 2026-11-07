import { baseApi, type ApiEnvelope } from "@/app/api";

// ======================================================
// Types — API Reference sections 11.1–11.3
// ======================================================

export type UserRef = {
  _id: string;
  fullName: string;
  username?: string;
  role?: string;
  isActive?: boolean;
};

export type UnreadCount = number | { unreadCount?: number; count?: number };

// ----- Section 11.1 — Announcements -----

export type AnnouncementAudience =
  | "all"
  | "students"
  | "teachers"
  | "parents"
  | "class";

export type AnnouncementPriority = "Low" | "Normal" | "High" | "Urgent";

export type AnnouncementClassRef = {
  _id: string;
  name: string;
};

export type Announcement = {
  _id: string;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  academicClass?: AnnouncementClassRef | string | null;
  priority: AnnouncementPriority;
  publishAt?: string | null;
  expiresAt?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedBy?: UserRef | string | null;
  isRead?: boolean;
  readCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementListParams = {
  page?: number;
  limit?: number;
};

export type AnnouncementPayload = {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  academicClass?: string;
  priority: AnnouncementPriority;
  publishAt?: string;
  expiresAt?: string;
  isPublished?: boolean;
};

// ----- Section 11.2 — Messages -----

export type MessagesBox = "inbox" | "sent" | "all";

export type Message = {
  _id: string;
  sender: UserRef | string;
  recipient: UserRef | string;
  subject?: string | null;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type MessageListParams = {
  box?: MessagesBox;
  isRead?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type SendMessagePayload = {
  recipient: string;
  subject?: string;
  body: string;
};

export type ConversationEnvelope = ApiEnvelope<
  Message[] | { user?: unknown; messages?: Message[] }
>;

// ----- Section 11.3 — Notifications -----

export type NotificationType =
  | "announcement"
  | "message"
  | "fee"
  | "result"
  | "attendance"
  | "exam"
  | "system";

export type NotificationItem = {
  _id: string;
  user: UserRef | string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  actor?: UserRef | string | null;
  createdAt: string;
};

export type NotificationListParams = {
  type?: NotificationType | "";
  isRead?: boolean;
  page?: number;
  limit?: number;
};

export type BroadcastPayload = {
  title: string;
  message: string;
  type: NotificationType;
  role: string;
  userIds: string[];
};

// ======================================================
// Shared helpers
// ======================================================

const buildParams = (params?: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

export function extractUnreadCount(
  envelope: ApiEnvelope<UnreadCount> | undefined,
): number | null {
  if (!envelope?.success) return null;
  const data = envelope.data;
  if (typeof data === "number") return Number.isFinite(data) ? data : null;
  if (data && typeof data === "object") {
    if (typeof data.unreadCount === "number") return data.unreadCount;
    if (typeof data.count === "number") return data.count;
  }
  return null;
}

export function extractMessages(
  envelope: ConversationEnvelope | undefined,
): Message[] {
  const data = envelope?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.messages)) {
    return data.messages;
  }
  return [];
}

// ======================================================
// Endpoint definitions
// ======================================================

const communicationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Section 11.1 — Announcements -----
    getAnnouncements: build.query<
      ApiEnvelope<Announcement[]>,
      AnnouncementListParams | undefined
    >({
      query: (params) => ({
        url: "/announcements",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Announcements"],
    }),
    getAnnouncementUnreadCount: build.query<ApiEnvelope<UnreadCount>, void>({
      query: () => "/announcements/unread-count",
      providesTags: ["Announcements"],
    }),
    createAnnouncement: build.mutation<
      ApiEnvelope<Announcement>,
      AnnouncementPayload
    >({
      query: (body) => ({ url: "/announcements", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Announcements", "Notifications"],
    }),
    updateAnnouncement: build.mutation<
      ApiEnvelope<Announcement>,
      Partial<AnnouncementPayload> & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/announcements/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Announcements", "Notifications"],
    }),
    deleteAnnouncement: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({ url: `/announcements/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Announcements"]),
    }),
    markAnnouncementRead: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/announcements/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Announcements", "Notifications"],
    }),

    // ----- Section 11.2 — Messages -----
    getMessages: build.query<
      ApiEnvelope<Message[]>,
      MessageListParams | undefined
    >({
      query: (params) => ({
        url: "/messages",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Messages"],
    }),
    getMessagesUnreadCount: build.query<ApiEnvelope<UnreadCount>, void>({
      query: () => "/messages/unread-count",
      providesTags: ["Messages"],
    }),
    getConversation: build.query<ConversationEnvelope, string>({
      query: (userId) => `/messages/conversation/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "Messages", id: userId },
      ],
      // The thread is polled every 30 seconds via `pollingInterval` at the
      // call site (MessagesPage).
    }),
    sendMessage: build.mutation<ApiEnvelope<Message>, SendMessagePayload>({
      query: (body) => ({ url: "/messages", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error
          ? []
          : ["Messages", "Notifications", { type: "Messages", id: "LIST" }],
    }),
    markMessageRead: build.mutation<ApiEnvelope<Message>, string>({
      query: (id) => ({ url: `/messages/${id}/read`, method: "PATCH" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Messages"]),
    }),
    markAllMessagesRead: build.mutation<ApiEnvelope<unknown>, void>({
      query: () => ({ url: "/messages/read-all", method: "PATCH" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Messages"]),
    }),

    // ----- Section 11.3 — Notifications -----
    getNotifications: build.query<
      ApiEnvelope<NotificationItem[]>,
      NotificationListParams | undefined
    >({
      query: (params) => ({
        url: "/notifications",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Notifications"],
    }),
    getNotificationsUnreadCount: build.query<ApiEnvelope<UnreadCount>, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: build.mutation<ApiEnvelope<NotificationItem>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Notifications"]),
    }),
    markAllNotificationsRead: build.mutation<ApiEnvelope<unknown>, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Notifications"]),
    }),
    deleteNotification: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Notifications"]),
    }),
    broadcastNotification: build.mutation<
      ApiEnvelope<unknown>,
      BroadcastPayload
    >({
      query: (body) => ({ url: "/notifications/broadcast", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Notifications"]),
    }),
  }),
});

const {
  useGetAnnouncementsQuery,
  useGetAnnouncementUnreadCountQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useGetMessagesQuery,
  useGetMessagesUnreadCountQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkMessageReadMutation,
  useMarkAllMessagesReadMutation,
  useGetNotificationsQuery,
  useGetNotificationsUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useBroadcastNotificationMutation,
} = communicationApi;

export {
  useGetAnnouncementsQuery,
  useGetAnnouncementUnreadCountQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useGetMessagesQuery,
  useGetMessagesUnreadCountQuery,
  useGetConversationQuery,
  useSendMessageMutation,
  useMarkMessageReadMutation,
  useMarkAllMessagesReadMutation,
  useGetNotificationsQuery,
  useGetNotificationsUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useBroadcastNotificationMutation,
};
