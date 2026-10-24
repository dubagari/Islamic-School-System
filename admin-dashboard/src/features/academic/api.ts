import { baseApi, type ApiEnvelope } from "@/app/api";

export type UserAccount = {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  role?: string;
  isActive: boolean;
};

export type AcademicSectionRecord = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
};

export type AcademicLevelRecord = {
  _id: string;
  name: string;
  levelNumber: number;
  section: AcademicSectionRecord | string;
  description?: string;
  isActive: boolean;
};

export type AcademicSessionRecord = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

export type SemesterName = "First Semester" | "Second Semester";

export type AcademicSemesterRecord = {
  _id: string;
  name: SemesterName;
  academicSession: AcademicSessionRecord | string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
};

export type AcademicClassRecord = {
  _id: string;
  name: string;
  academicLevel: AcademicLevelRecord | string;
  capacity?: number;
  classTeacher?: UserAccount | string | null;
  description?: string;
  isActive: boolean;
};

export type SubjectRecord = {
  _id: string;
  name: string;
  prefix: string;
  section: AcademicSectionRecord | string;
  description?: string;
  isActive: boolean;
};

export type ClassSubjectRecord = {
  _id: string;
  courseCode?: string;
  academicClass: AcademicClassRecord | string;
  subject: SubjectRecord | string;
  academicSemester: AcademicSemesterRecord | string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

export type TeacherAssignmentRecord = {
  _id: string;
  teacher: UserAccount | string;
  classSubject: ClassSubjectRecord | string;
  assignedDate: string;
  isActive: boolean;
  createdAt?: string;
};

export type CreateSectionBody = {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateSectionBody = Partial<CreateSectionBody>;

export type CreateLevelBody = {
  name: string;
  levelNumber: number;
  section: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateLevelBody = Partial<CreateLevelBody>;

export type CreateSessionBody = {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
};

export type UpdateSessionBody = Partial<CreateSessionBody>;

export type CreateSemesterBody = {
  name: SemesterName;
  academicSession: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
};

export type UpdateSemesterBody = Partial<CreateSemesterBody>;

export type CreateClassBody = {
  name: string;
  academicLevel: string;
  capacity: number;
  classTeacher?: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateClassBody = Partial<CreateClassBody>;

export type CreateSubjectBody = {
  name: string;
  prefix: string;
  section: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateSubjectBody = Partial<CreateSubjectBody>;

export type CreateClassSubjectBody = {
  academicClass: string;
  subject: string;
  academicSemester: string;
  description?: string;
  isActive?: boolean;
  courseCode?: string;
};

export type UpdateClassSubjectBody = Partial<CreateClassSubjectBody>;

export type CreateTeacherAssignmentBody = {
  teacher: string;
  classSubject: string;
  assignedDate?: string;
  isActive?: boolean;
};

export type UpdateTeacherAssignmentBody = Partial<CreateTeacherAssignmentBody>;

export type StructuralListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type LevelsListParams = StructuralListParams & { section?: string };

export type SemestersListParams = StructuralListParams & {
  academicSession?: string;
};

export type ClassSubjectsListParams = {
  page?: number;
  limit?: number;
  class?: string;
  semester?: string;
  subject?: string;
  courseCode?: string;
  isActive?: boolean;
};

export type TeacherAssignmentsListParams = {
  page?: number;
  limit?: number;
  teacher?: string;
  classSubject?: string;
  isActive?: boolean;
};

export type UsersListParams = {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

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

export function refId(
  value: { _id: string } | string | null | undefined,
): string {
  return isPopulated(value) ? value._id : (value as string) ?? "";
}

type RtkErrorShape = {
  status?: number;
  data?: {
    message?: string;
    errors?: { field: string; message: string }[];
  };
};

export function apiErrorInfo(err: unknown): {
  message: string;
  status?: number;
  fieldErrors: Record<string, string>;
} {
  const shape = (err ?? {}) as RtkErrorShape;
  const fieldErrors: Record<string, string> = {};

  if (shape.data?.errors?.length) {
    for (const fe of shape.data.errors) {
      if (fe?.field) fieldErrors[fe.field] = fe.message;
    }
  }

  const message =
    shape.data?.message ?? (err as Error | undefined)?.message ?? "Request failed.";
  const status = shape.status;

  if (status === 409 && Object.keys(fieldErrors).length === 0) {
    fieldErrors.name = message;
  }

  return { message, status, fieldErrors };
}

function buildParams(params?: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

const structureTags = (error: unknown) =>
  error ? [] : (["AcademicStructure"] as const);

const cascadeTags = (error: unknown) =>
  error
    ? []
    : (["AcademicStructure", "ClassSubjects", "TeacherAssignments"] as const);

const academicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listAcademicSections: build.query<
      ApiEnvelope<AcademicSectionRecord[]>,
      StructuralListParams | undefined
    >({
      query: (params) => ({
        url: "/academic-sections",
        params: buildParams(params),
      }),
      providesTags: ["AcademicStructure"],
    }),
    createAcademicSection: build.mutation<
      ApiEnvelope<AcademicSectionRecord>,
      CreateSectionBody
    >({
      query: (body) => ({ url: "/academic-sections", method: "POST", body }),
      invalidatesTags: structureTags,
    }),
    updateAcademicSection: build.mutation<
      ApiEnvelope<AcademicSectionRecord>,
      UpdateSectionBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic-sections/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: structureTags,
    }),
    deleteAcademicSection: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/academic-sections/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listAcademicLevels: build.query<
      ApiEnvelope<AcademicLevelRecord[]>,
      LevelsListParams | undefined
    >({
      query: (params) => ({
        url: "/academic-levels",
        params: buildParams(params),
      }),
      providesTags: ["AcademicStructure"],
    }),
    createAcademicLevel: build.mutation<
      ApiEnvelope<AcademicLevelRecord>,
      CreateLevelBody
    >({
      query: (body) => ({ url: "/academic-levels", method: "POST", body }),
      invalidatesTags: structureTags,
    }),
    updateAcademicLevel: build.mutation<
      ApiEnvelope<AcademicLevelRecord>,
      UpdateLevelBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic-levels/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: structureTags,
    }),
    deleteAcademicLevel: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/academic-levels/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listAcademicSessions: build.query<
      ApiEnvelope<AcademicSessionRecord[]>,
      StructuralListParams | undefined
    >({
      query: (params) => ({
        url: "/academic-sessions",
        params: buildParams(params),
      }),
      providesTags: ["AcademicStructure"],
    }),
    createAcademicSession: build.mutation<
      ApiEnvelope<AcademicSessionRecord>,
      CreateSessionBody
    >({
      query: (body) => ({ url: "/academic-sessions", method: "POST", body }),
      invalidatesTags: cascadeTags,
    }),
    updateAcademicSession: build.mutation<
      ApiEnvelope<AcademicSessionRecord>,
      UpdateSessionBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic-sessions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: cascadeTags,
    }),
    deleteAcademicSession: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/academic-sessions/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listAcademicSemesters: build.query<
      ApiEnvelope<AcademicSemesterRecord[]>,
      SemestersListParams | undefined
    >({
      query: (params) => ({
        url: "/academic-semesters",
        params: buildParams(params),
      }),
      providesTags: ["AcademicStructure"],
    }),
    createAcademicSemester: build.mutation<
      ApiEnvelope<AcademicSemesterRecord>,
      CreateSemesterBody
    >({
      query: (body) => ({ url: "/academic-semesters", method: "POST", body }),
      invalidatesTags: cascadeTags,
    }),
    updateAcademicSemester: build.mutation<
      ApiEnvelope<AcademicSemesterRecord>,
      UpdateSemesterBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic-semesters/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: cascadeTags,
    }),
    deleteAcademicSemester: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/academic-semesters/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listAcademicClasses: build.query<
      ApiEnvelope<AcademicClassRecord[]>,
      StructuralListParams | undefined
    >({
      query: (params) => ({
        url: "/academic-classes",
        params: buildParams(params),
      }),
      providesTags: ["AcademicStructure"],
    }),
    createAcademicClass: build.mutation<
      ApiEnvelope<AcademicClassRecord>,
      CreateClassBody
    >({
      query: (body) => ({ url: "/academic-classes", method: "POST", body }),
      invalidatesTags: cascadeTags,
    }),
    updateAcademicClass: build.mutation<
      ApiEnvelope<AcademicClassRecord>,
      UpdateClassBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/academic-classes/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: cascadeTags,
    }),
    deleteAcademicClass: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/academic-classes/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listSubjects: build.query<
      ApiEnvelope<SubjectRecord[]>,
      StructuralListParams | undefined
    >({
      query: (params) => ({ url: "/subjects", params: buildParams(params) }),
      providesTags: ["AcademicStructure"],
    }),
    createSubject: build.mutation<ApiEnvelope<SubjectRecord>, CreateSubjectBody>({
      query: (body) => ({ url: "/subjects", method: "POST", body }),
      invalidatesTags: structureTags,
    }),
    updateSubject: build.mutation<
      ApiEnvelope<SubjectRecord>,
      UpdateSubjectBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/subjects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: structureTags,
    }),
    deleteSubject: build.mutation<ApiEnvelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/subjects/${id}`, method: "DELETE" }),
      invalidatesTags: cascadeTags,
    }),

    listClassSubjects: build.query<
      ApiEnvelope<ClassSubjectRecord[]>,
      ClassSubjectsListParams | undefined
    >({
      query: (params) => ({
        url: "/class-subjects",
        params: buildParams(params),
      }),
      providesTags: ["ClassSubjects"],
    }),
    createClassSubject: build.mutation<
      ApiEnvelope<ClassSubjectRecord>,
      CreateClassSubjectBody
    >({
      query: (body) => ({ url: "/class-subjects", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["ClassSubjects", "TeacherAssignments"] as const),
    }),
    updateClassSubject: build.mutation<
      ApiEnvelope<ClassSubjectRecord>,
      UpdateClassSubjectBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/class-subjects/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["ClassSubjects", "TeacherAssignments"] as const),
    }),
    deleteClassSubject: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/class-subjects/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["ClassSubjects", "TeacherAssignments"] as const),
    }),

    listTeacherAssignments: build.query<
      ApiEnvelope<TeacherAssignmentRecord[]>,
      TeacherAssignmentsListParams | undefined
    >({
      query: (params) => ({
        url: "/teacher-assignments",
        params: buildParams(params),
      }),
      providesTags: ["TeacherAssignments"],
    }),
    createTeacherAssignment: build.mutation<
      ApiEnvelope<TeacherAssignmentRecord>,
      CreateTeacherAssignmentBody
    >({
      query: (body) => ({ url: "/teacher-assignments", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["TeacherAssignments"] as const),
    }),
    updateTeacherAssignment: build.mutation<
      ApiEnvelope<TeacherAssignmentRecord>,
      UpdateTeacherAssignmentBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/teacher-assignments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["TeacherAssignments"] as const),
    }),
    deleteTeacherAssignment: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      string
    >({
      query: (id) => ({ url: `/teacher-assignments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error) =>
        error ? [] : (["TeacherAssignments"] as const),
    }),

    listTeacherUsers: build.query<ApiEnvelope<UserAccount[]>, UsersListParams | void>({
      query: (params) => ({
        url: "/users",
        params: buildParams({ role: "teacher", limit: 200, ...params }),
      }),
      providesTags: ["Users"],
    }),
  }),
});

const {
  useListAcademicSectionsQuery,
  useCreateAcademicSectionMutation,
  useUpdateAcademicSectionMutation,
  useDeleteAcademicSectionMutation,
  useListAcademicLevelsQuery,
  useCreateAcademicLevelMutation,
  useUpdateAcademicLevelMutation,
  useDeleteAcademicLevelMutation,
  useListAcademicSessionsQuery,
  useCreateAcademicSessionMutation,
  useUpdateAcademicSessionMutation,
  useDeleteAcademicSessionMutation,
  useListAcademicSemestersQuery,
  useCreateAcademicSemesterMutation,
  useUpdateAcademicSemesterMutation,
  useDeleteAcademicSemesterMutation,
  useListAcademicClassesQuery,
  useCreateAcademicClassMutation,
  useUpdateAcademicClassMutation,
  useDeleteAcademicClassMutation,
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useListClassSubjectsQuery,
  useCreateClassSubjectMutation,
  useUpdateClassSubjectMutation,
  useDeleteClassSubjectMutation,
  useListTeacherAssignmentsQuery,
  useCreateTeacherAssignmentMutation,
  useUpdateTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
  useListTeacherUsersQuery,
} = academicApi;

export {
  useListAcademicSectionsQuery,
  useCreateAcademicSectionMutation,
  useUpdateAcademicSectionMutation,
  useDeleteAcademicSectionMutation,
  useListAcademicLevelsQuery,
  useCreateAcademicLevelMutation,
  useUpdateAcademicLevelMutation,
  useDeleteAcademicLevelMutation,
  useListAcademicSessionsQuery,
  useCreateAcademicSessionMutation,
  useUpdateAcademicSessionMutation,
  useDeleteAcademicSessionMutation,
  useListAcademicSemestersQuery,
  useCreateAcademicSemesterMutation,
  useUpdateAcademicSemesterMutation,
  useDeleteAcademicSemesterMutation,
  useListAcademicClassesQuery,
  useCreateAcademicClassMutation,
  useUpdateAcademicClassMutation,
  useDeleteAcademicClassMutation,
  useListSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useListClassSubjectsQuery,
  useCreateClassSubjectMutation,
  useUpdateClassSubjectMutation,
  useDeleteClassSubjectMutation,
  useListTeacherAssignmentsQuery,
  useCreateTeacherAssignmentMutation,
  useUpdateTeacherAssignmentMutation,
  useDeleteTeacherAssignmentMutation,
  useListTeacherUsersQuery,
};

export function sectionLabel(value: AcademicSectionRecord | string | null | undefined): string {
  return isPopulated(value) ? value.name : (value as string) ?? "—";
}

export function levelLabel(value: AcademicLevelRecord | string | null | undefined): string {
  return isPopulated(value) ? value.name : (value as string) ?? "—";
}

export function academicClassLabel(
  value: AcademicClassRecord | string | null | undefined,
): string {
  if (!isPopulated(value)) return "—";
  const level = value.academicLevel;
  const levelName = isPopulated(level) ? level.name : undefined;
  return levelName ? `${levelName} — ${value.name}` : value.name;
}

export function subjectLabel(value: SubjectRecord | string | null | undefined): string {
  return isPopulated(value) ? value.name : (value as string) ?? "—";
}

export function teacherUserLabel(
  value: UserAccount | string | null | undefined,
): string {
  if (!isPopulated(value)) return value ? String(value) : "—";
  return value.fullName || value.username;
}

export function classSubjectLabel(
  value: ClassSubjectRecord | string | null | undefined,
): string {
  if (!isPopulated(value)) return "—";
  const subject = isPopulated(value.subject) ? value.subject.name : "—";
  const klass = academicClassLabel(value.academicClass);
  const semester = isPopulated(value.academicSemester)
    ? value.academicSemester.name
    : "—";
  return `${subject} · ${klass} · ${semester}`;
}

export function semesterSessionId(
  value: AcademicSemesterRecord | null | undefined,
): string {
  return value ? refId(value.academicSession) : "";
}

