import express from "express";

import {
    markStudentAttendanceController,
    getClassAttendanceController,
    getStudentAttendanceController,
    getClassAttendanceSummaryController,
    updateStudentAttendanceController,
    deleteStudentAttendanceController,
} from "../controllers/attendanceController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    markStudentAttendanceSchema,
    studentAttendanceQuerySchema,
    updateStudentAttendanceSchema,
} from "../validators/attendanceValidators.js";

const router = express.Router();

// ======================================================
// Student Attendance Routes
// ======================================================

router.post(
    "/bulk",
    protect,
    authorize("admin", "teacher"),
    validate(markStudentAttendanceSchema),
    markStudentAttendanceController
);

router.get(
    "/class/:academicClass/summary",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("academicClass"), "params"),
    validate(studentAttendanceQuerySchema, "query"),
    getClassAttendanceSummaryController
);

router.get(
    "/class/:academicClass",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("academicClass"), "params"),
    validate(studentAttendanceQuerySchema, "query"),
    getClassAttendanceController
);

router.get(
    "/student/:studentId",
    protect,
    authorize("admin", "teacher", "student", "parent"),
    validate(idParam("studentId"), "params"),
    validate(studentAttendanceQuerySchema, "query"),
    getStudentAttendanceController
);

router.patch(
    "/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(updateStudentAttendanceSchema),
    updateStudentAttendanceController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteStudentAttendanceController
);

export default router;
