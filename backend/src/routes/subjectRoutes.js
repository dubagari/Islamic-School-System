import express from "express";

import {
    createSubjectController,
    getAllSubjectsController,
    getSubjectByIdController,
    updateSubjectController,
    deleteSubjectController,
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/", createSubjectController);

router.get("/", getAllSubjectsController);

router.get("/:id", getSubjectByIdController);

router.put("/:id", updateSubjectController);

router.delete("/:id", deleteSubjectController);

export default router;