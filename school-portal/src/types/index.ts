export type Role = "admin" | "teacher" | "student" | "parent";

export type User = {
  _id: string;
  fullName: string;
  email?: string;
  username: string;
  role: Role;
  teacher?: string | null;
  student?: string | null;
  parent?: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin?: string | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiErrorPayload = {
  success: false;
  message: string;
  code?: string;
  errors?: { field: string; message: string }[];
};

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.fieldErrors = payload.errors?.reduce(
      (acc, e) => {
        acc[e.field] = e.message;
        return acc;
      },
      {} as Record<string, string>,
    );
  }
}
