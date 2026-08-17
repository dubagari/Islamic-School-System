import express from "express";

import {
    createClassSubjectController,
    getClassSubjectsController,
    getClassSubjectsBySectionController,
    getClassSubjectByIdController,
    updateClassSubjectController,
    deleteClassSubjectController,
} from "../controllers/classSubjectController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Subject Routes
// ======================================================

// Create Subject
router.post("/", protect, createClassSubjectController);

// Get All Subjects
router.get(
    "/",
    protect,
    getClassSubjectsController
);

// Get Subjects By Section
router.get(
    "/section/:section",
    protect,
    getClassSubjectsBySectionController
);

// Get Subject By ID
router.get(
    "/:id",
    protect,
    getClassSubjectByIdController
);

// Update Subject
router.put(
    "/:id",
    protect,
    updateClassSubjectController
);

// Delete Subject
router.delete(
    "/:id",
    protect,
    deleteClassSubjectController
);

export default router;