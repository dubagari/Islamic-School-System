import { baseApi, type ApiEnvelope } from "@/app/api";
import type { Pagination } from "@/types";

export type CbtQuestionType = "MultipleChoice" | "TrueFalse";
export type CbtDifficulty = "Easy" | "Medium" | "Hard";
export type CbtResultVisibility =
  | "AfterPublish"
  | "Immediate"
  | "Hidden";
export type CbtAttemptStatus = "InProgress" | "Submitted" | "Voided";

export type CbtOption = { key: string; text: string };

export type CbtQuestion = {
  _id: string;
  subject: string | { _id: string; name?: string; prefix?: string };
  questionText: string;
  type: CbtQuestionType;
  options: CbtOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: CbtDifficulty;
  defaultMarks: number;
  isActive: boolean;
};

export type CbtExamQuestion = {
  _id: string;
  exam: string;
  question: CbtQuestion | string;
  marks: number;
  order: number;
  questionText?: string;
  type?: CbtQuestionType;
  options?: CbtOption[];
};

export type CbtExam = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  classSubject?:
    | string
    | {
        _id: string;
        subject?: { _id: string; name?: string; prefix?: string } | string;
        academicClass?: { _id: string; name?: string } | string;
      };
  academicSemester?: string | { _id: string; name?: string };
  startAt: string;
  endAt: string;
  durationMinutes: number;
  passMark: number;
  maxAttempts: number;
  totalMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  resultVisibility: CbtResultVisibility;
  allowReview: boolean;
  isPublished: boolean;
  isClosed: boolean;
  isActive: boolean;
  resultsPublished: boolean;
  questionCount?: number;
};

export type StudentCbtExam = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  classSubject?: CbtExam["classSubject"];
  academicSemester?: CbtExam["academicSemester"];
  startAt: string;
  endAt: string;
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  maxAttempts: number;
  attemptsUsed: number;
  status: "Available" | "Upcoming" | "Completed" | "Closed" | "InProgress";
  attempt?: {
    _id: string;
    status: CbtAttemptStatus;
    attemptNumber: number;
    submittedAt?: string | null;
    resultVisible: boolean;
    score?: number;
    totalMarks?: number;
    percentage?: number;
    passed?: boolean;
  } | null;
};

export type CbtRunnerQuestion = {
  _id: string;
  questionText: string;
  type: CbtQuestionType;
  marks: number;
  options: CbtOption[];
  selectedAnswer: string;
};

export type CbtAttemptPayload = {
  exam: {
    _id: string;
    title: string;
    description?: string;
    instructions?: string;
    durationMinutes: number;
    totalMarks: number;
    passMark: number;
    startAt: string;
    endAt: string;
    resultVisibility: CbtResultVisibility;
  };
  attempt: {
    _id: string;
    attemptNumber: number;
    status: CbtAttemptStatus;
    startedAt: string;
    expiresAt: string;
    submittedAt?: string | null;
    autoSubmitted?: boolean;
  };
  serverTime: string;
  questions: CbtRunnerQuestion[];
};

export type CbtBreakdownEntry = {
  question: string;
  questionText: string;
  type: CbtQuestionType;
  marks: number;
  selectedAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
  options?: CbtOption[];
  correctAnswer?: string;
  explanation?: string;
};

export type CbtResultPayload = {
  exam: {
    _id: string;
    title: string;
    totalMarks: number;
    passMark: number;
    resultVisibility: CbtResultVisibility;
    resultsPublished: boolean;
    allowReview: boolean;
  };
  attempt: {
    _id: string;
    attemptNumber: number;
    status: CbtAttemptStatus;
    startedAt: string;
    expiresAt: string;
    submittedAt?: string | null;
    autoSubmitted?: boolean;
    score?: number;
    totalMarks?: number;
    percentage?: number;
    passed?: boolean;
    linkedScoreStatus?: string;
  };
  resultVisible: boolean;
  canReview: boolean;
  breakdown?: CbtBreakdownEntry[];
};

export type CbtAttemptListItem = {
  _id: string;
  exam:
    | string
    | { _id: string; title?: string; totalMarks?: number; passMark?: number };
  student?:
    | string
    | {
        _id: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        registrationNumber?: string;
      };
  status: CbtAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string | null;
  expiresAt: string;
  autoSubmitted?: boolean;
  resultVisible: boolean;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
};

export type PaginatedEnvelope<T> = ApiEnvelope<T[]> & {
  pagination: Pagination;
  student?: unknown;
  summary?: unknown;
};

type Params = Record<string, unknown> | undefined;

const cleanParams = (params?: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
};

const cbtApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Teacher authoring
    listCbtQuestions: build.query<
      PaginatedEnvelope<CbtQuestion>,
      Params
    >({
      query: (params) => ({
        url: "/cbt/questions",
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
    createCbtQuestion: build.mutation<
      ApiEnvelope<CbtQuestion>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/cbt/questions", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    updateCbtQuestion: build.mutation<
      ApiEnvelope<CbtQuestion>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/cbt/questions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    deleteCbtQuestion: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({ url: `/cbt/questions/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),

    listCbtExams: build.query<PaginatedEnvelope<CbtExam>, Params>({
      query: (params) => ({
        url: "/cbt/exams",
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
    getCbtExam: build.query<ApiEnvelope<CbtExam>, string>({
      query: (id) => `/cbt/exams/${id}`,
      providesTags: ["CBT"],
    }),
    createCbtExam: build.mutation<
      ApiEnvelope<CbtExam>,
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/cbt/exams", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    updateCbtExam: build.mutation<
      ApiEnvelope<CbtExam>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/cbt/exams/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    deleteCbtExam: build.mutation<ApiEnvelope<unknown>, string>({
      query: (id) => ({ url: `/cbt/exams/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    publishCbtExam: build.mutation<
      ApiEnvelope<CbtExam>,
      { id: string; isPublished?: boolean }
    >({
      query: ({ id, isPublished = true }) => ({
        url: `/cbt/exams/${id}/publish`,
        method: "POST",
        body: { isPublished },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    publishCbtResults: build.mutation<
      ApiEnvelope<CbtExam>,
      { id: string; isPublished?: boolean }
    >({
      query: ({ id, isPublished = true }) => ({
        url: `/cbt/exams/${id}/results/publish`,
        method: "POST",
        body: { isPublished },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    getCbtExamQuestions: build.query<
      ApiEnvelope<{
        exam: CbtExam;
        questions: CbtExamQuestion[];
        totalMarks: number;
      }>,
      string
    >({
      query: (id) => `/cbt/exams/${id}/questions`,
      providesTags: ["CBT"],
    }),
    attachCbtQuestions: build.mutation<
      ApiEnvelope<unknown>,
      { id: string; questions: { question: string; marks?: number }[] }
    >({
      query: ({ id, questions }) => ({
        url: `/cbt/exams/${id}/questions`,
        method: "POST",
        body: { questions },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    updateCbtExamQuestion: build.mutation<
      ApiEnvelope<CbtExamQuestion>,
      { id: string; examQuestionId: string; marks: number }
    >({
      query: ({ id, examQuestionId, marks }) => ({
        url: `/cbt/exams/${id}/questions/${examQuestionId}`,
        method: "PATCH",
        body: { marks },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    reorderCbtExamQuestions: build.mutation<
      ApiEnvelope<unknown>,
      { id: string; order: string[] }
    >({
      query: ({ id, order }) => ({
        url: `/cbt/exams/${id}/questions/reorder`,
        method: "PATCH",
        body: { order },
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    removeCbtExamQuestion: build.mutation<
      ApiEnvelope<unknown>,
      { id: string; examQuestionId: string }
    >({
      query: ({ id, examQuestionId }) => ({
        url: `/cbt/exams/${id}/questions/${examQuestionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    getCbtExamAttempts: build.query<
      PaginatedEnvelope<CbtAttemptListItem> & {
        summary?: unknown;
        exam?: { id: string; title: string };
      },
      { id: string; params?: Record<string, unknown> }
    >({
      query: ({ id, params }) => ({
        url: `/cbt/exams/${id}/attempts`,
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),

    // Student
    getStudentCbtExams: build.query<
      PaginatedEnvelope<StudentCbtExam>,
      Params
    >({
      query: (params) => ({
        url: "/cbt/student/exams",
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
    startCbtAttempt: build.mutation<
      ApiEnvelope<CbtAttemptPayload>,
      string
    >({
      query: (examId) => ({
        url: `/cbt/student/exams/${examId}/start`,
        method: "POST",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    getStudentCbtAttempt: build.query<
      ApiEnvelope<CbtAttemptPayload>,
      string
    >({
      query: (attemptId) => `/cbt/student/attempts/${attemptId}`,
      providesTags: ["CBT"],
    }),
    saveCbtAnswers: build.mutation<
      ApiEnvelope<{
        saved: number;
        serverTime: string;
        expiresAt: string;
      }>,
      {
        attemptId: string;
        answers: { question: string; selectedAnswer: string }[];
      }
    >({
      query: ({ attemptId, answers }) => ({
        url: `/cbt/student/attempts/${attemptId}/answers`,
        method: "PATCH",
        body: { answers },
      }),
    }),
    submitCbtAttempt: build.mutation<
      ApiEnvelope<CbtResultPayload>,
      string
    >({
      query: (attemptId) => ({
        url: `/cbt/student/attempts/${attemptId}/submit`,
        method: "POST",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    getStudentCbtAttempts: build.query<
      PaginatedEnvelope<CbtAttemptListItem>,
      Params
    >({
      query: (params) => ({
        url: "/cbt/student/attempts",
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
    getCbtAttemptResult: build.query<
      ApiEnvelope<CbtResultPayload>,
      string
    >({
      query: (attemptId) => `/cbt/attempts/${attemptId}/result`,
      providesTags: ["CBT"],
    }),
    getStudentCbtAttemptsForStudent: build.query<
      PaginatedEnvelope<CbtAttemptListItem>,
      { studentId: string; params?: Record<string, unknown> }
    >({
      query: ({ studentId, params }) => ({
        url: `/cbt/students/${studentId}/attempts`,
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
  }),
});

const {
  useListCbtQuestionsQuery,
  useCreateCbtQuestionMutation,
  useUpdateCbtQuestionMutation,
  useDeleteCbtQuestionMutation,
  useListCbtExamsQuery,
  useGetCbtExamQuery,
  useCreateCbtExamMutation,
  useUpdateCbtExamMutation,
  useDeleteCbtExamMutation,
  usePublishCbtExamMutation,
  usePublishCbtResultsMutation,
  useGetCbtExamQuestionsQuery,
  useAttachCbtQuestionsMutation,
  useUpdateCbtExamQuestionMutation,
  useReorderCbtExamQuestionsMutation,
  useRemoveCbtExamQuestionMutation,
  useGetCbtExamAttemptsQuery,
  useGetStudentCbtExamsQuery,
  useStartCbtAttemptMutation,
  useGetStudentCbtAttemptQuery,
  useSaveCbtAnswersMutation,
  useSubmitCbtAttemptMutation,
  useGetStudentCbtAttemptsQuery,
  useGetCbtAttemptResultQuery,
  useGetStudentCbtAttemptsForStudentQuery,
} = cbtApi;

export {
  useListCbtQuestionsQuery,
  useCreateCbtQuestionMutation,
  useUpdateCbtQuestionMutation,
  useDeleteCbtQuestionMutation,
  useListCbtExamsQuery,
  useGetCbtExamQuery,
  useCreateCbtExamMutation,
  useUpdateCbtExamMutation,
  useDeleteCbtExamMutation,
  usePublishCbtExamMutation,
  usePublishCbtResultsMutation,
  useGetCbtExamQuestionsQuery,
  useAttachCbtQuestionsMutation,
  useUpdateCbtExamQuestionMutation,
  useReorderCbtExamQuestionsMutation,
  useRemoveCbtExamQuestionMutation,
  useGetCbtExamAttemptsQuery,
  useGetStudentCbtExamsQuery,
  useStartCbtAttemptMutation,
  useGetStudentCbtAttemptQuery,
  useSaveCbtAnswersMutation,
  useSubmitCbtAttemptMutation,
  useGetStudentCbtAttemptsQuery,
  useGetCbtAttemptResultQuery,
  useGetStudentCbtAttemptsForStudentQuery,
};

export function cbtErrorMessage(error: unknown): string {
  const candidate = error as {
    data?: { message?: string };
    message?: string;
  };
  return (
    candidate?.data?.message ??
    candidate?.message ??
    "Something went wrong. Please try again."
  );
}

export function cbtSubjectLabel(
  subject: CbtExam["classSubject"] | undefined,
): string {
  if (!subject || typeof subject === "string") return "—";
  const name =
    typeof subject.subject === "object" && subject.subject
      ? subject.subject.name ?? subject.subject.prefix ?? "Subject"
      : "Subject";
  const className =
    typeof subject.academicClass === "object" && subject.academicClass
      ? subject.academicClass.name
      : "";
  return className ? `${name} — ${className}` : name;
}
