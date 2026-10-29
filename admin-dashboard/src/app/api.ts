import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import type { ApiErrorPayload, Pagination, User } from "@/types";
import {
  logout,
  setCredentials,
  updatePasswordFlags,
} from "@/features/auth/authSlice";
import type { LoginResponse } from "@/features/auth/authSlice";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV
    ? "http://localhost:5000/api/v2"
    : "https://islamic-school-system.onrender.com/api/v2");

export function assetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL.replace(/\/api\/v2\/?$/, "")}${path}`;
}

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
};

/**
 * Raw (non-RTK-Query) API helper for imperative calls such as form
 * submissions outside of RTK Query subscriptions.
 */
export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    signal,
  }: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<ApiEnvelope<T>> {
  let token: string | null = null;

  try {
    token = (JSON.parse(localStorage.getItem("dums.auth") ?? "") as
      | { token?: string }
      | null)?.token ?? localStorage.getItem("dums.token");
  } catch {
    token = localStorage.getItem("dums.token");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | ApiEnvelope<T>
    | (ApiErrorPayload & Record<string, unknown>);

  if (!response.ok || payload.success !== true) {
    const err = payload as ApiErrorPayload;
    const error = new Error(err.message ?? "Request failed");
    const apiError = Object.assign(error, {
      status: response.status,
      code: err.code,
      fieldErrors: err.errors?.reduce(
        (acc, e) => {
          acc[e.field] = e.message;
          return acc;
        },
        {} as Record<string, string>,
      ),
    });
    throw apiError;
  }

  return payload;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "omit",
  prepareHeaders: (headers) => {
    let token: string | null = null;

    try {
      const parsed = JSON.parse(
        localStorage.getItem("dums.auth") ?? "",
      ) as { token?: string } | null;
      token = parsed?.token ?? null;
    } catch {
      token = null;
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === "PARSING_ERROR") {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: "The API returned a non-JSON response.",
        data: {
          success: false,
          message:
            "The API returned an unexpected HTML response. Make sure the backend is running and up to date.",
        },
      },
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  extractRehydrationInfo: (action, { reducerPath }) => {
    if (action.type === "HYDRATE") {
      return (action.payload as Record<string, unknown>)[reducerPath] as never;
    }

    return undefined;
  },
  tagTypes: [
    "Auth",
    "User",
    "Users",
    "Admissions",
    "Admission",
    "SchoolSettings",
    "Teachers",
    "Students",
    "Enrollments",
    "StudentRecords",
    "AcademicStructure",
    "ClassSubjects",
    "TeacherAssignments",
    "Attendance",
    "TeacherAttendance",
    "Assessments",
    "CBT",
    "Scores",
    "Results",
    "FeeStructures",
    "Invoices",
    "Payments",
    "Finance",
    "Parents",
    "Announcements",
    "Notifications",
    "Messages",
    "Reports",
    "AuditLogs",
    "System",
  ],
  endpoints: (build) => ({
    login: build.mutation<ApiEnvelope<LoginResponse>, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const user = data.data.user as User;

          if (user.role !== "admin") {
            dispatch(logout());
            return;
          }

          dispatch(
            setCredentials({
              user,
              token: data.data.token,
            }),
          );
          dispatch(baseApi.util.invalidateTags(["Auth"]));
        } catch {
          // handled by component
        }
      },
    }),
    changePassword: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(updatePasswordFlags(false));
          dispatch(
            baseApi.util.updateQueryData(
              "selfProfile",
              undefined,
              (draft) => {
                if (draft.data) {
                  draft.data.mustChangePassword = false;
                }
              },
            ),
          );
        } catch {
          // handled by component
        }
      },
    }),
    logout: build.mutation<ApiEnvelope<Record<string, unknown>>, void>({
      queryFn: () => ({ data: { success: true, message: "Logged out", data: {} } }),
      async onQueryStarted(_arg, { dispatch }) {
        // Stateless JWT: clear local credentials and cached data.
        dispatch(logout());
        dispatch(baseApi.util.resetApiState());
        localStorage.removeItem("dums.token");
      },
    }),
    selfProfile: build.query<ApiEnvelope<User>, void>({
      query: () => "/auth/profile",
      providesTags: ["Auth"],
    }),
  }),
});

export type LoginPayload = {
  identifier: string;
  password: string;
};

const {
  useLoginMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useSelfProfileQuery,
} = baseApi;

export { useLoginMutation, useChangePasswordMutation, useLogoutMutation, useSelfProfileQuery };
