import express from "express";

import {
    createAcademicSessionController,
    getAcademicSessionsController,
    getAcademicSessionByIdController,
    updateAcademicSessionController,
    deleteAcademicSessionController,
} from "../controllers/academicSessionController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Academic Session Routes
// ======================================================

router.post("/", protect, authorize("admin"), createAcademicSessionController);

router.get("/", protect, getAcademicSessionsController);

router.get("/:id", protect, getAcademicSessionByIdController);

router.patch("/:id", protect, authorize("admin"), updateAcademicSessionController);

router.delete("/:id", protect, authorize("admin"), deleteAcademicSessionController
);

export default router;