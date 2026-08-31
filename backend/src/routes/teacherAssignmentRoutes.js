
import express from "express";

import {
    createTeacherAssignmentController,
    getTeacherAssignmentsController,
    getTeacherAssignmentsByTeacherController,
    getTeacherAssignmentByIdController,
    updateTeacherAssignmentController,
    deleteTeacherAssignmentController,
    getMyTeacherAssignmentsController,
} from "../controllers/teacherAssignmentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Teacher Assignment Routes
// ===========================================================

// Create teacher assignment
router.post( "/", createTeacherAssignmentController);

// Get all teacher assignments
router.get("/", getTeacherAssignmentsController);


// Get assignments by teacher
router.get("/teacher/:teacher", getTeacherAssignmentsByTeacherController);

// ======================================================
// Teacher - Get My Assignments
// ======================================================

router.get("/my-assignments", protect, authorize("teacher"), getMyTeacherAssignmentsController);

// Get assignment by ID
router.get("/:id", getTeacherAssignmentByIdController);

// Update assignment
router.put("/:id", updateTeacherAssignmentController);

// Delete assignment
router.delete("/:id", deleteTeacherAssignmentController);



export default router;
