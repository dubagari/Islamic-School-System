import express from "express";

import {
    createAcademicClassController,
    getAcademicClassesController,
    getAcademicClassesByLevelController,
    getAcademicClassByIdController,
    updateAcademicClassController,
    deleteAcademicClassController,
    assignStudentToAcademicClassController,
} from "../controllers/academicClassController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    assignStudentToClassSchema,
    createAcademicClassSchema,
    updateAcademicClassSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Academic Class Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createAcademicClassSchema),
    createAcademicClassController
);

router.get("/", protect, getAcademicClassesController);

router.get(
    "/level/:academicLevel",
    protect,
    getAcademicClassesByLevelController
);

router.patch(
    "/assign-student",
    protect,
    authorize("admin"),
    validate(assignStudentToClassSchema),
    assignStudentToAcademicClassController
);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getAcademicClassByIdController
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAcademicClassSchema),
    updateAcademicClassController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAcademicClassController
);

export default router;
