import { baseApi, type ApiEnvelope } from "@/app/api";
import type { UserRef } from "@/features/communication/api";

// ======================================================
// Types — API Reference sections 13.2–13.4 (+ /health)
// ======================================================

// ----- Section 13.2 — System settings -----

export type SettingValue = string | number | boolean | Record<string, unknown>;

export type Setting = {
  key: string;
  value: SettingValue;
  category?: string | null;
  description?: string | null;
  isPublic: boolean;
  updatedBy?: UserRef | string | null;
  updatedAt?: string;
  createdAt?: string;
};

export type PutSettingPayload = {
  key: string;
  body: {
    value: SettingValue;
    category?: string;
    description?: string;
    isPublic?: boolean;
  };
};

// ----- Section 13.3 — System maintenance -----

export type SystemInfoData = Record<string, unknown>;

export type SystemDatabaseData = Record<string, unknown>;

export type SyncIndexesData = Record<string, unknown>;

export type HealthData = {
  status?: string;
  env?: string;
  environment?: string;
  timestamp?: string;
} & Record<string, unknown>;

// ----- Section 13.4 — Audit logs -----

export type AuditLog = {
  _id: string;
  user?: UserRef | string | null;
  role?: string | null;
  method: string;
  path: string;
  statusCode?: number | null;
  success: boolean;
  ip?: string | null;
  userAgent?: string | null;
  requestBody?: unknown;
  createdAt: string;
};

export type AuditListParams = {
  user?: string;
  role?: string;
  method?: string;
  path?: string;
  success?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

// ======================================================
// Shared helpers
// ======================================================

/** Public API root (e.g. http://localhost:5000) derived from the v2 base URL. */
const API_ROOT = ((import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:5000/api/v2").replace(/\/api\/v2\/?$/, "");

const buildParams = (params?: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

// ======================================================
// Endpoint definitions
// ======================================================

const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Section 13.2 — Settings (Admin) -----
    getSettings: build.query<ApiEnvelope<Setting[]>, void>({
      query: () => "/settings",
      providesTags: ["SchoolSettings"],
    }),
    putSetting: build.mutation<ApiEnvelope<Setting>, PutSettingPayload>({
      query: ({ key, body }) => ({
        url: `/settings/${key}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["SchoolSettings"]),
    }),
    deleteSetting: build.mutation<ApiEnvelope<unknown>, string>({
      query: (key) => ({ url: `/settings/${key}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["SchoolSettings"]),
    }),

    // ----- Section 13.3 — System (Admin) -----
    getSystemInfo: build.query<ApiEnvelope<SystemInfoData>, void>({
      query: () => "/system/info",
      providesTags: ["System"],
    }),
    getSystemDatabase: build.query<ApiEnvelope<SystemDatabaseData>, void>({
      query: () => "/system/database",
      providesTags: ["System"],
    }),
    syncIndexes: build.mutation<ApiEnvelope<SyncIndexesData>, void>({
      query: () => ({ url: "/system/sync-indexes", method: "POST" }),
      invalidatesTags: (_result, error) => (error ? [] : ["System"]),
    }),

    // ----- Section 13.4 — Audit logs (Admin) -----
    getAuditLogs: build.query<ApiEnvelope<AuditLog[]>, AuditListParams | void>({
      query: (params) => ({
        url: "/audit-logs",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["AuditLogs"],
    }),
    getAuditLog: build.query<ApiEnvelope<AuditLog>, string>({
      query: (id) => `/audit-logs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AuditLogs", id }],
    }),

    // ----- Section 2 — Health (public, lives at the API root) -----
    getHealth: build.query<ApiEnvelope<HealthData> | HealthData, void>({
      query: () => `${API_ROOT}/health`,
      providesTags: ["System"],
    }),
  }),
});

const {
  useGetSettingsQuery,
  usePutSettingMutation,
  useDeleteSettingMutation,
  useGetSystemInfoQuery,
  useGetSystemDatabaseQuery,
  useSyncIndexesMutation,
  useGetAuditLogsQuery,
  useGetAuditLogQuery,
  useGetHealthQuery,
} = adminApi;

export {
  useGetSettingsQuery,
  usePutSettingMutation,
  useDeleteSettingMutation,
  useGetSystemInfoQuery,
  useGetSystemDatabaseQuery,
  useSyncIndexesMutation,
  useGetAuditLogsQuery,
  useGetAuditLogQuery,
  useGetHealthQuery,
};
