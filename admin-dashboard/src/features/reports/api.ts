import { baseApi, type ApiEnvelope } from "@/app/api";

/*
 * Reports endpoints (API_REFERENCE.md section 12) — Admin only.
 *
 * The reference documents paths and filter names but not response shapes,
 * so report payloads are typed `unknown` and pages render only what the
 * API actually returns (placeholder "—" when a value is absent).
 */

export type EnrollmentReportParams = {
  academicSession?: string;
  academicClass?: string;
  academicLevel?: string;
  status?: string;
  groupBy?: "class" | "level" | "gender" | "status";
};

export type AttendanceReportParams = {
  from?: string;
  to?: string;
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  student?: string;
  status?: string;
  groupBy?: "day" | "class" | "student" | "status";
};

export type AcademicsReportParams = {
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  classSubject?: string;
  includeUnpublished?: boolean;
};

export type FinanceReportParams = {
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  from?: string;
  to?: string;
  groupBy?: "day" | "month" | "method";
};

function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardReport: build.query<ApiEnvelope<unknown>, void>({
      query: () => "/reports/dashboard",
      providesTags: ["Reports"],
    }),
    getEnrollmentReport: build.query<ApiEnvelope<unknown>, EnrollmentReportParams>({
      query: (params) => `/reports/enrollment${toQueryString(params)}`,
      providesTags: ["Reports"],
    }),
    getAttendanceReport: build.query<ApiEnvelope<unknown>, AttendanceReportParams>({
      query: (params) => `/reports/attendance${toQueryString(params)}`,
      providesTags: ["Reports"],
    }),
    getAcademicsReport: build.query<ApiEnvelope<unknown>, AcademicsReportParams>({
      query: (params) => `/reports/academics${toQueryString(params)}`,
      providesTags: ["Reports"],
    }),
    getFinanceReport: build.query<ApiEnvelope<unknown>, FinanceReportParams>({
      query: (params) => `/reports/finance${toQueryString(params)}`,
      providesTags: ["Reports"],
    }),

    // Lookup lists used to drive documented report filters (section 4).
    listReportSessions: build.query<ApiEnvelope<unknown>, void>({
      query: () => "/academic-sessions",
    }),
    listReportSemesters: build.query<ApiEnvelope<unknown>, void>({
      query: () => "/academic-semesters",
    }),
    listReportLevels: build.query<ApiEnvelope<unknown>, void>({
      query: () => "/academic-levels",
    }),
    listReportClasses: build.query<ApiEnvelope<unknown>, void>({
      query: () => "/academic-classes",
    }),
  }),
});

const {
  useGetDashboardReportQuery,
  useGetEnrollmentReportQuery,
  useGetAttendanceReportQuery,
  useGetAcademicsReportQuery,
  useGetFinanceReportQuery,
  useListReportSessionsQuery,
  useListReportSemestersQuery,
  useListReportLevelsQuery,
  useListReportClassesQuery,
} = reportsApi;

export {
  useGetDashboardReportQuery,
  useGetEnrollmentReportQuery,
  useGetAttendanceReportQuery,
  useGetAcademicsReportQuery,
  useGetFinanceReportQuery,
  useListReportSessionsQuery,
  useListReportSemestersQuery,
  useListReportLevelsQuery,
  useListReportClassesQuery,
};

/* ------------------------------------------------------------------ */
/* Shared tolerant-data helpers (API response shapes are undocumented) */
/* ------------------------------------------------------------------ */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getApiErrorMessage(error: unknown): string {
  if (isRecord(error)) {
    const data = error.data;
    if (isRecord(data) && typeof data.message === "string" && data.message) {
      return data.message;
    }
    if (typeof error.message === "string" && error.message) {
      return error.message;
    }
    if (typeof error.error === "string" && error.error) {
      return error.error;
    }
  }

  return "Something went wrong while loading the report.";
}

/** First finite number found on a key matching one of the patterns. */
export function pickNumber(
  root: unknown,
  patterns: RegExp[],
  depth = 3,
): number | null {
  if (depth < 0) return null;

  if (Array.isArray(root)) {
    for (const item of root) {
      const found = pickNumber(item, patterns, depth - 1);
      if (found !== null) return found;
    }
    return null;
  }

  if (!isRecord(root)) return null;

  for (const [key, value] of Object.entries(root)) {
    if (!patterns.some((pattern) => pattern.test(key))) continue;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (value.trim() !== "" && Number.isFinite(parsed)) return parsed;
    }
  }

  for (const value of Object.values(root)) {
    if (isRecord(value) || Array.isArray(value)) {
      const found = pickNumber(value, patterns, depth - 1);
      if (found !== null) return found;
    }
  }

  return null;
}

export type AdmissionBreakdown = {
  pending: number | null;
  approved: number | null;
  rejected: number | null;
};

/** Object with pending/approved/rejected counts somewhere in the payload. */
export function findAdmissionsBreakdown(
  root: unknown,
  depth = 3,
): AdmissionBreakdown | null {
  if (depth < 0) return null;

  const candidates: Record<string, unknown>[] = [];
  if (isRecord(root)) candidates.push(root);
  if (isRecord(root)) {
    for (const value of Object.values(root)) {
      if (isRecord(value)) candidates.push(value);
    }
  }

  for (const record of candidates) {
    let pending: number | null = null;
    let approved: number | null = null;
    let rejected: number | null = null;

    for (const [key, value] of Object.entries(record)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      if (/^pending\w*$/i.test(key)) pending = value;
      else if (/^approved\w*$/i.test(key)) approved = value;
      else if (/^rejected\w*$/i.test(key)) rejected = value;
    }

    if (pending !== null || approved !== null || rejected !== null) {
      return { pending, approved, rejected };
    }
  }

  if (isRecord(root)) {
    for (const value of Object.values(root)) {
      if (isRecord(value)) {
        const nested = findAdmissionsBreakdown(value, depth - 1);
        if (nested) return nested;
      }
    }
  }

  return null;
}

/** First array of plain records under a key matching the given patterns. */
export function findRecordArray(
  root: unknown,
  keyPatterns: RegExp[],
): Record<string, unknown>[] | null {
  if (!isRecord(root)) return null;

  for (const [key, value] of Object.entries(root)) {
    if (
      Array.isArray(value) &&
      value.some(isRecord) &&
      keyPatterns.some((pattern) => pattern.test(key))
    ) {
      return value.filter(isRecord);
    }
  }

  for (const value of Object.values(root)) {
    if (isRecord(value)) {
      const nested = findRecordArray(value, keyPatterns);
      if (nested) return nested;
    }
  }

  return null;
}

export type ReportRows = {
  rows: Record<string, unknown>[];
  /** Scalar summary fields that accompany grouped rows, if any. */
  summary: Record<string, unknown>;
};

/**
 * Normalizes a report payload into rows. Handles a plain array, an object
 * with `rows`/`groups`/`items`/`data` arrays, or a scalar summary record.
 */
export function extractReportRows(payload: unknown): ReportRows {
  const summary: Record<string, unknown> = {};

  if (Array.isArray(payload)) {
    return { rows: payload.filter(isRecord), summary };
  }

  if (!isRecord(payload)) return { rows: [], summary };

  for (const key of ["rows", "groups", "items", "results", "data", "breakdown"]) {
    const value = payload[key];
    if (Array.isArray(value) && value.some(isRecord)) {
      return { rows: value.filter(isRecord), summary };
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.some(isRecord)) {
      return { rows: value.filter(isRecord), summary };
    }
  }

  for (const [key, value] of Object.entries(payload)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      summary[key] = value;
    }
  }

  return { rows: Object.keys(summary).length > 0 ? [summary] : [], summary };
}

export type ListOption = { id: string; label: string };

/** Normalizes an academic-setup list payload into select options. */
export function extractListOptions(payload: unknown): ListOption[] {
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (isRecord(payload)) {
    for (const key of ["rows", "items", "docs", "data", "sections", "levels", "sessions", "semesters", "classes"]) {
      const value = payload[key];
      if (Array.isArray(value)) {
        items = value;
        break;
      }
    }
    if (items.length === 0) {
      const firstArray = Object.values(payload).find((value) =>
        Array.isArray(value),
      );
      if (Array.isArray(firstArray)) items = firstArray;
    }
  }

  return items
    .filter(isRecord)
    .map((item) => {
      const id =
        (typeof item._id === "string" && item._id) ||
        (typeof item.id === "string" && item.id) ||
        "";
      const labelValue =
        item.name ?? item.title ?? item.label ?? item.code ?? item.year ?? id;
      return { id, label: String(labelValue) };
    })
    .filter((option) => option.id !== "");
}

export function formatStatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatPercentValue(value: number): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}\u00A0%`;
}

export function prettifyKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Renders a report cell as display text based on key/value semantics. */
export function formatCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  if (/rate|percent|percentage|%/i.test(key)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return formatPercentValue(value);
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (value.trim() !== "" && Number.isFinite(parsed)) {
        return formatPercentValue(parsed);
      }
    }
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    if (Number.isFinite(value)) return value.toLocaleString();
    return "—";
  }

  if (typeof value === "string") {
    if (value.trim() === "") return "—";
    if (/date|At$|^At/i.test(key)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
    return value;
  }

  if (Array.isArray(value)) return `[${value.length}]`;

  if (isRecord(value)) {
    if (typeof value.name === "string" && value.name) return value.name;
    if (typeof value.full === "string" && value.full) return value.full;
    if (typeof value.label === "string" && value.label) return value.label;
    return "—";
  }

  return "—";
}
