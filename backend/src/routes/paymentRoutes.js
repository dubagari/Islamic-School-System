import express from "express";

import {
    createPaymentController,
    getPaymentsController,
    getPaymentByIdController,
    reversePaymentController,
} from "../controllers/financeController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createPaymentSchema,
    paymentQuerySchema,
    reversePaymentSchema,
} from "../validators/financeValidators.js";
import {
    initializeSchoolFeePaymentController,
    verifySchoolFeePaymentController,
} from "../controllers/schoolFeePaymentController.js";
import {
    initializeSchoolFeePaymentSchema,
    verifySchoolFeePaymentSchema,
} from "../validators/schoolFeePaymentValidators.js";

const router = express.Router();

router.use(protect);

router.post(
    "/school-fees/paystack/initialize/:invoiceId",
    authorize("super_admin", "student", "parent"),
    validate(idParam("invoiceId"), "params"),
    validate(initializeSchoolFeePaymentSchema),
    initializeSchoolFeePaymentController
);

router.post(
    "/school-fees/paystack/verify",
    authorize("super_admin", "student", "parent"),
    validate(verifySchoolFeePaymentSchema),
    verifySchoolFeePaymentController
);

router.post(
    "/",
    authorize("super_admin"),
    validate(createPaymentSchema),
    createPaymentController
);

router.get(
    "/",
    authorize("super_admin", "student", "parent"),
    validate(paymentQuerySchema, "query"),
    getPaymentsController
);

router.get(
    "/:id",
    authorize("super_admin", "student", "parent"),
    validate(idParam("id"), "params"),
    getPaymentByIdController
);

router.post(
    "/:id/reverse",
    authorize("super_admin"),
    validate(idParam("id"), "params"),
    validate(reversePaymentSchema),
    reversePaymentController
);

export default router;
