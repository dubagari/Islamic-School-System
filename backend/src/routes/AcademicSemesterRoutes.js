import express from "express";

import {
    createAcademicSemesterController,
    getAcademicSemestersController,
    getAcademicSemesterByIdController,
    updateAcademicSemesterController,
    deleteAcademicSemesterController,
} from "../controllers/AcademicSemesterController.js";

import { protect, authorize,} from "../middleware/authMiddleware.js";


const router = express.Router();


// ======================================================
// Academic Semester Routes
// ======================================================


// Create Academic Semester

router.post(    "/", protect, authorize("admin"), createAcademicSemesterController);


// Get All Academic Semesters

router.get( "/", protect, getAcademicSemestersController);


// Get Academic Semester By ID

router.get( "/:id", protect, getAcademicSemesterByIdController);


// Update Academic Semester

router.patch( "/:id", protect, authorize("admin"), updateAcademicSemesterController);


// Delete Academic Semester

router.delete( "/:id", protect, authorize("admin"), deleteAcademicSemesterController);


export default router;