import express from "express";

import {
    getParentProfileController,
    getParentChildrenController,
    getParentDashboardController,
    getParentChildOverviewController,
    getParentChildAttendanceController,
    getParentChildResultsController,
    getParentChildReportCardController,
    getParentChildTranscriptController,
    getParentChildFeesController,
    getParentChildInvoicesController,
    getParentChildPaymentsController,
} from "../controllers/parentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import { studentAttendanceQuerySchema } from "../validators/attendanceValidators.js";
import {
    reportCardQuerySchema,
    resultQuerySchema,
    transcriptQuerySchema,
} from "../validators/assessmentValidators.js";
import {
    invoiceQuerySchema,
    paymentQuerySchema,
} from "../validators/financeValidators.js";

const router = express.Router();

router.use(protect, authorize("parent"));

router.get("/profile", getParentProfileController);

router.get("/children", getParentChildrenController);

router.get("/dashboard", getParentDashboardController);

router.get(
    "/children/:studentId/attendance",
    validate(idParam("studentId"), "params"),
    validate(studentAttendanceQuerySchema, "query"),
    getParentChildAttendanceController
);

router.get(
    "/children/:studentId/results",
    validate(idParam("studentId"), "params"),
    validate(resultQuerySchema, "query"),
    getParentChildResultsController
);

router.get(
    "/children/:studentId/report-card",
    validate(idParam("studentId"), "params"),
    validate(reportCardQuerySchema, "query"),
    getParentChildReportCardController
);

router.get(
    "/children/:studentId/transcript",
    validate(idParam("studentId"), "params"),
    validate(transcriptQuerySchema, "query"),
    getParentChildTranscriptController
);

router.get(
    "/children/:studentId/fees",
    validate(idParam("studentId"), "params"),
    validate(invoiceQuerySchema, "query"),
    getParentChildFeesController
);

router.get(
    "/children/:studentId/invoices",
    validate(idParam("studentId"), "params"),
    validate(invoiceQuerySchema, "query"),
    getParentChildInvoicesController
);

router.get(
    "/children/:studentId/payments",
    validate(idParam("studentId"), "params"),
    validate(paymentQuerySchema, "query"),
    getParentChildPaymentsController
);

router.get(
    "/children/:studentId",
    validate(idParam("studentId"), "params"),
    getParentChildOverviewController
);

export default router;
