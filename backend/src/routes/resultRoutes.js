import express from "express";

import {
    computeClassResultsController,
    getClassResultsController,
    getStudentResultsController,
    publishResultsController,
    getReportCardController,
    getTranscriptController,
} from "../controllers/resultController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    computeResultsSchema,
    publishResultsSchema,
    reportCardQuerySchema,
    resultQuerySchema,
    transcriptQuerySchema,
} from "../validators/assessmentValidators.js";

const router = express.Router();

// ======================================================
// Result Computation / Publishing
// ======================================================

router.post(
    "/compute",
    protect,
    authorize("admin", "teacher"),
    validate(computeResultsSchema),
    computeClassResultsController
);

router.post(
    "/publish",
    protect,
    authorize("admin"),
    validate(publishResultsSchema),
    publishResultsController
);

// ======================================================
// Result Lookups
// ======================================================

router.get(
    "/class/:classSubject",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("classSubject"), "params"),
    validate(resultQuerySchema, "query"),
    getClassResultsController
);

router.get(
    "/student/:studentId",
    protect,
    authorize("admin", "teacher", "student", "parent"),
    validate(idParam("studentId"), "params"),
    validate(resultQuerySchema, "query"),
    getStudentResultsController
);

router.get(
    "/report-card/:studentId",
    protect,
    authorize("admin", "teacher", "student", "parent"),
    validate(idParam("studentId"), "params"),
    validate(reportCardQuerySchema, "query"),
    getReportCardController
);

router.get(
    "/transcript/:studentId",
    protect,
    authorize("admin", "teacher", "student", "parent"),
    validate(idParam("studentId"), "params"),
    validate(transcriptQuerySchema, "query"),
    getTranscriptController
);

export default router;
