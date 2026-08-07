import express from "express";

import {
    createAcademicSectionController,
    getAcademicSectionsController,
    getAcademicSectionByIdController,
    updateAcademicSectionController,
    deleteAcademicSectionController,
} from "../controllers/academicSectionController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Academic Section Routes
// ======================================================

router.post("/", protect, authorize("admin"), createAcademicSectionController);

router.get("/", protect, getAcademicSectionsController);

router.get("/:id", protect, getAcademicSectionByIdController);

router.patch("/:id", protect, authorize("admin"), updateAcademicSectionController);

router.delete("/:id", protect, authorize("admin"), deleteAcademicSectionController);

export default router;