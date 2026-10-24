import { baseApi, type ApiEnvelope } from "@/app/api";
import type { ApiErrorPayload } from "@/types";

// ======================================================
// Types
// ======================================================

export type AdmissionApplicationStatus = "Pending" | "Approved" | "Rejected";
export type AdmissionPaymentStatus = "Pending" | "Paid" | "Failed" | "Cancelled";

export type AdmissionApplication = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  email?: string | null;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  relationship: string;
  currentLevel: string;
  previousMadrasa?: string | null;
  photoUrl?: string | null;
  applicationNumber?: string;
  status: AdmissionApplicationStatus;
  statusReason?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  paymentStatus: AdmissionPaymentStatus;
  paymentMethod?: "Paystack" | "Cash" | null;
  paymentReference?: string | null;
  paymentAmount?: number;
  paidAt?: string | null;
  registrationNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdmissionApplicationParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdmissionApplicationStatus;
  paymentStatus?: AdmissionPaymentStatus;
};

export type CreateAdmissionApplicationPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
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
  photoUrl?: string;
};

export type RegisteredStudent = {
  _id: string;
  registrationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  currentLevel?: string;
};

export type StudentRegistrationResult = {
  student: RegisteredStudent;
  login: {
    username: string;
    defaultPassword: string;
    mustChangePassword: boolean;
  };
};

export type PaystackInitResult = {
  authorizationUrl: string;
  accessCode?: string;
  reference: string;
  amount: number;
  applicationNumber?: string;
};

// ======================================================
// Helpers
// ======================================================

type QueryApiError = {
  status?: number | string;
  data?: ApiErrorPayload;
};

export function toFieldErrors(error: unknown): {
  message: string;
  fields: Record<string, string>;
} {
  const apiError = (error ?? {}) as QueryApiError;
  const data = apiError.data;

  const fields = ((data && "errors" in data ? data.errors : []) ?? []).reduce<
    Record<string, string>
  >((acc, entry) => {
    if (entry && typeof entry.field === "string") {
      acc[entry.field] = entry.message;
    }
    return acc;
  }, {});

  return {
    message: data?.message ?? "Request failed",
    fields,
  };
}

// Documented amounts are plain Naira figures (the backend multiplies
// by 100 for kobo when talking to Paystack), so a plain Naira format
// is used instead of Intl currency formatting.
export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `₦${amount.toLocaleString()}`;
}

// ======================================================
// Endpoints
// ======================================================

export const admissionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdmissions: build.query<
      ApiEnvelope<AdmissionApplication[]>,
      AdmissionApplicationParams
    >({
      query: (params) => {
        const search = new URLSearchParams();

        if (params.page !== undefined) search.set("page", String(params.page));
        if (params.limit !== undefined)
          search.set("limit", String(params.limit));
        if (params.search) search.set("search", params.search);
        if (params.status) search.set("status", params.status);
        if (params.paymentStatus)
          search.set("paymentStatus", params.paymentStatus);

        const qs = search.toString();
        return { url: `/admission-applications${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Admissions"],
    }),

    getAdmission: build.query<ApiEnvelope<AdmissionApplication>, string>({
      query: (id) => `/admission-applications/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Admission", id }],
    }),

    createAdmission: build.mutation<
      ApiEnvelope<AdmissionApplication>,
      CreateAdmissionApplicationPayload
    >({
      query: (body) => ({
        url: "/admission-applications",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admissions"],
    }),

    approveAdmission: build.mutation<
      ApiEnvelope<AdmissionApplication>,
      string
    >({
      query: (id) => ({
        url: `/admission-applications/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Admissions",
        { type: "Admission", id },
      ],
    }),

    rejectAdmission: build.mutation<
      ApiEnvelope<AdmissionApplication>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admission-applications/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Admissions",
        { type: "Admission", id },
      ],
    }),

    confirmCashPayment: build.mutation<
      ApiEnvelope<AdmissionApplication>,
      { applicationId: string; amount: number; paymentReference?: string }
    >({
      query: ({ applicationId, ...body }) => ({
        url: `/admission-payments/cash/${applicationId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        "Admissions",
        { type: "Admission", id: applicationId },
      ],
    }),

    initializePaystackPayment: build.mutation<
      ApiEnvelope<PaystackInitResult>,
      { applicationId: string; amount: number; email?: string }
    >({
      query: ({ applicationId, ...body }) => ({
        url: `/admission-payments/paystack/initialize/${applicationId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { applicationId }) => [
        "Admissions",
        { type: "Admission", id: applicationId },
      ],
    }),

    verifyPaystackPayment: build.mutation<
      ApiEnvelope<AdmissionApplication>,
      { reference: string }
    >({
      query: ({ reference }) => ({
        url: "/admission-payments/paystack/verify",
        method: "POST",
        body: { reference },
      }),
      invalidatesTags: ["Admissions", "Admission"],
    }),

    registerStudent: build.mutation<
      ApiEnvelope<StudentRegistrationResult>,
      string
    >({
      query: (applicationId) => ({
        url: `/student-registration/${applicationId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, applicationId) => [
        "Admissions",
        { type: "Admission", id: applicationId },
      ],
    }),
  }),
});

const {
  useGetAdmissionsQuery,
  useGetAdmissionQuery,
  useCreateAdmissionMutation,
  useApproveAdmissionMutation,
  useRejectAdmissionMutation,
  useConfirmCashPaymentMutation,
  useInitializePaystackPaymentMutation,
  useVerifyPaystackPaymentMutation,
  useRegisterStudentMutation,
} = admissionsApi;

export {
  useGetAdmissionsQuery,
  useGetAdmissionQuery,
  useCreateAdmissionMutation,
  useApproveAdmissionMutation,
  useRejectAdmissionMutation,
  useConfirmCashPaymentMutation,
  useInitializePaystackPaymentMutation,
  useVerifyPaystackPaymentMutation,
  useRegisterStudentMutation,
};
