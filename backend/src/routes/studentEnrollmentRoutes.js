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

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Admin - Create Student Enrollment
// ======================================================

router.post("/",protect,authorize("admin"),createStudentEnrollmentController);

// ======================================================
// Admin - Get All Student Enrollments
// ======================================================

router.get("/",protect,authorize("admin"),getAllStudentEnrollmentsController);

// ======================================================
// Admin - Get Student Enrollment History
// IMPORTANT: Keep these before /:enrollmentId
// ======================================================

router.get("/student/:studentId/current",protect,authorize("admin"),getCurrentStudentEnrollmentController);

// ======================================================
// Admin - Get Enrollment By ID
// ======================================================

router.get("/student/:studentId",protect,authorize("admin"),getStudentEnrollmentHistoryController);

// ======================================================
// Admin - Get Current Student Enrollment
// ======================================================

// ======================================================
// Get Student Enrollment History
// Admin
// ======================================================

router.get("/student/:studentId/history",protect,authorize("admin"),getStudentEnrollmentHistoryController);

router.get("/:enrollmentId",protect,authorize("admin"),getStudentEnrollmentByIdController);


// ======================================================
// Deactivate Student Enrollment
// Admin
// ======================================================

router.put("/:id/deactivate",protect,authorize("admin"),deactivateStudentEnrollmentController);

// ======================================================
// Admin - Update Enrollment
// ======================================================
 
router.put("/:enrollmentId",protect,authorize("admin"),updateStudentEnrollmentController);

// ======================================================
// Admin - Deactivate Enrollment
// ======================================================

router.delete("/:enrollmentId",protect,authorize("admin"),deactivateStudentEnrollmentController);

export default router;