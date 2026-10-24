import { baseApi, type ApiEnvelope } from "@/app/api";
import type { ApiErrorPayload } from "@/types";

// ======================================================
// Types
// ======================================================

export type TeacherStatus =
  | "Active"
  | "Suspended"
  | "Retired"
  | "Resigned"
  | "Terminated";

export type TeacherEmploymentType =
  | "Full Time"
  | "Contract"
  | "Part-Time"
  | "Temporary"
  | "Volunteer";

export type TeacherUserAccount = {
  _id: string;
  username: string;
  email?: string | null;
  role: "admin" | "teacher" | "student" | "parent";
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string | null;
};

export type Teacher = {
  _id: string;
  teacherNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: "Male" | "Female";
  dateOfBirth?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  employmentDate?: string | null;
  status: TeacherStatus;
  statusReason?: string | null;
  statusDate?: string | null;
  employmentType: TeacherEmploymentType;
  user?: TeacherUserAccount | string | null;
  isActive: boolean;
  createdAt?: string;
};

export type CreateTeacherPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "Male" | "Female";
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  qualification?: string;
  specialization?: string;
  employmentDate?: string;
  employmentType?: TeacherEmploymentType;
};

export type UpdateTeacherPayload = Partial<CreateTeacherPayload> & {
  status?: TeacherStatus;
  statusReason?: string;
  isActive?: boolean;
};

export type CreateTeacherResponse = {
  teacher: Teacher;
  login: {
    username: string;
    defaultPassword: string;
    mustChangePassword: boolean;
  };
};

export type ParentUserSummary = {
  _id: string;
  fullName: string;
  username: string;
  email?: string | null;
  role: "parent";
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string | null;
};

export type ParentChild = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  registrationNumber: string;
  status: string;
  isActive: boolean;
  academicClass?:
    | {
        _id: string;
        name: string;
        academicLevel?: { _id: string; name: string } | null;
      }
    | string
    | null;
};

export type ParentPlan = {
  _id: string;
  user: ParentUserSummary | string;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  occupation?: string | null;
  students: ParentChild[] | string[];
  isActive: boolean;
  createdAt?: string;
};

export type CreateParentPayload = {
  fullName: string;
  username: string;
  email?: string;
  password: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  occupation?: string;
  studentIds: string[];
};

export type UpdateParentPayload = Partial<
  Omit<CreateParentPayload, "username" | "password" | "studentIds">
> & {
  isActive?: boolean;
};

export type ClassSubjectSummary = {
  _id: string;
  academicClass?:
    | {
        _id: string;
        name: string;
        levelNumber?: number;
        section?: string;
        academicLevel?: { _id: string; name: string } | null;
      }
    | string
    | null;
  subject?: { _id: string; name: string; prefix?: string } | string | null;
  academicSemester?: { _id: string; name: string } | string | null;
};

export type TeacherAssignment = {
  _id: string;
  teacher: string;
  classSubject: ClassSubjectSummary | string;
  assignedDate?: string | null;
  isActive: boolean;
  assignedBy?: { _id: string; fullName: string } | string | null;
};

export type TeacherAttendanceSummaryRow = {
  teacherId: string;
  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    teacherNumber: string;
  } | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  leave: number;
  total: number;
  attendanceRate: number;
};

export type UsersAdminUser = {
  _id: string;
  fullName: string;
  username: string;
  email?: string | null;
  role: "admin" | "teacher" | "student" | "parent";
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string | null;
  teacher?:
    | {
        _id: string;
        teacherNumber: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        status: TeacherStatus;
        isActive: boolean;
      }
    | string
    | null;
  student?:
    | {
        _id: string;
        registrationNumber: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        status: string;
        isActive: boolean;
      }
    | string
    | null;
  parent?: { _id: string; phone: string; isActive: boolean } | string | null;
};

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
};

export type ResetUserPasswordResponse = {
  user: UsersAdminUser;
  temporaryPassword: string | null;
};

export type SimpleStudent = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  registrationNumber: string;
  status: string;
  isActive: boolean;
};

// ======================================================
// Error helpers (envelope: { message, errors: [{field, message}] })
// ======================================================

function errorPayload(error: unknown): ApiErrorPayload | null {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    (error as { data?: unknown }).data &&
    typeof (error as { data: unknown }).data === "object"
  ) {
    return (error as { data: ApiErrorPayload }).data;
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof Error && error.message) {
    const payload = errorPayload(error);
    return payload?.message ?? error.message;
  }

  return errorPayload(error)?.message ?? fallback;
}

export function getApiFieldErrors(
  error: unknown,
): Record<string, string> {
  const payload = errorPayload(error);

  if (!payload?.errors?.length) {
    return {};
  }

  return payload.errors.reduce<Record<string, string>>((acc, item) => {
    if (!acc[item.field]) {
      acc[item.field] = item.message;
    }
    return acc;
  }, {});
}

// ======================================================
// Endpoints
// ======================================================

const injectedApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Teachers (docs 6.4) -----
    listTeachers: build.query<
      ApiEnvelope<Teacher[]>,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: TeacherStatus;
        employmentType?: TeacherEmploymentType;
        isActive?: boolean;
      }
    >({
      query: (params) => ({
        url: "/teachers",
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search || undefined,
          status: params.status,
          employmentType: params.employmentType,
          isActive: params.isActive,
        },
      }),
      providesTags: ["Teachers"],
    }),
    createTeacher: build.mutation<ApiEnvelope<CreateTeacherResponse>, CreateTeacherPayload>({
      query: (body) => ({ url: "/teachers", method: "POST", body }),
      invalidatesTags: ["Teachers"],
    }),
    getTeacher: build.query<ApiEnvelope<Teacher>, string>({
      query: (id) => `/teachers/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Teachers", id }],
    }),
    updateTeacher: build.mutation<
      ApiEnvelope<Teacher>,
      { id: string; body: UpdateTeacherPayload }
    >({
      query: ({ id, body }) => ({ url: `/teachers/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => ["Teachers", { type: "Teachers", id }],
    }),
    deactivateTeacher: build.mutation<ApiEnvelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/teachers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Teachers"],
    }),

    // ----- Teacher assignments for a teacher (docs 4.8) -----
    listTeacherAssignmentsByTeacher: build.query<ApiEnvelope<TeacherAssignment[]>, string>({
      query: (teacherUserId) => `/teacher-assignments/teacher/${teacherUserId}`,
      providesTags: (_result, _error, teacherUserId) => [
        { type: "TeacherAssignments", id: `teacher:${teacherUserId}` },
      ],
    }),

    // ----- Teacher attendance summary (docs 7.2) -----
    teacherAttendanceSummary: build.query<
      ApiEnvelope<TeacherAttendanceSummaryRow[]>,
      { teacher: string; from?: string; to?: string }
    >({
      query: (params) => ({ url: "/teacher-attendance/summary", params }),
      providesTags: ["TeacherAttendance"],
    }),

    // ----- Parent administration (docs 10.1) -----
    listParents: build.query<
      ApiEnvelope<ParentPlan[]>,
      { page?: number; limit?: number; search?: string; isActive?: boolean }
    >({
      query: (params) => ({
        url: "/parents",
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          isActive: params.isActive === undefined ? undefined : String(params.isActive),
        },
      }),
      providesTags: ["Parents"],
    }),
    getParent: build.query<ApiEnvelope<ParentPlan>, string>({
      query: (id) => `/parents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Parents", id }],
    }),
    createParent: build.mutation<ApiEnvelope<ParentPlan>, CreateParentPayload>({
      query: (body) => ({ url: "/parents", method: "POST", body }),
      invalidatesTags: ["Parents"],
    }),
    updateParent: build.mutation<
      ApiEnvelope<ParentPlan>,
      { id: string; body: UpdateParentPayload }
    >({
      query: ({ id, body }) => ({ url: `/parents/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => ["Parents", { type: "Parents", id }],
    }),
    deactivateParent: build.mutation<ApiEnvelope<Record<string, unknown>>, string>({
      query: (id) => ({ url: `/parents/${id}`, method: "DELETE" }),
      invalidatesTags: ["Parents"],
    }),
    linkParentStudents: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      { id: string; studentIds: string[] }
    >({
      query: ({ id, studentIds }) => ({
        url: `/parents/${id}/students`,
        method: "POST",
        body: { studentIds },
      }),
      invalidatesTags: ["Parents"],
    }),
    unlinkParentStudent: build.mutation<
      ApiEnvelope<Record<string, unknown>>,
      { id: string; studentId: string }
    >({
      query: ({ id, studentId }) => ({
        url: `/parents/${id}/students/${studentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Parents"],
    }),

    // ----- Students lookup (docs 6.1) -----
    listStudentsBasic: build.query<
      ApiEnvelope<SimpleStudent[]>,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({ url: "/students", params }),
      providesTags: ["Students"],
    }),

    // ----- Users (docs 13.1) -----
    listUsers: build.query<
      ApiEnvelope<UsersAdminUser[]>,
      {
        page?: number;
        limit?: number;
        search?: string;
        role?: "admin" | "teacher" | "student" | "parent" | "all";
        isActive?: boolean;
      }
    >({
      query: (params) => ({
        url: "/users",
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          role: params.role === "all" ? undefined : params.role,
          isActive: params.isActive === undefined ? undefined : String(params.isActive),
        },
      }),
      providesTags: ["Users"],
    }),
    getUser: build.query<ApiEnvelope<UsersAdminUser>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    updateUser: build.mutation<
      ApiEnvelope<UsersAdminUser>,
      { id: string; body: UpdateUserPayload }
    >({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        "Users",
        "Auth",
        { type: "User", id },
      ],
    }),
    resetUserPassword: build.mutation<
      ApiEnvelope<ResetUserPasswordResponse>,
      { id: string; newPassword?: string }
    >({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: "POST",
        body: newPassword ? { newPassword } : {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Users",
        { type: "User", id },
      ],
    }),
    deactivateUser: build.mutation<ApiEnvelope<UsersAdminUser>, string>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useListTeachersQuery,
  useCreateTeacherMutation,
  useGetTeacherQuery,
  useUpdateTeacherMutation,
  useDeactivateTeacherMutation,
  useListTeacherAssignmentsByTeacherQuery,
  useTeacherAttendanceSummaryQuery,
  useListParentsQuery,
  useGetParentQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeactivateParentMutation,
  useLinkParentStudentsMutation,
  useUnlinkParentStudentMutation,
  useListStudentsBasicQuery,
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
  useDeactivateUserMutation,
} = injectedApi;
