import { z } from "zod";

import { objectId } from "./common.js";

// ======================================================
// Cash Payment
// ======================================================

export const confirmCashPaymentSchema = z.object({
    amount: z.coerce
        .number()
        .positive("A valid payment amount is required."),
    paymentReference: z.string().trim().max(100).optional(),
});

export const applicationIdParams = z.object({
    applicationId: objectId,
});

// ======================================================
// Paystack Payment
// ======================================================

export const initializePaystackPaymentSchema = z.object({
    amount: z.coerce
        .number()
        .positive("A valid payment amount is required."),
    email: z.string().trim().email("Invalid email address.").optional(),
});

export const verifyPaystackPaymentSchema = z.object({
    reference: z.string().trim().min(1, "Payment reference is required."),
});
