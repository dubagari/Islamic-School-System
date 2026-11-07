import { z } from "zod";

// ======================================================
// Public School-Fee Lookup / Paystack Schemas
// ======================================================

export const publicSchoolFeeStudentSchema = z.object({
    applicationNumber: z
        .string()
        .trim()
        .min(3, "A valid application number is required.")
        .max(100),
    phone: z
        .string()
        .trim()
        .min(7, "A valid phone number is required.")
        .max(30),
});

export const lookupPublicSchoolFeeSummarySchema = publicSchoolFeeStudentSchema;

export const initializePublicSchoolFeePaymentSchema =
    publicSchoolFeeStudentSchema.extend({
        invoiceId: z.string().trim().min(1).optional(),
        email: z.string().trim().email().optional(),
    });

export const verifyPublicSchoolFeePaymentSchema =
    publicSchoolFeeStudentSchema.extend({
        reference: z
            .string()
            .trim()
            .min(1, "Payment reference is required."),
    });
