import { baseApi, type ApiEnvelope } from "@/app/api";
import type { Pagination } from "@/types";

export type CbtQuestionType = "MultipleChoice" | "TrueFalse";
export type CbtDifficulty = "Easy" | "Medium" | "Hard";
export type CbtResultVisibility =
  | "AfterPublish"
  | "Immediate"
  | "Hidden";

export type CbtOption = {
  key: string;
  text: string;
};

export type CbtSubjectRef = {
  _id: string;
  name?: string;
  prefix?: string;
};

export type CbtQuestion = {
  _id: string;
  subject: CbtSubjectRef | string;
  questionText: string;
  type: CbtQuestionType;
  options: CbtOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: CbtDifficulty;
  defaultMarks: number;
  isActive: boolean;
  createdAt?: string;
};

export type CbtQuestionPayload = {
  subject: string;
  questionText: string;
  type: CbtQuestionType;
  options?: CbtOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: CbtDifficulty;
  defaultMarks?: number;
  isActive?: boolean;
};

export type CbtExamQuestion = {
  _id: string;
  exam: string;
  question: CbtQuestion | string;
  marks: number;
  order: number;
};

export type CbtExam = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  classSubject: string | {
    _id: string;
    subject?: CbtSubjectRef | string;
    academicClass?: { _id: string; name?: string } | string;
  };
  academicSession?: string | { _id: string; name?: string };
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
  linkedAssessment?: string | null;
  isPublished: boolean;
  isClosed: boolean;
  isActive: boolean;
  resultsPublished: boolean;
  questionCount?: number;
  createdAt?: string;
};

export type CbtExamPayload = {
  title: string;
  description?: string;
  instructions?: string;
  classSubject: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  passMark?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  resultVisibility?: CbtResultVisibility;
  allowReview?: boolean;
  linkedAssessment?: string | null;
};

export type CbtAttempt = {
  _id: string;
  exam:
    | string
    | {
        _id: string;
        title?: string;
        totalMarks?: number;
        passMark?: number;
      };
  student:
    | string
    | {
        _id: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        registrationNumber?: string;
      };
  attemptNumber: number;
  status: "InProgress" | "Submitted" | "Voided";
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  autoSubmitted?: boolean;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
};

export type CbtAttemptSummary = {
  attempts: number;
  submitted: number;
  inProgress: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
};

export type PaginatedEnvelope<T> = ApiEnvelope<unknown> & {
  data: T[];
  pagination: Pagination;
};

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
    listCbtQuestions: build.query<
      PaginatedEnvelope<CbtQuestion>,
      Record<string, unknown> | undefined
    >({
      query: (params) => ({
        url: "/cbt/questions",
        params: cleanParams(params),
      }),
      providesTags: ["CBT"],
    }),
    createCbtQuestion: build.mutation<
      ApiEnvelope<CbtQuestion>,
      CbtQuestionPayload
    >({
      query: (body) => ({ url: "/cbt/questions", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    updateCbtQuestion: build.mutation<
      ApiEnvelope<CbtQuestion>,
      { id: string; body: Partial<CbtQuestionPayload> }
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

    listCbtExams: build.query<
      PaginatedEnvelope<CbtExam>,
      Record<string, unknown> | undefined
    >({
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
    createCbtExam: build.mutation<ApiEnvelope<CbtExam>, CbtExamPayload>({
      query: (body) => ({ url: "/cbt/exams", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
    }),
    updateCbtExam: build.mutation<
      ApiEnvelope<CbtExam>,
      { id: string; body: Partial<CbtExamPayload> & { isClosed?: boolean } }
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
        totalMarks?: number;
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
      ApiEnvelope<CbtAttempt[]> & {
        pagination: Pagination;
        summary: CbtAttemptSummary;
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
    getCbtExamStatistics: build.query<
      ApiEnvelope<CbtAttemptSummary & { questionCount: number }>,
      string
    >({
      query: (id) => `/cbt/exams/${id}/statistics`,
      providesTags: ["CBT"],
    }),
    voidCbtAttempt: build.mutation<
      ApiEnvelope<CbtAttempt>,
      string
    >({
      query: (attemptId) => ({
        url: `/cbt/attempts/${attemptId}/void`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, error) => (error ? [] : ["CBT"]),
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
  useGetCbtExamStatisticsQuery,
  useVoidCbtAttemptMutation,
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
  useGetCbtExamStatisticsQuery,
  useVoidCbtAttemptMutation,
};

export function cbtSubjectLabel(
  subject: CbtSubjectRef | string | undefined,
): string {
  return typeof subject === "object" && subject
    ? subject.name ?? subject.prefix ?? "Subject"
    : "Subject";
}
