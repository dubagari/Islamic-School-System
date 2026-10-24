import express from "express";

import {
    markTeacherAttendanceController,
    getTeacherAttendanceController,
    getTeacherAttendanceSummaryController,
    updateTeacherAttendanceController,
    deleteTeacherAttendanceController,
} from "../controllers/attendanceController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    markTeacherAttendanceSchema,
    teacherAttendanceQuerySchema,
    updateTeacherAttendanceSchema,
} from "../validators/attendanceValidators.js";

const router = express.Router();

// ======================================================
// Teacher Attendance Routes
// ======================================================

router.post(
    "/bulk",
    protect,
    authorize("admin"),
    validate(markTeacherAttendanceSchema),
    markTeacherAttendanceController
);

router.get(
    "/me",
    protect,
    authorize("teacher"),
    validate(teacherAttendanceQuerySchema, "query"),
    getTeacherAttendanceController
);

router.get(
    "/summary",
    protect,
    authorize("admin"),
    validate(teacherAttendanceQuerySchema, "query"),
    getTeacherAttendanceSummaryController
);

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(teacherAttendanceQuerySchema, "query"),
    getTeacherAttendanceController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateTeacherAttendanceSchema),
    updateTeacherAttendanceController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteTeacherAttendanceController
);

export default router;
