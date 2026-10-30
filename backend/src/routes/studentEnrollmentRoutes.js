import express from "express";

import {
    createStudentEnrollmentController,
    getAllStudentEnrollmentsController,
    getStudentEnrollmentByIdController,
    getStudentEnrollmentHistoryController,
    getCurrentStudentEnrollmentController,
    updateStudentEnrollmentController,
    deactivateStudentEnrollmentController,
} from "../controllers/studentEnrollmentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam, paginationQuery } from "../validators/common.js";
import {
    createStudentEnrollmentSchema,
    updateStudentEnrollmentSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Admin - Create Enrollment
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createStudentEnrollmentSchema),
    createStudentEnrollmentController
);

// ======================================================
// Admin - List Enrollments
// ======================================================

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(paginationQuery, "query"),
    getAllStudentEnrollmentsController
);

// ======================================================
// Admin - Student Enrollment History
// IMPORTANT: Keep these before /:enrollmentId
// ======================================================

router.get(
    "/student/:studentId/current",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    getCurrentStudentEnrollmentController
);

router.get(
    "/student/:studentId/history",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    getStudentEnrollmentHistoryController
);

router.get(
    "/student/:studentId",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    getStudentEnrollmentHistoryController
);

// ======================================================
// Admin - Get Enrollment By ID
// ======================================================

router.get(
    "/:enrollmentId",
    protect,
    authorize("admin"),
    validate(idParam("enrollmentId"), "params"),
    getStudentEnrollmentByIdController
);

// ======================================================
// Admin - Update Enrollment
// ======================================================

router.put(
    "/:enrollmentId",
    protect,
    authorize("admin"),
    validate(idParam("enrollmentId"), "params"),
    validate(updateStudentEnrollmentSchema),
    updateStudentEnrollmentController
);

// ======================================================
// Admin - Deactivate Enrollment
// ======================================================

router.put(
    "/:enrollmentId/deactivate",
    protect,
    authorize("admin"),
    validate(idParam("enrollmentId"), "params"),
    deactivateStudentEnrollmentController
);

router.delete(
    "/:enrollmentId",
    protect,
    authorize("admin"),
    validate(idParam("enrollmentId"), "params"),
    deactivateStudentEnrollmentController
);

export default router;
