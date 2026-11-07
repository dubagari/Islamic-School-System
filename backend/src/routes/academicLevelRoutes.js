import express from "express";

import {
    createAcademicLevelController,
    getAcademicLevelsController,
    getAcademicLevelByIdController,
    updateAcademicLevelController,
    deleteAcademicLevelController,
} from "../controllers/academicLevelController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createAcademicLevelSchema,
    updateAcademicLevelSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Academic Level Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createAcademicLevelSchema),
    createAcademicLevelController
);

router.get("/", protect, getAcademicLevelsController);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getAcademicLevelByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAcademicLevelSchema),
    updateAcademicLevelController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAcademicLevelController
);

export default router;
