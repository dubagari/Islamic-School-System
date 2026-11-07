import express from "express";

import {
    createAcademicSemesterController,
    getAcademicSemestersController,
    getAcademicSemesterByIdController,
    updateAcademicSemesterController,
    deleteAcademicSemesterController,
} from "../controllers/AcademicSemesterController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createAcademicSemesterSchema,
    updateAcademicSemesterSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Academic Semester Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createAcademicSemesterSchema),
    createAcademicSemesterController
);

router.get("/", protect, getAcademicSemestersController);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getAcademicSemesterByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAcademicSemesterSchema),
    updateAcademicSemesterController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAcademicSemesterController
);

export default router;
