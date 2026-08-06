import express from "express";

import {
    createAcademicTermController,
    getAllAcademicTermsController,
    getAcademicTermByIdController,
    updateAcademicTermController,
    deleteAcademicTermController,
} from "../controllers/academicTermController.js";

const router = express.Router();

router.post("/", createAcademicTermController);

router.get("/", getAllAcademicTermsController);

router.get("/:id", getAcademicTermByIdController);

router.put("/:id", updateAcademicTermController);

router.delete("/:id", deleteAcademicTermController);

export default router;