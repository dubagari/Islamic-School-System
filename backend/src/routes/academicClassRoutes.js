import express from "express";

import {
    createAcademicClassController,
    getAcademicClassesController,
    getAcademicClassesByLevelController,
    getAcademicClassByIdController,
    updateAcademicClassController,
    deleteAcademicClassController,
} from "../controllers/academicClassController.js";
import { protect } from "../middleware/authMiddleware.js";



const router = express.Router();

// ======================================================
// Academic Class Routes
// ======================================================

// Create Academic Class
router.post("/", protect, createAcademicClassController);

// Get All Academic Classes
router.get("/", protect, getAcademicClassesController);

// Get Academic Classes By Academic Level
router.get("/level/:academicLevel", protect, getAcademicClassesByLevelController);

// Get Academic Class By ID
router.get("/:id", protect, getAcademicClassByIdController);

// Update Academic Class
router.put("/:id", protect, updateAcademicClassController);

// Delete Academic Class
router.delete("/:id", protect, deleteAcademicClassController);

export default router;