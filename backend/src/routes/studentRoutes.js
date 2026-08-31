import express from "express";

import {
    getAllStudentsController,
    getStudentByIdController,
    getStudentProfileController,
    getStudentDashboardController,
} from "../controllers/studentController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Student - Get Dashboard
// ======================================================

router.get("/dashboard", protect, authorize("student"), getStudentDashboardController);

// ======================================================
// Student - Get Own Profile
// ======================================================

router.get("/profile", protect, authorize("student"), getStudentProfileController);

// ======================================================
// Admin - Get All Students
// ======================================================

router.get("/", protect, authorize("admin"), getAllStudentsController);

// ======================================================
// Admin - Get Student By ID
// ======================================================

router.get("/:studentId", protect, authorize("admin"), getStudentByIdController);

export default router;