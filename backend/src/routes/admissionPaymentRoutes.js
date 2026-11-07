import express from "express";

import {
    confirmCashPaymentController,
    getAdmissionPaymentLetterController,
    getAdmissionPaymentSummaryController,
    initializePaystackPaymentController,
    paystackWebhookController,
    verifyPaystackPaymentController,
} from "../controllers/admissionPaymentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
    applicationIdParams,
    applicationNumberParams,
    confirmCashPaymentSchema,
    initializePaystackPaymentSchema,
    phoneQuerySchema,
    verifyPaystackPaymentSchema,
} from "../validators/paymentValidators.js";

const router = express.Router();

// ======================================================
// Public - admission payment summary
// ======================================================

router.get(
    "/admission/:applicationNumber",
    paymentLimiter,
    validate(applicationNumberParams, "params"),
    validate(phoneQuerySchema, "query"),
    getAdmissionPaymentSummaryController
);

// ======================================================
// Public - admission letter (approved + paid only)
// ======================================================

router.get(
    "/admission/:applicationNumber/letter",
    paymentLimiter,
    validate(applicationNumberParams, "params"),
    validate(phoneQuerySchema, "query"),
    getAdmissionPaymentLetterController
);

// ======================================================
// Public - Paystack payment
// ======================================================

router.post(
    "/paystack/initialize",
    paymentLimiter,
    validate(initializePaystackPaymentSchema),
    initializePaystackPaymentController
);

router.post(
    "/paystack/verify",
    paymentLimiter,
    validate(verifyPaystackPaymentSchema),
    verifyPaystackPaymentController
);

// ======================================================
// Public - Paystack webhook
// ======================================================

router.post(
    "/paystack/webhook",
    paymentLimiter,
    paystackWebhookController
);

// ======================================================
// Admin - Confirm Cash Payment
// ======================================================

router.post(
    "/cash/:applicationId",
    protect,
    authorize("admin"),
    paymentLimiter,
    validate(applicationIdParams, "params"),
    validate(confirmCashPaymentSchema),
    confirmCashPaymentController
);

export default router;
