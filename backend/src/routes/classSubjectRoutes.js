import express from "express";

import {
    assignSubjectsToClass,
    getAllClassSubjects,
    getClassSubjectsByClass,
    removeClassSubject,
    updateClassSubject,
} from "../controllers/classSubjectController.js";

const router = express.Router();

router.post("/", assignSubjectsToClass);

router.get("/", getAllClassSubjects);

router.get("/class/:classId", getClassSubjectsByClass);

router.put("/:id", updateClassSubject);

router.delete("/:id", removeClassSubject);

export default router;