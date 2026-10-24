import { baseApi, type ApiEnvelope } from "@/app/api";

// ======================================================
// Academic structure references
// ======================================================

export type AcademicSectionRef = {
  _id: string;
  name: string;
  code?: string;
};

export type AcademicLevelRef = {
  _id: string;
  name: string;
  levelNumber?: number;
  courseCode?: string;
  section?: AcademicSectionRef | string;
};

export type AcademicSession = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

export type AcademicSemester = {
  _id: string;
  name: "First Semester" | "Second Semester";
  academicSession: AcademicSession | string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

export type AcademicClass = {
  _id: string;
  name: string;
  academicLevel: AcademicLevelRef | string;
  capacity?: number;
  isActive: boolean;
};

// ======================================================
// Students
// ======================================================

export type StudentStatus =
  | "Active"
  | "Suspended"
  | "Graduated"
  | "Withdrawn"
  | "Expelled";

export type StudentUserRef = {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  role: string;
  isActive: boolean;
};

export type Student = {
  _id: string;
  user: StudentUserRef | null;
  admissionApplication: string;
  applicationNumber: string;
  registrationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  email?: string;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  relationship: string;
  currentLevel: string;
  previousMadrasa?: string;
  academicClass: AcademicClass | string | null;
  status: StudentStatus;
  statusReason: string;
  paymentStatus: "Pending" | "Paid";
  paidAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudentsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StudentStatus | "";
};

// ======================================================
// Student enrollments
// ======================================================

export type EnrollmentStatus = "Active" | "Completed" | "Transferred" | "Withdrawn";

export type StudentEnrollment = {
  _id: string;
  student: Student | string;
  academicSession: AcademicSession | string;
  academicClass: AcademicClass | string;
  status: EnrollmentStatus;
  enrollmentDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EnrollmentsListParams = {
  page?: number;
  limit?: number;
  student?: string;
  academicSession?: string;
  academicClass?: string;
  status?: EnrollmentStatus | "";
  isActive?: boolean;
};

export type CreateEnrollmentBody = {
  student: string;
  academicSession: string;
  academicClass: string;
};

export type UpdateEnrollmentBody = {
  academicClass?: string;
  status?: EnrollmentStatus;
};

// ======================================================
// Student records
// ======================================================

export type RecordType =
  | "Promotion"
  | "Transfer"
  | "Withdrawal"
  | "Suspension"
  | "Graduation"
  | "Disciplinary"
  | "General";

export const RECORD_TYPES: RecordType[] = [
  "Promotion",
  "Transfer",
  "Withdrawal",
  "Suspension",
  "Graduation",
  "Disciplinary",
  "General",
];

export type StudentRecord = {
  _id: string;
  student: Student | string;
  academicSession: AcademicSession | string;
  academicSemester: AcademicSemester | string;
  academicClass: AcademicClass | string;
  recordType: RecordType;
  title: string;
  description: string;
  previousClass: AcademicClass | string | null;
  newClass: AcademicClass | string | null;
  recordedBy:
    | { _id: string; fullName: string; username?: string }
    | string;
  recordDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecordsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  student?: string;
  academicSession?: string;
  academicClass?: string;
  recordType?: RecordType | "";
  isActive?: boolean;
};

export type CreateRecordBody = {
  student: string;
  academicSession: string;
  academicSemester: string;
  academicClass: string;
  recordType: RecordType;
  title: string;
  description?: string;
  previousClass?: string;
  newClass?: string;
  recordDate?: string;
};

// ======================================================
// Student results (section 8.2)
// ======================================================

export type StudentResult = {
  _id: string;
  student: Student | string;
  classSubject:
    | string
    | {
        _id: string;
        courseCode?: string;
        subject?: string | { _id: string; name: string; prefix?: string };
        academicClass?: string | { _id: string; name: string };
      };
  academicSession: AcademicSession | string;
  academicSemester: AcademicSemester | string;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  remark: string;
  isPublished: boolean;
};

export type ResultsSummary = {
  averageScore?: number;
  totalSubjects?: number;
  passed?: number;
  failed?: number;
  gpa?: number;
};

export type StudentResultsEnvelope = ApiEnvelope<StudentResult[]> & {
  summary?: ResultsSummary;
};

export type ResultListParams = {
  page?: number;
  limit?: number;
  academicSession?: string;
  academicSemester?: string;
  classSubject?: string;
  isPublished?: boolean;
};

// ======================================================
// Student fee summary (section 9.2)
// ======================================================

export type StudentFeeSummary = {
  student: {
    id: string;
    fullName: string;
    registrationNumber: string;
    academicClass: AcademicClass | string | null;
  };
  summary: {
    invoices: number;
    unpaidInvoices: number;
    totalBilled: number;
    totalPaid: number;
    totalBalance: number;
  };
  invoices: unknown[];
  payments: unknown[];
};

// ======================================================
// Student password reset (section 5.4)
// ======================================================

export type ResetStudentPasswordResult = {
  student: {
    id: string;
    fullName: string;
    registrationNumber: string;
  };
  login: {
    username: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
  };
};

// ======================================================
// Shared helpers
// ======================================================

export function isPopulated<T extends { _id: string }>(
  value: T | string | null | undefined,
): value is T {
  return (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    typeof (value as T)._id === "string"
  );
}

export function refName(
  value: { name?: string; _id?: string } | string | null | undefined,
): string | "—" {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.name ?? "—";
}

export function studentId(student: Student | string): string {
  return isPopulated(student) ? student._id : student;
}

export function studentFullName(student: Student | string): string {
  if (!isPopulated(student)) return "—";
  return (
    student.fullName ||
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") ||
    "—"
  );
}

export function classLabel(
  value:
    | AcademicClass
    | { _id: string; name: string; academicLevel?: { _id: string; name: string } | null }
    | string
    | null,
): string {
  if (!isPopulated(value)) return "—";
  const level = value.academicLevel;
  const levelName = isPopulated(level) ? level.name : undefined;
  return levelName ? `${levelName} — ${value.name}` : value.name;
}

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

const studentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Section 6.1 — Students (Admin) -----
    getStudents: build.query<
      ApiEnvelope<Student[]>,
      StudentsListParams | undefined
    >({
      query: (params) => ({
        url: "/students",
        params: buildParams(params),
      }),
      providesTags: ["Students"],
    }),
    getStudent: build.query<ApiEnvelope<Student>, string>({
      query: (studentId) => `/students/${studentId}`,
      providesTags: (_result, _error, studentId) => [
        { type: "Students", id: studentId },
      ],
    }),

    // ----- Section 6.2 — Student enrollments (Admin) -----
    getEnrollments: build.query<
      ApiEnvelope<StudentEnrollment[]>,
      EnrollmentsListParams | undefined
    >({
      query: (params) => ({
        url: "/student-enrollments",
        params: buildParams(params),
      }),
      providesTags: ["Enrollments"],
    }),
    getStudentEnrollmentHistory: build.query<
      ApiEnvelope<StudentEnrollment[]>,
      string
    >({
      query: (studentId) =>
        `/student-enrollments/student/${studentId}/history`,
      providesTags: (_result, _error, studentId) => [
        { type: "Enrollments", id: studentId },
      ],
    }),
    createEnrollment: build.mutation<
      ApiEnvelope<StudentEnrollment>,
      CreateEnrollmentBody
    >({
      query: (body) => ({
        url: "/student-enrollments",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Enrollments", "Students"],
    }),
    updateEnrollment: build.mutation<
      ApiEnvelope<StudentEnrollment>,
      UpdateEnrollmentBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/student-enrollments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Enrollments", "Students"],
    }),
    deactivateEnrollment: build.mutation<
      ApiEnvelope<StudentEnrollment>,
      string
    >({
      query: (id) => ({
        url: `/student-enrollments/${id}/deactivate`,
        method: "PUT",
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Enrollments", "Students"],
    }),

    // ----- Section 4.3/4.4/4.5 — Academic structure for selects -----
    getAcademicSessions: build.query<ApiEnvelope<AcademicSession[]>, void>({
      query: () => "/academic-sessions",
      providesTags: ["AcademicStructure"],
    }),
    getAcademicSemesters: build.query<
      ApiEnvelope<AcademicSemester[]>,
      { academicSession?: string } | void
    >({
      query: (params) => ({
        url: "/academic-semesters",
        params: buildParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["AcademicStructure"],
    }),
    getAcademicClasses: build.query<ApiEnvelope<AcademicClass[]>, void>({
      query: () => "/academic-classes",
      providesTags: ["AcademicStructure"],
    }),

    // ----- Section 6.3 — Student records (Admin) -----
    getStudentRecords: build.query<
      ApiEnvelope<StudentRecord[]>,
      RecordsListParams | undefined
    >({
      query: (params) => ({
        url: "/student-records",
        params: buildParams(params),
      }),
      providesTags: ["StudentRecords"],
    }),
    getStudentRecord: build.query<ApiEnvelope<StudentRecord>, string>({
      query: (recordId) => `/student-records/${recordId}`,
      providesTags: (_result, _error, recordId) => [
        { type: "StudentRecords", id: recordId },
      ],
    }),
    getStudentRecordHistory: build.query<ApiEnvelope<StudentRecord[]>, string>({
      query: (studentId) => `/student-records/student/${studentId}/history`,
      providesTags: (_result, _error, studentId) => [
        { type: "StudentRecords", id: studentId },
      ],
    }),
    createStudentRecord: build.mutation<
      ApiEnvelope<StudentRecord>,
      CreateRecordBody
    >({
      query: (body) => ({
        url: "/student-records",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["StudentRecords", "Students"],
    }),
    deactivateStudentRecord: build.mutation<
      ApiEnvelope<StudentRecord>,
      string
    >({
      query: (id) => ({
        url: `/student-records/${id}/deactivate`,
        method: "PUT",
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["StudentRecords"],
    }),

    // ----- Section 8.2 — Results for a student (Admin) -----
    getStudentResults: build.query<
      StudentResultsEnvelope,
      ResultListParams & { studentId: string }
    >({
      query: ({ studentId, ...params }) => ({
        url: `/results/student/${studentId}`,
        params: buildParams(params),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "Results", id: studentId },
      ],
    }),

    // ----- Section 9.2 — Fee summary for a student (Admin) -----
    getStudentFeeSummary: build.query<StudentFeeSummary, string>({
      query: (studentId) => `/invoices/student/${studentId}/summary`,
      providesTags: (_result, _error, studentId) => [
        { type: "Finance", id: studentId },
      ],
    }),

    // ----- Section 5.4 — Student password reset (Admin) -----
    resetStudentPassword: build.mutation<
      ApiEnvelope<ResetStudentPasswordResult>,
      string
    >({
      query: (studentId) => ({
        url: `/student-passwords/${studentId}/reset`,
        method: "POST",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Students", "Users"]),
    }),
  }),
});

const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetEnrollmentsQuery,
  useGetStudentEnrollmentHistoryQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useDeactivateEnrollmentMutation,
  useGetAcademicSessionsQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicClassesQuery,
  useGetStudentRecordsQuery,
  useGetStudentRecordQuery,
  useGetStudentRecordHistoryQuery,
  useCreateStudentRecordMutation,
  useDeactivateStudentRecordMutation,
  useGetStudentResultsQuery,
  useGetStudentFeeSummaryQuery,
  useResetStudentPasswordMutation,
} = studentsApi;

export {
  useGetStudentsQuery,
  useGetStudentQuery,
  useGetEnrollmentsQuery,
  useGetStudentEnrollmentHistoryQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useDeactivateEnrollmentMutation,
  useGetAcademicSessionsQuery,
  useGetAcademicSemestersQuery,
  useGetAcademicClassesQuery,
  useGetStudentRecordsQuery,
  useGetStudentRecordQuery,
  useGetStudentRecordHistoryQuery,
  useCreateStudentRecordMutation,
  useDeactivateStudentRecordMutation,
  useGetStudentResultsQuery,
  useGetStudentFeeSummaryQuery,
  useResetStudentPasswordMutation,
};
