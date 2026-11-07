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

export const applicationNumberParams = z.object({
    applicationNumber: z.string().trim().min(3).max(100),
});

export const phoneQuerySchema = z.object({
    phone: z.string().trim().min(7).max(30),
});

export const initializePaystackPaymentSchema = z.object({
    applicationNumber: z.string().trim().min(3).max(100),
    phone: z.string().trim().min(7).max(30),
    email: z.string().trim().email("Invalid email address.").optional(),
});

export const verifyPaystackPaymentSchema = z.object({
    reference: z.string().trim().min(1, "Payment reference is required."),
    phone: z.string().trim().min(7).max(30),
});
