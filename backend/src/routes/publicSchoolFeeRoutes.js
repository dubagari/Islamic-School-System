import express from "express";

import {
    initializePublicSchoolFeePaymentController,
    lookupPublicSchoolFeeSummaryController,
    verifyPublicSchoolFeePaymentController,
} from "../controllers/publicSchoolFeeController.js";

import { paymentLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";

import {
    initializePublicSchoolFeePaymentSchema,
    lookupPublicSchoolFeeSummarySchema,
    verifyPublicSchoolFeePaymentSchema,
} from "../validators/publicSchoolFeeValidators.js";

const router = express.Router();

// Public - application-number school fee lookup
router.post(
    "/lookup",
    paymentLimiter,
    validate(lookupPublicSchoolFeeSummarySchema),
    lookupPublicSchoolFeeSummaryController
);

// Public - Paystack school fee initialization
router.post(
    "/paystack/initialize",
    paymentLimiter,
    validate(initializePublicSchoolFeePaymentSchema),
    initializePublicSchoolFeePaymentController
);

// Public - Paystack school fee verification
router.post(
    "/paystack/verify",
    paymentLimiter,
    validate(verifyPublicSchoolFeePaymentSchema),
    verifyPublicSchoolFeePaymentController
);

export default router;
