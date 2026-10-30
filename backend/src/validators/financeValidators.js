import { z } from "zod";

import { dateString, objectId } from "./common.js";

export const feeType = z.enum([
    "Tuition",
    "Registration",
    "Exam",
    "Books",
    "Uniform",
    "Transport",
    "Hostel",
    "Development",
    "Other",
]);

export const paymentMethod = z.enum([
    "Cash",
    "Bank Transfer",
    "Card",
    "Paystack",
    "Cheque",
    "Other",
]);

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

const dateRangeRefinement = (query) =>
    !query.from ||
    !query.to ||
    Date.parse(query.from) <= Date.parse(query.to);

const dateRangeMessage = {
    message: "The from date must be on or before the to date.",
    path: ["from"],
};

// ======================================================
// Fee Structures
// ======================================================

export const createFeeStructureSchema = z.object({
    name: z.string().trim().min(1).max(150),
    feeType: feeType.optional(),
    description: z.string().trim().max(500).optional(),
    amount: z.coerce.number().min(0),
    academicSession: objectId,
    academicSemester: objectId,
    academicClass: objectId,
    isActive: z.boolean().optional(),
});

export const updateFeeStructureSchema = z
    .object({
        name: z.string().trim().min(1).max(150).optional(),
        feeType: feeType.optional(),
        description: z.string().trim().max(500).optional(),
        amount: z.coerce.number().min(0).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const feeStructureQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        feeType: feeType.optional(),
        isActive: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

// ======================================================
// Invoices
// ======================================================

const invoiceItemsSchema = z
    .array(
        z.object({
            feeStructure: objectId.optional(),
            name: z.string().trim().min(1).max(150),
            description: z
                .string()
                .trim()
                .max(500)
                .optional(),
            amount: z.coerce.number().min(0),
        })
    )
    .min(1, "At least one invoice item is required.")
    .max(50);

export const createInvoiceSchema = z.object({
    student: objectId,
    academicSession: objectId,
    academicSemester: objectId,
    academicClass: objectId.optional(),
    items: invoiceItemsSchema,
    dueDate: dateString.optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const generateInvoicesSchema = z.object({
    academicSession: objectId,
    academicSemester: objectId,
    academicClass: objectId,
    studentIds: z.array(objectId).max(1000).optional(),
    dueDate: dateString.optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const updateInvoiceSchema = z
    .object({
        dueDate: dateString.nullable().optional(),
        notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const invoiceQuerySchema = z
    .object({
        student: objectId.optional(),
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        status: z
            .enum([
                "Unpaid",
                "Partially Paid",
                "Paid",
                "Overdue",
                "Cancelled",
            ])
            .optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const cancelInvoiceSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});

// ======================================================
// Payments
// ======================================================

export const createPaymentSchema = z.object({
    invoice: objectId,
    amount: z.coerce.number().positive(),
    method: paymentMethod,
    reference: z.string().trim().max(150).optional(),
    paidAt: dateString.optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const paymentQuerySchema = z
    .object({
        invoice: objectId.optional(),
        student: objectId.optional(),
        method: paymentMethod.optional(),
        status: z
            .enum(["Completed", "Reversed"])
            .optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const reversePaymentSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});

// ======================================================
// Finance Reports
// ======================================================

export const financeSummaryQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        from: dateString.optional(),
        to: dateString.optional(),
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const collectionsQuerySchema = z
    .object({
        from: dateString.optional(),
        to: dateString.optional(),
        groupBy: z.enum(["day", "month", "method"]).optional(),
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

export const outstandingQuerySchema = z
    .object({
        academicSession: objectId.optional(),
        academicSemester: objectId.optional(),
        academicClass: objectId.optional(),
        ...paginationFields,
    })
    .passthrough();
