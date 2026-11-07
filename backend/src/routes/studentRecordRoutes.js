import express from "express";

import {
    createStudentRecordController,
    getAllStudentRecordsController,
    getStudentRecordByIdController,
    getStudentRecordHistoryController,
    updateStudentRecordController,
    deactivateStudentRecordController,
} from "../controllers/studentRecordController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam, paginationQuery } from "../validators/common.js";
import {
    createStudentRecordSchema,
    updateStudentRecordSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Admin - Create Student Record
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createStudentRecordSchema),
    createStudentRecordController
);

// ======================================================
// Admin - List Student Records
// ======================================================

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(paginationQuery, "query"),
    getAllStudentRecordsController
);

// ======================================================
// Admin - Student Record History
// IMPORTANT: Keep this before /:id
// ======================================================

router.get(
    "/student/:studentId/history",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    getStudentRecordHistoryController
);

// ======================================================
// Admin - Get Record By ID
// ======================================================

router.get(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    getStudentRecordByIdController
);

// ======================================================
// Admin - Update Record
// ======================================================

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateStudentRecordSchema),
    updateStudentRecordController
);

// ======================================================
// Admin - Deactivate Record
// ======================================================

router.put(
    "/:id/deactivate",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deactivateStudentRecordController
);

export default router;
