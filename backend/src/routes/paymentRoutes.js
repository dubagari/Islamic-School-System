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

const router = express.Router();

router.use(protect);

router.post(
    "/",
    authorize("admin"),
    validate(createPaymentSchema),
    createPaymentController
);

router.get(
    "/",
    authorize("admin", "student", "parent"),
    validate(paymentQuerySchema, "query"),
    getPaymentsController
);

router.get(
    "/:id",
    authorize("admin", "student", "parent"),
    validate(idParam("id"), "params"),
    getPaymentByIdController
);

router.post(
    "/:id/reverse",
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(reversePaymentSchema),
    reversePaymentController
);

export default router;
