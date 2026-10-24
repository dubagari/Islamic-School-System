import express from "express";

import {
    getDashboardReportController,
    getEnrollmentReportController,
    getAttendanceReportController,
    getAcademicReportController,
    getFinanceReportController,
    getStudentRosterReportController,
    getTeacherWorkloadReportController,
} from "../controllers/reportsController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
    academicReportQuerySchema,
    attendanceReportQuerySchema,
    dashboardQuerySchema,
    enrollmentReportQuerySchema,
    financeReportQuerySchema,
    studentRosterQuerySchema,
    teacherWorkloadQuerySchema,
} from "../validators/reportsValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
    "/dashboard",
    validate(dashboardQuerySchema, "query"),
    getDashboardReportController
);

router.get(
    "/enrollment",
    validate(enrollmentReportQuerySchema, "query"),
    getEnrollmentReportController
);

router.get(
    "/attendance",
    validate(attendanceReportQuerySchema, "query"),
    getAttendanceReportController
);

router.get(
    "/academics",
    validate(academicReportQuerySchema, "query"),
    getAcademicReportController
);

router.get(
    "/finance",
    validate(financeReportQuerySchema, "query"),
    getFinanceReportController
);

router.get(
    "/students",
    validate(studentRosterQuerySchema, "query"),
    getStudentRosterReportController
);

router.get(
    "/teachers",
    validate(teacherWorkloadQuerySchema, "query"),
    getTeacherWorkloadReportController
);

export default router;
