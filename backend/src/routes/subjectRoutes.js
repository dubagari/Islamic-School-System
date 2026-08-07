import express from "express";

import {
    assignSubjectsToClassController,
    getAllClassSubjectsController,
    getClassSubjectByIdController,
    getClassSubjectsByClassController,
    updateClassSubjectController,
    deleteClassSubjectController,
} from "../controllers/classSubjectController.js";

const router = express.Router();

router.post("/", assignSubjectsToClassController);

router.get("/", getAllClassSubjectsController);

router.get("/academic-class/:academicClassId", getClassSubjectsByClassController);


router.get("/:id", getClassSubjectByIdController);

router.put("/:id", updateClassSubjectController);


router.delete("/:id", deleteClassSubjectController);

export default router;