import express from "express";

import {
    createAcademicClassController,
    getAllAcademicClassesController,
    getAcademicClassByIdController,
    updateAcademicClassController,
    deleteAcademicClassController,
} from "../controllers/academicClassController.js";

const router = express.Router();

router.post("/", createAcademicClassController);

router.get("/", getAllAcademicClassesController);

router.get("/:id", getAcademicClassByIdController);

router.put("/:id", updateAcademicClassController);

router.delete("/:id", deleteAcademicClassController);

export default router;