import express from "express";

import {
    createAcademicLevelController,
    getAcademicLevelsController,
    getAcademicLevelByIdController,
    updateAcademicLevelController,
    deleteAcademicLevelController,
} from "../controllers/academicLevelController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Academic Level Routes
// ======================================================

// Create Academic Level
router.post(
    "/",
    protect,
    authorize("admin"),
    createAcademicLevelController
);

// Get All Academic Levels
router.get(
    "/",
    protect,
    getAcademicLevelsController
);

// Get Academic Level By ID
router.get(
    "/:id",
    protect,
    getAcademicLevelByIdController
);

// Update Academic Level
router.patch(
    "/:id",
    protect,
    authorize("admin"),
    updateAcademicLevelController
);

// Delete Academic Level
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteAcademicLevelController
);

export default router;