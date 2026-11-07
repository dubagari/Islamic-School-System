import { baseApi, type ApiEnvelope } from "@/app/api";
import type { Pagination } from "@/types";

export type NameRef = { _id: string; name?: string };

export type ChildClassRef = {
  _id: string;
  name?: string;
};

export type ChildStudent = {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  registrationNumber?: string;
  status?: string;
  parentName?: string;
  parentPhone?: string;
  academicClass?: ChildClassRef | string | null;
};

export type ParentStudent = {
  _id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  registrationNumber?: string;
  status?: string;
  academicClass?: ChildClassRef | string | null;
};

export type ParentProfile = {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    username?: string;
    email?: string;
  };
  phone?: string;
  alternatePhone?: string;
  address?: string;
  students?: ParentStudent[];
};

export type ParentProfileResponse = ApiEnvelope<ParentProfile>;

export type ParentChildrenResponse = ApiEnvelope<ParentStudent[]> & {
  count?: number;
};

export type AttendanceSummary = {
  Present?: number;
  Absent?: number;
  Late?: number;
  Excused?: number;
  total?: number;
  attendanceRate?: number;
};

export type DashboardFeeSummary = {
  invoices: number;
  totalBilled: number;
  totalPaid: number;
  totalBalance: number;
};

export type DashboardResultSummary = {
  subjects: number;
  averageScore: number;
  gpa: number;
  grades?: Record<string, number>;
};

export type ParentDashboardChild = {
  student: ChildStudent;
  attendance: AttendanceSummary;
  fees: DashboardFeeSummary;
  results: DashboardResultSummary;
};

export type ParentDashboardResponse = {
  success: boolean;
  message: string;
  parent: {
    id: string;
    fullName: string;
    username: string;
    email?: string;
    phone?: string;
  };
  children: ParentDashboardChild[];
  summary: { children: number; totalOutstanding: number };
};

export type AttendanceListItem = {
  _id: string;
  date: string;
  status: string;
  remarks?: string | null;
  academicClass?: ChildClassRef | string | null;
  academicSession?: NameRef | string | null;
  academicSemester?: NameRef | string | null;
};

export type AttendanceQueryStatus = "Present" | "Absent" | "Late" | "Excused";

export type ChildAttendanceQuery = {
  from?: string;
  to?: string;
  status?: AttendanceQueryStatus;
  page?: number;
  limit?: number;
};

export type PaginatedEnvelope<T> = {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
};

export type ChildAttendanceResponse = PaginatedEnvelope<AttendanceListItem> & {
  student?: ChildStudent;
  summary: AttendanceSummary;
};

export type ClassSubjectRef = {
  _id: string;
  subject?: { _id: string; name?: string; prefix?: string } | null;
  academicClass?: ChildClassRef | string | null;
};

export type ResultListItem = {
  _id: string;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  remark?: string;
  isPublished?: boolean;
  classSubject?: ClassSubjectRef | string | null;
  academicSession?: NameRef | string | null;
  academicSemester?: NameRef | string | null;
};

export type ResultsSummary = {
  subjects: number;
  totalScore?: number;
  averageScore: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
  gradeDistribution?: Record<string, number>;
  gpa?: number;
};

export type ChildResultsQuery = {
  academicSession?: string;
  page?: number;
  limit?: number;
};

export type ChildResultsResponse = PaginatedEnvelope<ResultListItem> & {
  student?: ChildStudent;
  summary: ResultsSummary;
};

export type ReportCardQuery = {
  academicSession?: string;
};

export type ReportCardResponse = {
  success: boolean;
  message: string;
  student?: ChildStudent;
  academicSession?: NameRef | null;
  academicSemester?: NameRef | null;
  data: ResultListItem[];
  summary: ResultsSummary & {
    letterGrade?: string;
    gradePoint?: number;
    remark?: string;
    position?: number | null;
    classSize?: number;
  };
};

export type TranscriptSemester = {
  academicSemester?: NameRef | null;
  results: ResultListItem[];
  summary: { subjects: number; averageScore: number; gpa: number };
};

export type TranscriptSession = {
  academicSession?: NameRef | null;
  semesters: TranscriptSemester[];
  summary: { subjects: number; averageScore: number; gpa: number };
};

export type TranscriptQuery = {
  academicSession?: string;
};

export type TranscriptResponse = {
  success: boolean;
  message: string;
  student?: ChildStudent;
  data: TranscriptSession[];
  summary: { totalSubjects: number; averageScore: number; gpa: number };
};

export type InvoiceListItem = {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  dueDate?: string | null;
  academicSession?: NameRef | string | null;
  academicSemester?: NameRef | string | null;
  notes?: string;
};

export type PaymentListItem = {
  _id: string;
  receiptNumber?: string;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  paidAt?: string | null;
  notes?: string;
  invoice?: {
    _id?: string;
    invoiceNumber?: string;
    balance?: number;
  } | string | null;
};

export type InvoiceQueryStatus =
  | "Unpaid"
  | "Partially Paid"
  | "Paid"
  | "Overdue";

export type ChildFeeSummary = {
  invoices: number;
  unpaidInvoices?: number;
  totalBilled: number;
  totalPaid: number;
  totalBalance: number;
};

export type ChildFeesQuery = {
  academicSession?: string;
  status?: InvoiceQueryStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type ChildFeesResponse = {
  success: boolean;
  message: string;
  student?: ChildStudent;
  summary: ChildFeeSummary;
  data: InvoiceListItem[];
  payments: PaymentListItem[];
};

export type ChildInvoicesQuery = ChildFeesQuery;

export type ChildInvoicesResponse = PaginatedEnvelope<InvoiceListItem> & {
  summary?: ChildFeeSummary;
};

export type ChildPaymentsQuery = {
  academicSession?: string;
  status?: "Completed" | "Reversed";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type ChildPaymentsResponse = PaginatedEnvelope<PaymentListItem> & {
  summary?: { totalCollected?: number; completedPayments?: number };
};

export type ChildOverviewStudent = {
  id: string;
  fullName: string;
  registrationNumber?: string;
  academicClass?: ChildClassRef | string | null;
  status?: string;
  parentName?: string;
  parentPhone?: string;
};

export type StudentRecordItem = {
  _id: string;
  recordType?: string;
  title: string;
  description?: string;
  academicSession?: NameRef | string | null;
  academicSemester?: NameRef | string | null;
  academicClass?: NameRef | string | null;
  recordDate?: string;
  createdAt?: string;
};

export type ChildOverviewResponse = {
  success: boolean;
  message: string;
  student?: ChildOverviewStudent;
  attendance: { summary: AttendanceSummary; recent: AttendanceListItem[] };
  results: { summary: ResultsSummary; recent: ResultListItem[] };
  fees: {
    summary: ChildFeeSummary;
    invoices: InvoiceListItem[];
    payments: PaymentListItem[];
  };
  records?: StudentRecordItem[];
};

export type AcademicSessionItem = {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isActive?: boolean;
};

export type AcademicSessionsResponse = ApiEnvelope<AcademicSessionItem[]>;

const toParams = (
  params?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

const parentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAcademicSessions: build.query<AcademicSessionsResponse, void>({
      query: () => "/academic-sessions",
      providesTags: ["AcademicStructure"],
    }),
    getParentProfile: build.query<ParentProfileResponse, void>({
      query: () => "/parent/profile",
      providesTags: ["Parent"],
    }),
    getParentChildren: build.query<ParentChildrenResponse, void>({
      query: () => "/parent/children",
      providesTags: ["Child"],
    }),
    getParentDashboard: build.query<ParentDashboardResponse, void>({
      query: () => "/parent/dashboard",
      providesTags: ["Parent", "Child", "ChildAttendance", "ChildResults", "ChildFees"],
    }),
    getChildOverview: build.query<ChildOverviewResponse, string>({
      query: (studentId) => `/parent/children/${studentId}`,
      providesTags: (_result, _error, studentId) => [
        { type: "Child", id: studentId },
        { type: "ChildAttendance", id: studentId },
        { type: "ChildResults", id: studentId },
        { type: "ChildFees", id: studentId },
      ],
    }),
    getChildAttendance: build.query<
      ChildAttendanceResponse,
      { studentId: string; params?: ChildAttendanceQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/attendance`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildAttendance", id: studentId },
      ],
    }),
    getChildResults: build.query<
      ChildResultsResponse,
      { studentId: string; params?: ChildResultsQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/results`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildResults", id: studentId },
      ],
    }),
    getChildReportCard: build.query<
      ReportCardResponse,
      { studentId: string; params?: ReportCardQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/report-card`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildResults", id: studentId },
      ],
    }),
    getChildTranscript: build.query<
      TranscriptResponse,
      { studentId: string; params?: TranscriptQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/transcript`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildResults", id: studentId },
      ],
    }),
    getChildFees: build.query<
      ChildFeesResponse,
      { studentId: string; params?: ChildFeesQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/fees`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildFees", id: studentId },
      ],
    }),
    getChildInvoices: build.query<
      ChildInvoicesResponse,
      { studentId: string; params?: ChildInvoicesQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/invoices`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildFees", id: studentId },
      ],
    }),
    getChildPayments: build.query<
      ChildPaymentsResponse,
      { studentId: string; params?: ChildPaymentsQuery }
    >({
      query: ({ studentId, params }) => ({
        url: `/parent/children/${studentId}/payments`,
        params: toParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "ChildFees", id: studentId },
      ],
    }),
  }),
});

const {
  useGetAcademicSessionsQuery,
  useGetParentProfileQuery,
  useGetParentChildrenQuery,
  useGetParentDashboardQuery,
  useGetChildOverviewQuery,
  useGetChildAttendanceQuery,
  useGetChildResultsQuery,
  useGetChildReportCardQuery,
  useGetChildTranscriptQuery,
  useGetChildFeesQuery,
  useGetChildInvoicesQuery,
  useGetChildPaymentsQuery,
} = parentApi;

export {
  useGetAcademicSessionsQuery,
  useGetParentProfileQuery,
  useGetParentChildrenQuery,
  useGetParentDashboardQuery,
  useGetChildOverviewQuery,
  useGetChildAttendanceQuery,
  useGetChildResultsQuery,
  useGetChildReportCardQuery,
  useGetChildTranscriptQuery,
  useGetChildFeesQuery,
  useGetChildInvoicesQuery,
  useGetChildPaymentsQuery,
};

export function formatNaira(
  value: number | string | null | undefined,
): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function displayName(student:
  | {
      fullName?: string;
      firstName?: string;
      middleName?: string;
      lastName?: string;
    }
  | null
  | undefined,
): string {
  if (!student) return "—";
  const composed = [student.firstName, student.middleName, student.lastName]
    .filter((part) => typeof part === "string" && part.trim() !== "")
    .join(" ")
    .trim();
  if (student.fullName && student.fullName.trim() !== "") {
    return student.fullName;
  }
  return composed || "—";
}

export function classNameRef(
  value: ChildClassRef | string | null | undefined,
): string {
  if (!value) return "—";
  if (typeof value === "string") return value || "—";
  return value.name ?? "—";
}

export function nameRef(value: NameRef | string | null | undefined): string {
  if (!value) return "—";
  return typeof value === "string" ? value : (value.name ?? "—");
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message) || "Request failed.";
  }
  return "Request failed.";
}
