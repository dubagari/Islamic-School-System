import express from "express";

import {
    createInvoiceController,
    generateInvoicesController,
    getInvoicesController,
    getInvoiceByIdController,
    updateInvoiceController,
    cancelInvoiceController,
    deleteInvoiceController,
    getInvoicePaymentsController,
    getStudentFeeSummaryController,
} from "../controllers/financeController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    cancelInvoiceSchema,
    createInvoiceSchema,
    generateInvoicesSchema,
    invoiceQuerySchema,
    updateInvoiceSchema,
} from "../validators/financeValidators.js";

const router = express.Router();

router.use(protect);

router.post(
    "/generate",
    authorize("super_admin"),
    validate(generateInvoicesSchema),
    generateInvoicesController
);

router.post(
    "/",
    authorize("super_admin"),
    validate(createInvoiceSchema),
    createInvoiceController
);

router.get(
    "/student/:studentId/summary",
    authorize("super_admin", "student", "parent"),
    validate(idParam("studentId"), "params"),
    validate(invoiceQuerySchema, "query"),
    getStudentFeeSummaryController
);

router.get(
    "/",
    authorize("super_admin", "student", "parent"),
    validate(invoiceQuerySchema, "query"),
    getInvoicesController
);

router.get(
    "/:id/payments",
    authorize("super_admin", "student", "parent"),
    validate(idParam("id"), "params"),
    getInvoicePaymentsController
);

router.get(
    "/:id",
    authorize("super_admin", "student", "parent"),
    validate(idParam("id"), "params"),
    getInvoiceByIdController
);

router.patch(
    "/:id",
    authorize("super_admin"),
    validate(idParam("id"), "params"),
    validate(updateInvoiceSchema),
    updateInvoiceController
);

router.post(
    "/:id/cancel",
    authorize("super_admin"),
    validate(idParam("id"), "params"),
    validate(cancelInvoiceSchema),
    cancelInvoiceController
);

router.delete(
    "/:id",
    authorize("super_admin"),
    validate(idParam("id"), "params"),
    deleteInvoiceController
);

export default router;
