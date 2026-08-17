import express from "express";

import {
    createSubjectController,
    getSubjectsController,
    getSubjectByIdController,
    updateSubjectController,
    deleteSubjectController,
} from "../controllers/subjectController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Subject Routes
// ======================================================

// Create Subject
router.post("/", protect,authorize("admin"),createSubjectController);

// Get All Subjects
router.get("/", protect, getSubjectsController);

// Get Subject By ID
router.get("/:id", protect, getSubjectByIdController);

// Update Subject
router.patch("/:id",protect,authorize("admin"),updateSubjectController);

// Delete Subject
router.delete("/:id",protect,authorize("admin"),deleteSubjectController);

export default router;