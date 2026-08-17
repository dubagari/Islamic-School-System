import express from "express";

import {
    createTeacherController,
    getTeachersController,
    getTeacherByIdController,
    getTeacherByNumberController,
    updateTeacherController,
    deleteTeacherController,
    getTeacherProfileController,
    getTeacherDashboardController,
} from "../controllers/teacherController.js";

import {    protect,    authorize,} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Admin - Create Teacher
// ======================================================

router.post("/", protect, authorize("admin"), createTeacherController);


// ======================================================
// Teacher - Get Own Profile
// ======================================================

router.get("/profile", protect, authorize("teacher"), getTeacherProfileController);


// ======================================================
// Teacher - Dashboard
// ======================================================

router.get("/dashboard", protect, authorize("teacher"), getTeacherDashboardController);

// ======================================================
// Admin - Get All Teachers
// ======================================================

router.get("/", protect, authorize("admin"), getTeachersController);

// ======================================================
// Admin - Get Teacher By Number
// ======================================================

router.get("/number/:teacherNumber", protect, authorize("admin"), getTeacherByNumberController);

// ======================================================
// Admin - Get Teacher By ID
// ======================================================

router.get("/:id", protect, authorize("admin"), getTeacherByIdController);

// ======================================================
// Admin - Update Teacher
// ======================================================

router.put("/:id", protect, authorize("admin"), updateTeacherController);

// ======================================================
// Admin - Delete Teacher
// ======================================================

router.delete("/:id", protect, authorize("admin"), deleteTeacherController);

export default router;