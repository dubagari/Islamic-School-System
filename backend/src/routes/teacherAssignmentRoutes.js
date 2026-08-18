
import express from "express";

import {
    createTeacherAssignmentController,
    getTeacherAssignmentsController,
    getTeacherAssignmentsByTeacherController,
    getTeacherAssignmentByIdController,
    updateTeacherAssignmentController,
    deleteTeacherAssignmentController,
} from "../controllers/teacherAssignmentController.js";

const router = express.Router();

// ======================================================
// Teacher Assignment Routes
// ===========================================================

// Create teacher assignment
router.post(
    "/",
    createTeacherAssignmentController
);

// Get all teacher assignments
router.get(
    "/",
    getTeacherAssignmentsController
);

// Get assignments by teacher
router.get(
    "/teacher/:teacher",
    getTeacherAssignmentsByTeacherController
);

// Get assignment by ID
router.get(
    "/:id",
    getTeacherAssignmentByIdController
);

// Update assignment
router.put(
    "/:id",
    updateTeacherAssignmentController
);

// Delete assignment
router.delete(
    "/:id",
    deleteTeacherAssignmentController
);

export default router;
