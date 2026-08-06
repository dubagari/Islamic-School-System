import express from "express";

import {
    createAcademicSessionController,
    getAllAcademicSessionsController,
    getAcademicSessionByIdController,
    updateAcademicSessionController,
    deleteAcademicSessionController,
} from "../controllers/academicSessionController.js";

const router = express.Router();

router.post("/", createAcademicSessionController);

router.get("/", getAllAcademicSessionsController);

router.get("/:id", getAcademicSessionByIdController);

router.put("/:id", updateAcademicSessionController);

router.delete("/:id", deleteAcademicSessionController);

export default router;