import express from "express";
import cors from "cors";
import helmet from "helmet";

import errorMiddleware from "./middleware/errorMiddleware.js";
import requestSanitizer from "./middleware/requestSanitizer.js";
import auditLogger from "./middleware/auditLogger.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import AppError from "./utils/AppError.js";

import authRoutes from "./routes/authRoutes.js";

import academicSectionRoutes from "./routes/academicSectionRoutes.js";
import academicSessionRoutes from "./routes/academicSessionRoutes.js";
import academicSemesterRoutes from "./routes/AcademicSemesterRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import academicLevelRoutes from "./routes/academicLevelRoutes.js";
import academicClassRoutes from "./routes/academicClassRoutes.js";
import classSubjectRoutes from "./routes/classSubjectRoutes.js";
import teacherAssignmentRoutes from "./routes/teacherAssignmentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";

import admissionApplicationRoutes from "./routes/admissionApplicationRoutes.js";
import studentRegistrationRoutes from "./routes/studentRegistrationRoutes.js";
import admissionPaymentRoutes from "./routes/admissionPaymentRoutes.js";
import studentPasswordRoutes from "./routes/studentPasswordRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import studentEnrollmentRoutes from "./routes/studentEnrollmentRoutes.js";
import studentRecordRoutes from "./routes/studentRecordRoutes.js";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import teacherAttendanceRoutes from "./routes/teacherAttendanceRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import feeStructureRoutes from "./routes/feeStructureRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import parentAdminRoutes from "./routes/parentAdminRoutes.js";
import parentPortalRoutes from "./routes/parentPortalRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import userAdminRoutes from "./routes/userAdminRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

const app = express();

// ==========================================
// Security & Parsing Middleware
// ==========================================

app.set("trust proxy", 1);

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Postman, curl and server-to-server requests have no origin
            if (!origin || allowedOrigins.length === 0) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new AppError(
                    `Origin ${origin} is not allowed by CORS.`,
                    403
                )
            );
        },
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(requestSanitizer);
app.use(apiLimiter);
app.use(auditLogger);

// ==========================================
// Health Check
// ==========================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Darul Ulum Management System API is healthy.",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Darul Ulum Management System API is running.",
        version: "v2",
    });
});

// ==========================================
// Routes
// ==========================================

app.use("/api/v2/auth", authRoutes);

app.use("/api/v2/academic-sections", academicSectionRoutes);
app.use("/api/v2/academic-sessions", academicSessionRoutes);
app.use("/api/v2/academic-semesters", academicSemesterRoutes);
app.use("/api/v2/subjects", subjectRoutes);
app.use("/api/v2/academic-levels", academicLevelRoutes);
app.use("/api/v2/academic-classes", academicClassRoutes);
app.use("/api/v2/class-subjects", classSubjectRoutes);
app.use("/api/v2/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/v2/teachers", teacherRoutes);

app.use("/api/v2/admission-applications", admissionApplicationRoutes);
app.use("/api/v2/student-registration", studentRegistrationRoutes);
app.use("/api/v2/admission-payments", admissionPaymentRoutes);
app.use("/api/v2/student-passwords", studentPasswordRoutes);
app.use("/api/v2/students", studentRoutes);
app.use("/api/v2/student-enrollments", studentEnrollmentRoutes);
app.use("/api/v2/student-records", studentRecordRoutes);

app.use("/api/v2/attendance", attendanceRoutes);
app.use("/api/v2/teacher-attendance", teacherAttendanceRoutes);
app.use("/api/v2/assessments", assessmentRoutes);
app.use("/api/v2/results", resultRoutes);
app.use("/api/v2/fee-structures", feeStructureRoutes);
app.use("/api/v2/invoices", invoiceRoutes);
app.use("/api/v2/payments", paymentRoutes);
app.use("/api/v2/finance", financeRoutes);
app.use("/api/v2/parents", parentAdminRoutes);
app.use("/api/v2/parent", parentPortalRoutes);
app.use("/api/v2/announcements", announcementRoutes);
app.use("/api/v2/messages", messageRoutes);
app.use("/api/v2/notifications", notificationRoutes);
app.use("/api/v2/reports", reportsRoutes);
app.use("/api/v2/audit-logs", auditLogRoutes);
app.use("/api/v2/users", userAdminRoutes);
app.use("/api/v2/settings", settingsRoutes);
app.use("/api/v2/system", systemRoutes);

// ==========================================
// 404 Handler
// ==========================================

app.use((req, res, next) => {
    next(
        new AppError(
            `Route ${req.method} ${req.originalUrl} not found.`,
            404
        )
    );
});

// ==========================================
// Global Error Handler
// ==========================================

app.use(errorMiddleware);

export default app;
