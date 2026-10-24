import { baseApi, type ApiEnvelope } from "@/app/api";

export type NamedRef = {
  _id: string;
  name?: string;
};

export type ClassRef = {
  _id: string;
  name?: string;
  academicLevel?: NamedRef | string | null;
};

export type SessionRef = NamedRef & {
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
};

export type SemesterRef = NamedRef & {
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  academicSession?: string | NamedRef | null;
};

export type StudentIdRef = {
  id: string;
  fullName?: string;
  registrationNumber?: string;
  academicClass?: ClassRef | string | null;
};

export type StudentUserRef = {
  _id: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
};

export type StudentProfile = {
  _id: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  applicationNumber?: string;
  registrationNumber?: string;
  currentLevel?: string;
  academicClass?: ClassRef | string | null;
  status?: string;
  paymentStatus?: string;
  isActive?: boolean;
  user?: StudentUserRef | null;
  createdAt?: string;
};

export type StudentDashboardData = {
  student: {
    id: string;
    fullName?: string;
    registrationNumber?: string;
    applicationNumber?: string;
    currentLevel?: string;
    academicClass?: ClassRef | string | null;
    status?: string;
    paymentStatus?: string;
    isActive?: boolean;
  };
  account: {
    username?: string;
    email?: string;
    role?: string;
    mustChangePassword?: boolean;
  };
};

export type AttendanceStatusCounts = {
  Present: number;
  Absent: number;
  Late: number;
  Excused: number;
  total: number;
  attendanceRate: number;
};

export type AttendanceRecord = {
  _id: string;
  date?: string;
  status?: string;
  remarks?: string;
  recordedBy?: NamedRef | string | null;
  createdAt?: string;
};

export type AttendanceListParams = {
  studentId: string;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type AttendanceListEnvelope = ApiEnvelope<AttendanceRecord[]> & {
  student?: StudentIdRef;
  summary?: AttendanceStatusCounts;
};

export type ResultBreakdownEntry = {
  name?: string;
  type?: string;
  score?: number | null;
  maxScore?: number;
  weight?: number;
  percentage?: number | null;
};

export type ResultClassSubjectRef = NamedRef & {
  courseCode?: string;
  subject?: (NamedRef & { prefix?: string }) | string | null;
  academicClass?: ClassRef | string | null;
};

export type ResultRecord = {
  _id: string;
  student?: NamedRef | string;
  classSubject?: ResultClassSubjectRef | string | null;
  academicSession?: SessionRef | string | null;
  academicSemester?: SemesterRef | string | null;
  breakdown?: ResultBreakdownEntry[];
  totalScore?: number;
  letterGrade?: string;
  gradePoint?: number;
  remark?: string;
  isPublished?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
};

export type ResultSummary = {
  subjects?: number;
  totalScore?: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
  gradeDistribution?: Partial<Record<"A" | "B" | "C" | "D" | "E" | "F", number>>;
  gpa?: number;
};

export type ResultsListParams = {
  studentId: string;
  academicSession?: string;
  academicSemester?: string;
  page?: number;
  limit?: number;
};

export type ResultsListEnvelope = ApiEnvelope<ResultRecord[]> & {
  student?: StudentIdRef;
  summary?: ResultSummary;
};

export type ReportCardSummary = ResultSummary & {
  letterGrade?: string;
  gradePoint?: number;
  remark?: string;
  position?: number | null;
  classSize?: number;
};

export type ReportCardEnvelope = ApiEnvelope<ResultRecord[]> & {
  student?: StudentIdRef;
  academicSession?: SessionRef | null;
  academicSemester?: SemesterRef | null;
  summary?: ReportCardSummary;
};

export type TranscriptSemesterGroup = {
  academicSemester?: SemesterRef | string | null;
  results?: ResultRecord[];
  summary?: {
    subjects?: number;
    averageScore?: number;
    gpa?: number;
  };
};

export type TranscriptSessionGroup = {
  academicSession?: SessionRef | string | null;
  semesters?: TranscriptSemesterGroup[];
  summary?: {
    subjects?: number;
    averageScore?: number;
    gpa?: number;
  };
};

export type TranscriptEnvelope = ApiEnvelope<TranscriptSessionGroup[]> & {
  student?: StudentIdRef;
  summary?: {
    totalSubjects?: number;
    averageScore?: number;
    gpa?: number;
  };
};

export type InvoiceStatus =
  | "Unpaid"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export type InvoiceItem = {
  _id?: string;
  feeStructure?: string | null;
  name?: string;
  description?: string;
  amount?: number;
};

export type InvoiceRecord = {
  _id: string;
  invoiceNumber: string;
  student?:
    | (NamedRef & {
        firstName?: string;
        middleName?: string;
        lastName?: string;
        academicClass?: ClassRef | string | null;
      })
    | string
    | null;
  academicClass?: ClassRef | string | null;
  academicSession?: SessionRef | string | null;
  academicSemester?: SemesterRef | string | null;
  items?: InvoiceItem[];
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  status?: InvoiceStatus | string;
  dueDate?: string | null;
  notes?: string;
  issuedBy?: NamedRef | string | null;
  createdAt?: string;
};

export type PaymentRecord = {
  _id: string;
  receiptNumber?: string;
  invoice?:
    | (NamedRef & {
        invoiceNumber?: string;
        totalAmount?: number;
        amountPaid?: number;
        balance?: number;
        status?: string;
        dueDate?: string | null;
      })
    | string
    | null;
  amount?: number;
  method?: string;
  reference?: string;
  paidAt?: string;
  status?: "Completed" | "Reversed" | string;
  notes?: string;
  reversalReason?: string;
  recordedBy?: NamedRef | string | null;
  reversedAt?: string | null;
  createdAt?: string;
};

export type InvoiceListParams = {
  status?: string;
  page?: number;
  limit?: number;
};

export type InvoiceListEnvelope = ApiEnvelope<InvoiceRecord[]> & {
  summary?: {
    totalBilled?: number;
    totalPaid?: number;
    totalBalance?: number;
    invoices?: number;
  };
};

export type InvoiceDetailEnvelope = ApiEnvelope<InvoiceRecord> & {
  payments?: PaymentRecord[];
};

export type FeeSummary = {
  invoices?: number;
  unpaidInvoices?: number;
  totalBilled?: number;
  totalPaid?: number;
  totalBalance?: number;
};

export type FeeSummaryEnvelope = ApiEnvelope<InvoiceRecord[]> & {
  student?: StudentIdRef;
  summary?: FeeSummary;
  payments?: PaymentRecord[];
};

export type PaymentsParams = {
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type PaymentsListEnvelope = ApiEnvelope<PaymentRecord[]> & {
  summary?: {
    totalCollected?: number;
    completedPayments?: number;
  };
};

export type AcademicSessionRecord = NamedRef & {
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isActive?: boolean;
};

export type ListQueryArgs = {
  page?: number;
  limit?: number;
};

const buildParams = (params?: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

const studentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStudentDashboard: build.query<ApiEnvelope<StudentDashboardData>, void>({
      query: () => "/students/dashboard",
      providesTags: ["Student"],
    }),
    getStudentProfile: build.query<ApiEnvelope<StudentProfile>, void>({
      query: () => "/students/profile",
      providesTags: ["Student"],
    }),
    getStudentAttendance: build.query<
      AttendanceListEnvelope,
      AttendanceListParams
    >({
      query: ({ studentId, ...params }) => ({
        url: `/attendance/student/${studentId}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: ["Attendance"],
      keepUnusedDataFor: 30,
    }),
    getStudentResults: build.query<ResultsListEnvelope, ResultsListParams>({
      query: ({ studentId, ...params }) => ({
        url: `/results/student/${studentId}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: ["StudentResult"],
      keepUnusedDataFor: 60,
    }),
    getStudentReportCard: build.query<
      ReportCardEnvelope,
      Omit<ResultsListParams, "page" | "limit">
    >({
      query: ({ studentId, ...params }) => ({
        url: `/results/report-card/${studentId}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: ["StudentResult"],
      keepUnusedDataFor: 60,
    }),
    getStudentTranscript: build.query<
      TranscriptEnvelope,
      { studentId: string; academicSession?: string }
    >({
      query: ({ studentId, ...params }) => ({
        url: `/results/transcript/${studentId}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: ["StudentResult"],
      keepUnusedDataFor: 60,
    }),
    getInvoices: build.query<InvoiceListEnvelope, InvoiceListParams | undefined>({
      query: (params) => ({
        url: "/invoices",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Invoice"],
    }),
    getInvoiceById: build.query<InvoiceDetailEnvelope, string>({
      query: (invoiceId) => `/invoices/${invoiceId}`,
      providesTags: (_result, _error, invoiceId) => [
        { type: "Invoice", id: invoiceId },
      ],
    }),
    getStudentFeeSummary: build.query<
      FeeSummaryEnvelope,
      { studentId: string; academicSession?: string; academicSemester?: string }
    >({
      query: ({ studentId, ...params }) => ({
        url: `/invoices/student/${studentId}/summary`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: ["Invoice", "Payment"],
      keepUnusedDataFor: 30,
    }),
    getStudentPayments: build.query<PaymentsListEnvelope, PaymentsParams | undefined>({
      query: (params) => ({
        url: "/payments",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Payment"],
    }),
    getAcademicSessions: build.query<
      ApiEnvelope<AcademicSessionRecord[]>,
      void
    >({
      query: () => "/academic-sessions",
    }),
  }),
});

const {
  useGetStudentDashboardQuery,
  useGetStudentProfileQuery,
  useGetStudentAttendanceQuery,
  useGetStudentResultsQuery,
  useGetStudentReportCardQuery,
  useGetStudentTranscriptQuery,
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetStudentFeeSummaryQuery,
  useGetStudentPaymentsQuery,
  useGetAcademicSessionsQuery,
} = studentApi;

export {
  useGetStudentDashboardQuery,
  useGetStudentProfileQuery,
  useGetStudentAttendanceQuery,
  useGetStudentResultsQuery,
  useGetStudentReportCardQuery,
  useGetStudentTranscriptQuery,
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetStudentFeeSummaryQuery,
  useGetStudentPaymentsQuery,
  useGetAcademicSessionsQuery,
};

export function refId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && "_id" in ref) {
    const id = (ref as { _id: unknown })._id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

export function refName(ref: unknown): string | null {
  if (!ref || typeof ref !== "object") return null;
  if ("name" in ref) {
    const name = (ref as { name: unknown }).name;
    return typeof name === "string" && name ? name : null;
  }
  return null;
}

export function extractErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data
  ) {
    const message = (error.data as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (
    error &&
    typeof error === "object" &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "string"
  ) {
    return (error as { error: string }).error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Request failed.";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNaira(value: number | null | undefined): string {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return "—";
  }
  return `₦${value.toLocaleString()}`;
}

export function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}

export type BadgeToneValue =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold";

export function gradeTone(letterGrade: string | undefined): BadgeToneValue {
  switch ((letterGrade ?? "").trim().toUpperCase()) {
    case "A":
      return "success";
    case "B":
      return "info";
    case "C":
      return "gold";
    case "D":
      return "warning";
    case "F":
      return "danger";
    default:
      return "neutral";
  }
}
