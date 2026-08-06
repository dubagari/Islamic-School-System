import express from "express";
import {
    createAcademicSection,
    getAllAcademicSectionsController,
    getAcademicSectionByIdController,
    updateAcademicSectionController,
    deleteAcademicSectionController,
} from "../controllers/academicSectionController.js";

const router = express.Router();

router.post("/", createAcademicSection);

router.get("/", getAllAcademicSectionsController);

router.get("/:id", getAcademicSectionByIdController);

router.put("/:id", updateAcademicSectionController);

router.delete("/:id", deleteAcademicSectionController);

export default router;