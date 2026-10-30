import { baseApi, type ApiEnvelope } from "@/app/api";

// ======================================================
// Types — v2 API (teachers, assignments, attendance,
// assessments, scores, results)
// ======================================================

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Excused"
  | "Leave";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
];

export type RefName = { _id: string; name: string };

export type SubjectRef = RefName & { code?: string };

export type AcademicClassRef = RefName & {
  academicLevel?: RefName | string;
};

export type AcademicSessionRef = RefName & {
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

export type AcademicSemesterRef = RefName & {
  academicSession?: AcademicSessionRef | string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
};

export type UserRefLite = RefName & {
  username?: string;
  email?: string;
  role?: string;
};

export type StudentRefLite = {
  _id: string;
  fullName: string;
  admissionNumber?: string;
  className?: string;
};

// ----- Dashboard / profile -----

export type TeacherDashboardData = {
  teacher: {
    id: string;
    teacherNumber?: string;
    fullName: string;
    specialization?: string;
    employmentType?: string;
    status?: string;
    isActive?: boolean;
  };
  account: {
    username: string;
    email?: string;
    role: string;
    mustChangePassword: boolean;
  };
};

export type TeacherProfile = {
  _id: string;
  teacherNumber?: string;
  fullName?: string;
  specialization?: string;
  employmentType?: string;
  status?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
};

// ----- Assignments -----

export type TeacherAssignment = {
  _id: string;
  classSubject?: {
    _id: string;
    subject: SubjectRef | string;
    academicClass: AcademicClassRef | string;
    academicSemester: AcademicSemesterRef | string;
    courseCode?: string;
    description?: string;
  };
  assignedBy?: UserRefLite | string;
  assignedDate?: string;
};

export type MyClassRow = {
  assignmentId: string;
  class: AcademicClassRef;
  subject: SubjectRef;
  semester: AcademicSemesterRef;
  courseCode?: string;
  description?: string;
  assignedDate?: string;
};

// ----- Attendance -----

export type AttendanceCountsSummary = {
  Present?: number;
  Absent?: number;
  Late?: number;
  Excused?: number;
  Leave?: number;
  present?: number;
  absent?: number;
  late?: number;
  excused?: number;
  leave?: number;
  total?: number;
  attendanceRate?: number;
};

export type TeacherAttendanceSummary = {
  Present: number;
  Absent: number;
  Late: number;
  Excused: number;
  Leave: number;
  total: number;
  attendanceRate: number;
};

export type AttendanceRecord = {
  _id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  student: StudentRefLite | string;
  academicClass?: AcademicClassRef | string;
  academicSession?: AcademicSessionRef | string;
  academicSemester?: AcademicSemesterRef | string;
  recordedBy?: UserRefLite | string | null;
  createdAt?: string;
};

export type StudentAttendanceSummary = {
  student: StudentRefLite | string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  leave?: number;
  total: number;
  attendanceRate: number;
};

export type AttendanceListEnvelope = ApiEnvelope<AttendanceRecord[]> & {
  summary?: AttendanceCountsSummary;
};

export type TeacherAttendanceListEnvelope = ApiEnvelope<
  AttendanceRecord[]
> & {
  summary?: TeacherAttendanceSummary;
};

export type StudentSummaryEnvelope = ApiEnvelope<
  StudentAttendanceSummary[]
> & {
  summary?: AttendanceCountsSummary;
};

export type BulkAttendanceRecordInput = {
  student: string;
  status?: AttendanceStatus;
  remarks?: string;
};

export type BulkAttendancePayload = {
  academicClass: string;
  academicSession?: string;
  academicSemester?: string;
  date: string;
  records: BulkAttendanceRecordInput[];
};

export type BulkAttendanceResponse = {
  date?: string;
  records?: AttendanceRecord[];
  summary?: AttendanceCountsSummary;
};

export type UpdateAttendancePayload = {
  id: string;
  status?: AttendanceStatus;
  remarks?: string;
};

// ----- Assessments & scores -----

export type Assessment = {
  _id: string;
  name: string;
  type: string;
  maxScore: number;
  weight: number;
  dueDate?: string | null;
  classSubject?: string | (TeacherAssignment["classSubject"] & RefName);
  academicSession?: string | AcademicSessionRef;
  academicSemester?: string | AcademicSemesterRef;
  isActive: boolean;
  createdAt: string;
};

export type AssessmentListParams = {
  classSubject?: string;
  academicSession?: string;
  academicSemester?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type AssessmentPayload = {
  classSubject: string;
  name?: string;
  academicSession?: string;
  academicSemester?: string;
  type: string;
  maxScore: number;
  weight?: number;
  dueDate?: string;
  isActive?: boolean;
};

export type ScoreEntry = {
  _id: string;
  student: StudentRefLite | string;
  score: number;
  remarks?: string | null;
};

export type AssessmentScoresData = {
  assessment: Assessment;
  scores: ScoreEntry[];
  statistics: {
    count: number;
    average: number;
    highest: number;
    lowest: number;
  };
};

export type BulkScoresPayload = {
  records: { student: string; score: number; remarks?: string }[];
};

export type UpdateScorePayload = {
  id: string;
  score?: number;
  remarks?: string;
};

// ----- Results -----

export type Result = {
  _id: string;
  student: StudentRefLite | string;
  score: number;
  average?: number;
  grade?: string;
  isPublished: boolean;
};

export type ClassResultsSummary = {
  subjects?: number;
  totalScore?: number;
  averageScore?: number;
  highest?: number;
  lowest?: number;
  passRate?: number;
  gradeDistribution?: Record<string, number>;
};

export type ResultsEnvelope = ApiEnvelope<Result[]> & {
  summary?: ClassResultsSummary;
};

export type ClassResultsParams = {
  classSubject: string;
  academicSession?: string;
  academicSemester?: string;
  isPublished?: boolean;
  student?: string;
  page?: number;
  limit?: number;
};

export type ComputeResultsPayload = {
  classSubject: string;
  academicSession?: string;
  academicSemester?: string;
};

export type ComputeResultsResponse = {
  classSubject?: string;
  academicSemester?: string;
  assessmentsUsed: number;
  studentsProcessed: number;
  results: Result[];
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

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as {
      data?: { message?: unknown };
      message?: unknown;
      error?: unknown;
    };
    if (typeof err.data?.message === "string" && err.data.message) {
      return err.data.message;
    }
    if (typeof err.message === "string" && err.message) {
      return err.message;
    }
  }
  return "Request failed.";
}

export function isErrorStatus(error: unknown, status: number): boolean {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    (error as { status?: unknown }).status === status
  );
}

export function refName(value: unknown): string | undefined {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export function refId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

export function studentName(value: StudentRefLite | string): string {
  if (typeof value === "string") return value;
  return value.fullName || "—";
}

export function fmtDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function fmtRate(rate: number | undefined): string {
  if (rate === undefined || rate === null || Number.isNaN(rate)) return "—";
  const pct = rate <= 1 ? rate * 100 : rate;
  return `${pct.toFixed(1)}%`;
}

const ATTENDANCE_RECORD_KEYS = [
  "Present",
  "Absent",
  "Late",
  "Excused",
  "Leave",
] as const;

export function attendanceCount(
  summary: AttendanceCountsSummary | undefined,
  key: (typeof ATTENDANCE_RECORD_KEYS)[number],
): number | undefined {
  if (!summary) return undefined;
  const lower = key.toLowerCase();
  return summary[key] ?? summary[lower as keyof AttendanceCountsSummary];
}

// ======================================================
// Endpoint definitions
// ======================================================

const teacherApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTeacherDashboard: build.query<ApiEnvelope<TeacherDashboardData>, void>({
      query: () => "/teachers/dashboard",
      providesTags: ["Teacher"],
    }),
    getTeacherProfile: build.query<ApiEnvelope<TeacherProfile>, void>({
      query: () => "/teachers/profile",
      providesTags: [{ type: "Teacher", id: "PROFILE" }],
    }),

    getMyAssignments: build.query<ApiEnvelope<TeacherAssignment[]>, void>({
      query: () => "/teacher-assignments/my-assignments",
      providesTags: ["Assignment"],
    }),
    getMyClasses: build.query<ApiEnvelope<MyClassRow[]>, void>({
      query: () => "/teacher-assignments/my-classes",
      providesTags: ["Assignment"],
    }),

    getTeacherAttendanceMe: build.query<TeacherAttendanceListEnvelope, {
      date?: string;
      from?: string;
      to?: string;
      status?: AttendanceStatus | "";
      page?: number;
      limit?: number;
    } | undefined>({
      query: (params) => ({
        url: "/teacher-attendance/me",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["TeacherAttendance"],
    }),

    getClassAttendance: build.query<AttendanceListEnvelope, {
      academicClass: string;
      date?: string;
      from?: string;
      to?: string;
      academicSession?: string;
      academicSemester?: string;
      status?: AttendanceStatus | "";
      student?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ academicClass, ...params }) => ({
        url: `/attendance/class/${academicClass}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: (_result, _error, { academicClass }) => [
        { type: "Attendance", id: academicClass },
      ],
    }),
    getClassAttendanceSummary: build.query<StudentSummaryEnvelope, {
      academicClass: string;
      academicSession?: string;
      academicSemester?: string;
    }>({
      query: ({ academicClass, ...params }) => ({
        url: `/attendance/class/${academicClass}/summary`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: (_result, _error, { academicClass }) => [
        { type: "Attendance", id: `${academicClass}-summary` },
      ],
    }),
    bulkMarkAttendance: build.mutation<
      ApiEnvelope<BulkAttendanceResponse>,
      BulkAttendancePayload
    >({
      query: (body) => ({ url: "/attendance/bulk", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Attendance", "Notifications", "StudentRecords"],
    }),
    updateAttendanceRecord: build.mutation<
      ApiEnvelope<AttendanceRecord>,
      UpdateAttendancePayload
    >({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Attendance"]),
    }),

    getAcademicSessions: build.query<ApiEnvelope<AcademicSessionRef[]>, void>({
      query: () => "/academic-sessions",
      providesTags: ["AcademicStructure"],
    }),
    getAcademicSemesters: build.query<ApiEnvelope<AcademicSemesterRef[]>, void>(
      {
        query: () => "/academic-semesters",
        providesTags: ["AcademicStructure"],
      },
    ),

    getAssessments: build.query<
      ApiEnvelope<Assessment[]>,
      AssessmentListParams | undefined
    >({
      query: (params) => ({
        url: "/assessments",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["Assessment"],
    }),
    createAssessment: build.mutation<
      ApiEnvelope<Assessment>,
      AssessmentPayload
    >({
      query: (body) => ({ url: "/assessments", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Assessment", "Result"]),
    }),
    updateAssessment: build.mutation<
      ApiEnvelope<Assessment>,
      Partial<AssessmentPayload> & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/assessments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Assessment", "Result"]),
    }),
    deleteAssessment: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({ url: `/assessments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Assessment", "AssessmentScore", "Result"],
    }),

    getAssessmentScores: build.query<ApiEnvelope<AssessmentScoresData>, string>({
      query: (id) => `/assessments/${id}/scores`,
      providesTags: (_result, _error, id) => [
        { type: "AssessmentScore", id },
      ],
    }),
    bulkUpsertAssessmentScores: build.mutation<
      ApiEnvelope<AssessmentScoresData>,
      { id: string } & BulkScoresPayload
    >({
      query: ({ id, records }) => ({
        url: `/assessments/${id}/scores`,
        method: "POST",
        body: { records },
      }),
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : ["Assessment", "Result", { type: "AssessmentScore", id }],
    }),
    updateAssessmentScore: build.mutation<
      ApiEnvelope<ScoreEntry>,
      UpdateScorePayload
    >({
      query: ({ id, ...body }) => ({
        url: `/assessments/scores/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["AssessmentScore", "Result"],
    }),
    deleteAssessmentScore: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({
        url: `/assessments/scores/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["AssessmentScore", "Result"],
    }),

    getClassResults: build.query<ResultsEnvelope, ClassResultsParams>({
      query: ({ classSubject, ...params }) => ({
        url: `/results/class/${classSubject}`,
        params: buildParams(params as Record<string, unknown>),
      }),
      providesTags: (_result, _error, { classSubject }) => [
        { type: "Result", id: classSubject },
      ],
    }),
    computeResults: build.mutation<
      ApiEnvelope<ComputeResultsResponse>,
      ComputeResultsPayload
    >({
      query: (body) => ({ url: "/results/compute", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Result", "Assessment", "AssessmentScore"],
    }),
  }),
});

const {
  useGetTeacherDashboardQuery,
  useGetTeacherProfileQuery,
  useGetMyAssignmentsQuery,
  useGetMyClassesQuery,
  useGetTeacherAttendanceMeQuery,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useBulkMarkAttendanceMutation,
  useUpdateAttendanceRecordMutation,
  useGetAcademicSessionsQuery,
  useGetAcademicSemestersQuery,
  useGetAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetAssessmentScoresQuery,
  useBulkUpsertAssessmentScoresMutation,
  useUpdateAssessmentScoreMutation,
  useDeleteAssessmentScoreMutation,
  useGetClassResultsQuery,
  useComputeResultsMutation,
} = teacherApi;

export {
  useGetTeacherDashboardQuery,
  useGetTeacherProfileQuery,
  useGetMyAssignmentsQuery,
  useGetMyClassesQuery,
  useGetTeacherAttendanceMeQuery,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useBulkMarkAttendanceMutation,
  useUpdateAttendanceRecordMutation,
  useGetAcademicSessionsQuery,
  useGetAcademicSemestersQuery,
  useGetAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useGetAssessmentScoresQuery,
  useBulkUpsertAssessmentScoresMutation,
  useUpdateAssessmentScoreMutation,
  useDeleteAssessmentScoreMutation,
  useGetClassResultsQuery,
  useComputeResultsMutation,
};
