import { z } from "zod";

// ======================================================
// School Fee Paystack Payment Schemas
// ======================================================

export const initializeSchoolFeePaymentSchema = z
    .object({
        email: z
            .string()
            .trim()
            .email()
            .optional(),
    })
    .passthrough();

export const verifySchoolFeePaymentSchema = z.object({
    reference: z
        .string()
        .trim()
        .min(1, "Payment reference is required."),
});
