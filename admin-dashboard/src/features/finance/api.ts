import { baseApi, type ApiEnvelope } from "@/app/api";
import type { ApiErrorPayload } from "@/types";

import type { AcademicClass, AcademicSession, AcademicSemester } from "@/features/students/api";

// ======================================================
// Types
// ======================================================

export type FeeType =
  | "Tuition"
  | "Registration"
  | "Exam"
  | "Books"
  | "Uniform"
  | "Transport"
  | "Hostel"
  | "Development"
  | "Other";

export const FEE_TYPES: FeeType[] = [
  "Tuition",
  "Registration",
  "Exam",
  "Books",
  "Uniform",
  "Transport",
  "Hostel",
  "Development",
  "Other",
];

export type PaymentMethod =
  | "Cash"
  | "Bank Transfer"
  | "Card"
  | "Paystack"
  | "Cheque"
  | "Other";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Paystack",
  "Cheque",
  "Other",
];

export type InvoiceStatus =
  | "Unpaid"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Cancelled";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "Unpaid",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
];

export type PaymentStatus = "Completed" | "Reversed";

export type FeeStructureRef = {
  _id: string;
  name: string;
  amount?: number;
};

export type FeeStructure = {
  _id: string;
  name: string;
  feeType: FeeType;
  description: string;
  amount: number;
  academicSession: AcademicSession | string;
  academicSemester: AcademicSemester | string;
  academicClass: AcademicClass | string;
  isActive: boolean;
  createdBy?: { _id: string; fullName?: string; username?: string } | string;
  createdAt?: string;
  updatedAt?: string;
};

export type FeeStructuresListParams = {
  page?: number;
  limit?: number;
  search?: string;
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  feeType?: FeeType | "";
  isActive?: "true" | "false" | "";
};

export type CreateFeeStructureBody = {
  name: string;
  feeType: FeeType;
  description?: string;
  amount: number;
  academicSession: string;
  academicSemester: string;
  academicClass: string;
  isActive?: boolean;
};

export type UpdateFeeStructureBody = {
  name?: string;
  feeType?: FeeType;
  description?: string;
  amount?: number;
  isActive?: boolean;
};

export type InvoiceStudentRef = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  registrationNumber: string;
};

export type InvoiceItem = {
  feeStructure?: FeeStructureRef | string | null;
  name: string;
  description: string;
  amount: number;
};

export type Invoice = {
  _id: string;
  invoiceNumber: string;
  student: InvoiceStudentRef | string;
  academicSession: AcademicSession | string;
  academicSemester: AcademicSemester | string;
  academicClass: AcademicClass | string;
  items: InvoiceItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  dueDate: string | null;
  notes: string;
  issuedBy?: { _id: string; fullName?: string; username?: string } | string;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoicesSummary = {
  totalBilled: number;
  totalPaid: number;
  totalBalance: number;
  invoices: number;
};

export type InvoicesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  student?: string;
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  status?: InvoiceStatus | "";
  from?: string;
  to?: string;
};

export type InvoicesListResponse = ApiEnvelope<Invoice[]> & {
  summary?: InvoicesSummary;
};

export type InvoiceDetailResponse = ApiEnvelope<Invoice> & {
  payments?: Payment[];
};

export type CreateInvoiceItemBody = {
  feeStructure?: string;
  name: string;
  description?: string;
  amount: number;
};

export type CreateInvoiceBody = {
  student: string;
  academicSession: string;
  academicSemester: string;
  academicClass?: string;
  items: CreateInvoiceItemBody[];
  dueDate?: string;
  notes?: string;
};

export type GenerateInvoicesBody = {
  academicSession: string;
  academicSemester: string;
  academicClass: string;
  studentIds?: string[];
  dueDate?: string;
  notes?: string;
};

export type GenerateInvoicesResult = {
  created: number;
  skipped: number;
  totalAmount: number;
  dueDate: string;
  invoices: Invoice[];
};

export type Payment = {
  _id: string;
  receiptNumber: string;
  invoice:
    | {
        _id: string;
        invoiceNumber: string;
        totalAmount: number;
        amountPaid: number;
        balance: number;
        status: InvoiceStatus;
        dueDate: string | null;
      }
    | string;
  student:
    | {
        _id: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        registrationNumber: string;
      }
    | string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  status: PaymentStatus;
  recordedBy?: { _id: string; fullName?: string; username?: string } | string;
  notes: string;
  reversedBy?: { _id: string; fullName?: string; username?: string } | string | null;
  reversedAt?: string | null;
  reversalReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentsSummary = {
  totalCollected: number;
  completedPayments: number;
};

export type PaymentsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  invoice?: string;
  student?: string;
  method?: PaymentMethod | "";
  status?: PaymentStatus | "";
  from?: string;
  to?: string;
};

export type PaymentsListResponse = ApiEnvelope<Payment[]> & {
  summary?: PaymentsSummary;
};

export type PaymentResponse = ApiEnvelope<Payment> & {
  invoice?: Invoice;
};

export type CreatePaymentBody = {
  invoice: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt?: string;
  notes?: string;
};

export type FinanceSummaryFilterParams = {
  academicSession?: string;
  academicSemester?: string;
  academicClass?: string;
  from?: string;
  to?: string;
};

export type FinanceSummary = {
  invoices: {
    count: number;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    byStatus: {
      Unpaid: number;
      "Partially Paid": number;
      Paid: number;
      Overdue: number;
      Cancelled: number;
    };
  };
  payments: {
    count: number;
    totalCollected: number;
    byMethod: { method: PaymentMethod; total: number; count: number }[];
  };
  collectionRate: number;
};

// ======================================================
// Helpers
// ======================================================

type QueryApiError = {
  status?: number | string;
  data?: ApiErrorPayload;
};

/** Maps `{ errors: [{field,message}] }` payloads into message + field map. */
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

/**
 * Documented amounts are plain Naira figures (see JSON examples in the API
 * reference). Decimals are shown only when the value actually has a
 * fractional part, so integer Naira values stay clean.
 */
export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

// ======================================================
// Endpoints
// ======================================================

const emptyParams = (params?: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "" && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
};

export const financeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ----- Section 9.1 — Fee structures (Admin) -----
    getFeeStructures: build.query<
      ApiEnvelope<FeeStructure[]>,
      FeeStructuresListParams | undefined
    >({
      query: (params) => ({
        url: "/fee-structures",
        params: emptyParams(params),
      }),
      providesTags: ["FeeStructures"],
    }),

    createFeeStructure: build.mutation<
      ApiEnvelope<FeeStructure>,
      CreateFeeStructureBody
    >({
      query: (body) => ({ url: "/fee-structures", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["FeeStructures", "Finance"],
    }),

    updateFeeStructure: build.mutation<
      ApiEnvelope<FeeStructure>,
      UpdateFeeStructureBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/fee-structures/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["FeeStructures", "Finance"],
    }),

    // ----- Section 9.2 — Invoices -----
    generateInvoices: build.mutation<
      ApiEnvelope<GenerateInvoicesResult>,
      GenerateInvoicesBody
    >({
      query: (body) => ({ url: "/invoices/generate", method: "POST", body }),
      invalidatesTags: (_result, error) =>
        error ? [] : ["Invoices", "Finance"],
    }),

    getInvoices: build.query<InvoicesListResponse, InvoicesListParams | undefined>(
      {
        query: (params) => ({
          url: "/invoices",
          params: emptyParams(params),
        }),
        providesTags: ["Invoices"],
      },
    ),

    getInvoice: build.query<InvoiceDetailResponse, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Invoices", id }],
    }),

    createInvoice: build.mutation<ApiEnvelope<Invoice>, CreateInvoiceBody>({
      query: (body) => ({ url: "/invoices", method: "POST", body }),
      invalidatesTags: (_result, error) => (error ? [] : ["Invoices", "Finance"]),
    }),

    cancelInvoice: build.mutation<
      ApiEnvelope<Invoice>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/invoices/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : ["Invoices", "Finance", { type: "Invoices", id }],
    }),

    // ----- Section 9.3 — Payments -----
    recordPayment: build.mutation<PaymentResponse, CreatePaymentBody>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      invalidatesTags: (_result, error, body) =>
        error
          ? []
          : ["Invoices", "Payments", "Finance", { type: "Invoices", id: body.invoice }],
    }),

    getPayments: build.query<PaymentsListResponse, PaymentsListParams | undefined>(
      {
        query: (params) => ({
          url: "/payments",
          params: emptyParams(params),
        }),
        providesTags: ["Payments"],
      },
    ),

    reversePayment: build.mutation<
      PaymentResponse,
      { id: string; invoiceId?: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/payments/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (_result, error, { invoiceId }) =>
        error
          ? []
          : [
              "Invoices",
              "Payments",
              "Finance",
              ...(invoiceId ? [{ type: "Invoices" as const, id: invoiceId }] : []),
            ],
    }),

    // ----- Section 9.4 — Finance reports (Admin) -----
    getFinanceSummary: build.query<
      ApiEnvelope<FinanceSummary>,
      FinanceSummaryFilterParams | undefined
    >({
      query: (params) => ({
        url: "/finance/summary",
        params: emptyParams(params),
      }),
      providesTags: ["Finance"],
    }),
  }),
});

const {
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useGenerateInvoicesMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useCancelInvoiceMutation,
  useRecordPaymentMutation,
  useGetPaymentsQuery,
  useReversePaymentMutation,
  useGetFinanceSummaryQuery,
} = financeApi;

export {
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useGenerateInvoicesMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useCancelInvoiceMutation,
  useRecordPaymentMutation,
  useGetPaymentsQuery,
  useReversePaymentMutation,
  useGetFinanceSummaryQuery,
};
