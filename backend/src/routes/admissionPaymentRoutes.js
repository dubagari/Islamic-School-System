import express from "express";

import {
    confirmCashPaymentController,
    initializePaystackPaymentController,
    verifyPaystackPaymentController,
} from "../controllers/admissionPaymentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
    applicationIdParams,
    confirmCashPaymentSchema,
    initializePaystackPaymentSchema,
    verifyPaystackPaymentSchema,
} from "../validators/paymentValidators.js";

const router = express.Router();

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

// ======================================================
// Public - Paystack Initialize
// ======================================================

router.post(
    "/paystack/initialize/:applicationId",
    paymentLimiter,
    validate(applicationIdParams, "params"),
    validate(initializePaystackPaymentSchema),
    initializePaystackPaymentController
);

// ======================================================
// Public - Paystack Verify
// ======================================================

router.post(
    "/paystack/verify",
    paymentLimiter,
    validate(verifyPaystackPaymentSchema),
    verifyPaystackPaymentController
);

export default router;
