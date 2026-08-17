import express from "express";
import cors from "cors";
import errorMiddleware from "./middleware/errorMiddleware.js";

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





const app = express();

// ==========================================
// Middlewares
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Darul Ulum Management System API is running.",
    });
});

app.use("/api/v2/auth", authRoutes);

app.use("/api/v2/academic-sections", academicSectionRoutes);

app.use("/api/v2/academic-sessions", academicSessionRoutes);

app.use("/api/v2/academic-semesters", academicSemesterRoutes);

app.use("/api/v2/subjects", subjectRoutes);

app.use("/api/v2/academic-levels", academicLevelRoutes);

app.use("/api/v2/academic-classes", academicClassRoutes);

app.use("/api/v2/class-subjects", classSubjectRoutes);

app.use("/api/v2/teacher-assignments", teacherAssignmentRoutes);

app.use("/api/v2/teachers", teacherRoutes)

app.use("/api/v2/admission-applications", admissionApplicationRoutes);

app.use("/api/v2/student-registration", studentRegistrationRoutes);

app.use("/api/v2/admission-payments", admissionPaymentRoutes);

app.use("/api/v2/student-passwords",studentPasswordRoutes);

app.use("/api/v2/students",studentRoutes);







// ==========================================
// Global Error Handler
// ==========================================

app.use(errorMiddleware);

export default app;