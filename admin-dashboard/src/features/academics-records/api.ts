import { baseApi, type ApiEnvelope } from "@/app/api";

// ======================================================
// Shared helpers
// ======================================================

function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

// ======================================================
// Class subjects (docs 4.7)
// ======================================================

export type ClassSubjectRef = {
  _id: string;
  academicClass:
    | string
    | {
        _id: string;
        name: string;
        academicLevel?: { _id: string; name: string } | null;
      }
    | null;
  subject:
    | string
    | { _id: string; name?: string; prefix?: string; courseCode?: string }
    | null;
  academicSemester: string | { _id: string; name: string } | null;
  description?: string;
  isActive: boolean;
};

export type ClassSubjectsListParams = {
  academicClass?: string;
  academicSemester?: string;
  isActive?: boolean;
};

// ======================================================
// Class roster (docs 6.1 — GET /students?academicClass=…)
// ======================================================

export type RosterStudent = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  registrationNumber?: string;
  status?: string;
  isActive?: boolean;
};

// ======================================================
// Student attendance (docs 7.1)
// ======================================================

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
];

export type AttendanceStudentRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  registrationNumber?: string;
};

export type AttendanceRecord = {
  _id: string;
  student: AttendanceStudentRef | string;
  academicClass?:
    | string
    | { _id: string; name: string; academicLevel?: { _id: string; name: string } | null }
    | null;
  academicSession?: string | { _id: string; name: string } | null;
  academicSemester?: string | { _id: string; name: string } | null;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: string | { _id: string; fullName: string } | null;
  isActive?: boolean;
  createdAt?: string;
};

export type BulkAttendanceRecordInput = {
  student: string;
  status: AttendanceStatus;
  remarks?: string;
};

export type BulkAttendanceBody = {
  academicClass: string;
  academicSession: string;
  academicSemester: string;
  date: string;
  records: BulkAttendanceRecordInput[];
};

export type AttendanceBulkResult = {
  records?: AttendanceRecord[];
  created?: number;
  updated?: number;
  saved?: number;
};

export type ClassAttendanceSummary = {
  present?: number;
  absent?: number;
  late?: number;
  excused?: number;
  total?: number;
  totalRecords?: number;
  attendanceRate?: number;
};

export type ClassAttendanceListResponse = ApiEnvelope<AttendanceRecord[]> & {
  summary?: ClassAttendanceSummary;
};

export type ClassAttendanceListParams = {
  page?: number;
  limit?: number;
  academicSession?: string;
  academicSemester?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  student?: string;
  status?: AttendanceStatus | "";
};

export type UpdateAttendanceBody = Partial<
  Pick<BulkAttendanceRecordInput, "status" | "remarks">
> & { date?: string };

// ======================================================
// Teacher attendance (docs 7.2)
// ======================================================

export type TeacherAttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Excused"
  | "Leave";

export const TEACHER_ATTENDANCE_STATUSES: TeacherAttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
  "Leave",
];

export type TeacherAttendanceRecord = {
  _id: string;
  teacher:
    | string
    | {
        _id: string;
        teacherNumber?: string;
        firstName: string;
        middleName?: string;
        lastName: string;
      };
  date: string;
  status: TeacherAttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type TeacherAttendanceBulkInput = {
  teacher: string;
  date: string;
  status: TeacherAttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
};

export type TeacherAttendanceBulkBody = {
  records: TeacherAttendanceBulkInput[];
};

export type TeacherAttendanceListParams = {
  page?: number;
  limit?: number;
  teacher?: string;
  date?: string;
  from?: string;
  to?: string;
};

export type UpdateTeacherAttendanceBody = Partial<
  Omit<TeacherAttendanceBulkInput, "teacher">
> & { date?: string };

export type TeacherAttendanceSummaryEntry = {
  teacherId?: string;
  teacher?:
    | string
    | {
        _id: string;
        teacherNumber?: string;
        firstName: string;
        middleName?: string;
        lastName: string;
      }
    | null;
  present?: number;
  absent?: number;
  late?: number;
  excused?: number;
  leave?: number;
  total?: number;
  attendanceRate?: number;
};

// ======================================================
// Assessments (docs 8.1)
// ======================================================

export type AssessmentType =
  | "Quiz"
  | "Test"
  | "Assignment"
  | "Midterm"
  | "Exam"
  | "Project"
  | "Practical";

export const ASSESSMENT_TYPES: AssessmentType[] = [
  "Quiz",
  "Test",
  "Assignment",
  "Midterm",
  "Exam",
  "Project",
  "Practical",
];

export type Assessment = {
  _id: string;
  classSubject: string | ClassSubjectRef;
  academicSemester?: string | { _id: string; name: string } | null;
  name: string;
  type: AssessmentType;
  maxScore: number;
  weight: number;
  date: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

export type AssessmentBody = {
  classSubject: string;
  name: string;
  type: AssessmentType;
  maxScore: number;
  weight: number;
  date: string;
  description?: string;
};

export type AssessmentScore = {
  _id: string;
  assessment: string | Assessment;
  student: AttendanceStudentRef | string;
  score: number;
  remarks?: string;
  recordedBy?: string | { _id: string; fullName: string } | null;
  createdAt?: string;
};

export type AssessmentScoreInput = {
  student: string;
  score: number;
  remarks?: string;
};

// ======================================================
// Results (docs 8.2)
// ======================================================

export type ClassSubjectResult = {
  _id: string;
  student: AttendanceStudentRef | string;
  classSubject: string | ClassSubjectRef;
  academicSession?: string | { _id: string; name: string } | null;
  academicSemester?: string | { _id: string; name: string } | null;
  totalScore: number;
  letterGrade: string;
  gradePoint: number;
  remark: string;
  isPublished: boolean;
  computedAt?: string | null;
  publishedAt?: string | null;
};

export type ClassResultsSummary = {
  average?: number;
  passRate?: number;
  highest?: number;
  lowest?: number;
  totalStudents?: number;
  gpa?: number;
  gradeDistribution?: { grade?: string; count?: number }[];
};

export type ClassResultsResponse = ApiEnvelope<ClassSubjectResult[]> & {
  summary?: ClassResultsSummary;
};

export type ComputeResultsBody = {
  classSubject: string;
  academicSemester: string;
};

export type PublishResultsBody = {
  classSubject: string;
  academicSemester: string;
  studentIds?: string[];
  isPublished: boolean;
};

export type StudentAcademicResultParams = {
  studentId: string;
  academicSession?: string;
  academicSemester?: string;
  page?: number;
  limit?: number;
};

export type StudentReportCard = {
  student?:
    | string
    | {
        _id?: string;
        fullName?: string;
        registrationNumber?: string;
        academicClass?:
          | string
          | { _id: string; name: string; academicLevel?: { _id: string; name: string } | null }
          | null;
      }
    | null;
  academicSession?: string | { _id: string; name: string } | null;
  academicSemester?: string | { _id: string; name: string } | null;
  results?: ClassSubjectResult[];
  summary?: ClassResultsSummary;
};

export type TranscriptPeriod = {
  title?: string;
  academicSession?: string | { _id: string; name: string } | null;
  academicSemester?: string | { _id: string; name: string } | null;
  results?: ClassSubjectResult[];
  summary?: ClassResultsSummary;
};

export type StudentTranscript = {
  student?:
    | string
    | {
        _id?: string;
        fullName?: string;
        registrationNumber?: string;
        academicClass?:
          | string
          | { _id: string; name: string; academicLevel?: { _id: string; name: string } | null }
          | null;
      }
    | null;
  results?: ClassSubjectResult[];
  periods?: TranscriptPeriod[];
  summary?: ClassResultsSummary;
};

// ======================================================
// Parent portal — child list (docs 10.2, used to resolve
// student IDs for the student/parent result views)
// ======================================================

export type LinkedChild = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  registrationNumber?: string;
  academicClass?:
    | string
    | { _id: string; name: string; academicLevel?: { _id: string; name: string } | null }
    | null;
};

// ======================================================
// Endpoint definitions
// ======================================================

const academicsRecordsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Class subjects (docs 4.7) -----
    listClassSubjects: build.query<
      ApiEnvelope<ClassSubjectRef[]>,
      ClassSubjectsListParams | undefined
    >({
      query: (params) => ({
        url: "/class-subjects",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: ["ClassSubjects"],
    }),

    // ----- Class roster (docs 6.1) -----
    getClassRoster: build.query<
      ApiEnvelope<RosterStudent[]>,
      { academicClass: string; academicSession?: string }
    >({
      query: ({ academicClass, academicSession }) => ({
        url: "/students",
        params: cleanParams({ academicClass, academicSession, limit: 200 }),
      }),
      providesTags: ["Students"],
    }),

    // ----- Student attendance (docs 7.1) -----
    bulkMarkAttendance: build.mutation<
      ApiEnvelope<AttendanceBulkResult>,
      BulkAttendanceBody
    >({
      query: (body) => ({ url: "/attendance/bulk", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Attendance"]),
    }),
    getClassAttendance: build.query<
      ClassAttendanceListResponse,
      ClassAttendanceListParams & { academicClass: string }
    >({
      query: ({ academicClass, ...params }) => ({
        url: `/attendance/class/${academicClass}`,
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { academicClass }) => [
        { type: "Attendance", id: `class:${academicClass}` },
      ],
    }),
    getClassAttendanceSummary: build.query<
      ApiEnvelope<ClassAttendanceSummary>,
      { academicClass: string; academicSession?: string; academicSemester?: string; date?: string; dateFrom?: string; dateTo?: string }
    >({
      query: ({ academicClass, ...params }) => ({
        url: `/attendance/class/${academicClass}/summary`,
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { academicClass }) => [
        { type: "Attendance", id: `class-summary:${academicClass}` },
      ],
    }),
    getStudentAttendance: build.query<
      ApiEnvelope<AttendanceRecord[]>,
      { studentId: string; page?: number; limit?: number }
    >({
      query: ({ studentId, ...params }) => ({
        url: `/attendance/student/${studentId}`,
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "Attendance", id: `student:${studentId}` },
      ],
    }),
    updateAttendanceRecord: build.mutation<
      ApiEnvelope<AttendanceRecord>,
      { id: string; body: UpdateAttendanceBody }
    >({
      query: ({ id, body }) => ({
        url: `/attendance/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Attendance"]),
    }),
    deleteAttendanceRecord: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/attendance/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["Attendance"]),
    }),

    // ----- Teacher attendance (docs 7.2) -----
    bulkMarkTeacherAttendance: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      TeacherAttendanceBulkBody
    >({
      query: (body) => ({
        url: "/teacher-attendance/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["TeacherAttendance"]),
    }),
    listTeacherAttendance: build.query<
      ApiEnvelope<TeacherAttendanceRecord[]>,
      TeacherAttendanceListParams | undefined
    >({
      query: (params) => ({
        url: "/teacher-attendance",
        params: cleanParams(params),
      }),
      providesTags: ["TeacherAttendance"],
    }),
    getTeacherAttendanceSummary: build.query<
      ApiEnvelope<TeacherAttendanceSummaryEntry[]>,
      { teacher?: string; from?: string; to?: string }
    >({
      query: (params) => ({
        url: "/teacher-attendance/summary",
        params: cleanParams(params),
      }),
      providesTags: ["TeacherAttendance"],
    }),
    updateTeacherAttendance: build.mutation<
      ApiEnvelope<TeacherAttendanceRecord>,
      { id: string; body: UpdateTeacherAttendanceBody }
    >({
      query: ({ id, body }) => ({
        url: `/teacher-attendance/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["TeacherAttendance"]),
    }),
    deleteTeacherAttendance: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/teacher-attendance/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["TeacherAttendance"]),
    }),

    // ----- Assessments (docs 8.1) -----
    listAssessments: build.query<
      ApiEnvelope<Assessment[]>,
      { classSubject: string; page?: number; limit?: number }
    >({
      query: ({ classSubject, ...params }) => ({
        url: "/assessments",
        params: cleanParams({ ...params, classSubject }),
      }),
      providesTags: ["Assessments"],
    }),
    createAssessment: build.mutation<ApiEnvelope<Assessment>, AssessmentBody>({
      query: (body) => ({ url: "/assessments", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Assessments"]),
    }),
    updateAssessment: build.mutation<
      ApiEnvelope<Assessment>,
      { id: string; body: Partial<AssessmentBody> }
    >({
      query: ({ id, body }) => ({
        url: `/assessments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Assessments"]),
    }),
    deleteAssessment: build.mutation<ApiEnvelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/assessments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Assessments", "Scores"],
    }),
    saveAssessmentScores: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      { assessmentId: string; records: AssessmentScoreInput[] }
    >({
      query: ({ assessmentId, records }) => ({
        url: `/assessments/${assessmentId}/scores`,
        method: "POST",
        body: { records },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Scores"]),
    }),
    listAssessmentScores: build.query<ApiEnvelope<AssessmentScore[]>, string>({
      query: (assessmentId) => `/assessments/${assessmentId}/scores`,
      providesTags: (_result, _error, assessmentId) => [
        { type: "Scores", id: assessmentId },
      ],
    }),
    updateAssessmentScore: build.mutation<
      ApiEnvelope<AssessmentScore>,
      { scoreId: string; body: Partial<AssessmentScoreInput> }
    >({
      query: ({ scoreId, body }) => ({
        url: `/assessments/scores/${scoreId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Scores"]),
    }),
    deleteAssessmentScore: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (scoreId) => ({
        url: `/assessments/scores/${scoreId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["Scores"]),
    }),

    // ----- Results (docs 8.2) -----
    computeResults: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      ComputeResultsBody
    >({
      query: (body) => ({ url: "/results/compute", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Results"]),
    }),
    publishResults: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      PublishResultsBody
    >({
      query: (body) => ({ url: "/results/publish", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Results"]),
    }),
    getClassSubjectResults: build.query<
      ClassResultsResponse,
      { classSubject: string; academicSemester?: string }
    >({
      query: ({ classSubject, academicSemester }) => ({
        url: `/results/class/${classSubject}`,
        params: cleanParams({ academicSemester }),
      }),
      providesTags: (_result, _error, { classSubject }) => [
        { type: "Results", id: `class-subject:${classSubject}` },
      ],
    }),
    getStudentAcademicResults: build.query<
      ApiEnvelope<ClassSubjectResult[]>,
      StudentAcademicResultParams
    >({
      query: ({ studentId, ...params }) => ({
        url: `/results/student/${studentId}`,
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "Results", id: `student:${studentId}` },
      ],
    }),
    getStudentReportCard: build.query<
      ApiEnvelope<StudentReportCard>,
      { studentId: string; academicSession?: string; academicSemester?: string }
    >({
      query: ({ studentId, ...params }) => ({
        url: `/results/report-card/${studentId}`,
        params: cleanParams(params),
      }),
      providesTags: (_result, _error, { studentId }) => [
        { type: "Results", id: `report-card:${studentId}` },
      ],
    }),
    getStudentTranscript: build.query<
      ApiEnvelope<StudentTranscript>,
      { studentId: string }
    >({
      query: ({ studentId }) => `/results/transcript/${studentId}`,
      providesTags: (_result, _error, { studentId }) => [
        { type: "Results", id: `transcript:${studentId}` },
      ],
    }),

    // ----- Parent portal children (docs 10.2) -----
    listMyChildren: build.query<ApiEnvelope<LinkedChild[]>, void>({
      query: () => "/parent/children",
      providesTags: ["Parents"],
    }),
  }),
});

const {
  useListClassSubjectsQuery,
  useGetClassRosterQuery,
  useBulkMarkAttendanceMutation,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useGetStudentAttendanceQuery,
  useUpdateAttendanceRecordMutation,
  useDeleteAttendanceRecordMutation,
  useBulkMarkTeacherAttendanceMutation,
  useListTeacherAttendanceQuery,
  useGetTeacherAttendanceSummaryQuery,
  useUpdateTeacherAttendanceMutation,
  useDeleteTeacherAttendanceMutation,
  useListAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useSaveAssessmentScoresMutation,
  useListAssessmentScoresQuery,
  useUpdateAssessmentScoreMutation,
  useDeleteAssessmentScoreMutation,
  useComputeResultsMutation,
  usePublishResultsMutation,
  useGetClassSubjectResultsQuery,
  useGetStudentAcademicResultsQuery,
  useGetStudentReportCardQuery,
  useGetStudentTranscriptQuery,
  useListMyChildrenQuery,
} = academicsRecordsApi;

export {
  useListClassSubjectsQuery,
  useGetClassRosterQuery,
  useBulkMarkAttendanceMutation,
  useGetClassAttendanceQuery,
  useGetClassAttendanceSummaryQuery,
  useGetStudentAttendanceQuery,
  useUpdateAttendanceRecordMutation,
  useDeleteAttendanceRecordMutation,
  useBulkMarkTeacherAttendanceMutation,
  useListTeacherAttendanceQuery,
  useGetTeacherAttendanceSummaryQuery,
  useUpdateTeacherAttendanceMutation,
  useDeleteTeacherAttendanceMutation,
  useListAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useDeleteAssessmentMutation,
  useSaveAssessmentScoresMutation,
  useListAssessmentScoresQuery,
  useUpdateAssessmentScoreMutation,
  useDeleteAssessmentScoreMutation,
  useComputeResultsMutation,
  usePublishResultsMutation,
  useGetClassSubjectResultsQuery,
  useGetStudentAcademicResultsQuery,
  useGetStudentReportCardQuery,
  useGetStudentTranscriptQuery,
  useListMyChildrenQuery,
};
