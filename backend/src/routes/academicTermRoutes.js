import express from "express";

import {
    createAcademicTermController,
    getAcademicTermsController,
    getAcademicTermByIdController,
    updateAcademicTermController,
    deleteAcademicTermController,
} from "../controllers/academicTermController.js";

import { protect, authorize,} from "../middleware/authMiddleware.js";


const router = express.Router();


// ======================================================
// Academic Term Routes
// ======================================================


// Create Academic Term

router.post(    "/", protect, authorize("admin"), createAcademicTermController);


// Get All Academic Terms

router.get( "/", protect, getAcademicTermsController);


// Get Academic Term By ID

router.get( "/:id", protect, getAcademicTermByIdController);


// Update Academic Term

router.patch( "/:id", protect, authorize("admin"), updateAcademicTermController);


// Delete Academic Term

router.delete( "/:id", protect, authorize("admin"), deleteAcademicTermController);


export default router;