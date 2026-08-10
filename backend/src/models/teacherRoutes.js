
import express from "express";

import {
    createTeacherController,
    getTeachersController,
    getTeacherByIdController,
    getTeacherByNumberController,
    updateTeacherController,
    deleteTeacherController,
} from "../controllers/teacherController.js";

const router = express.Router();

// ======================================================
// Teacher Routes
// ======================================================

// Create teacher
router.post(
    "/",
    createTeacherController
);

// Get all teachers
router.get(
    "/",
    getTeachersController
);

// Get teacher by teacher number
// Keep this BEFORE /:id
router.get(
    "/number/:teacherNumber",
    getTeacherByNumberController
);

// Get teacher by ID
router.get(
    "/:id",
    getTeacherByIdController
);

// Update teacher
router.put(
    "/:id",
    updateTeacherController
);

// Delete teacher
router.delete(
    "/:id",
    deleteTeacherController
);

export default router;
