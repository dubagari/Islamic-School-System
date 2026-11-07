import express from "express";

import {
    createAcademicSectionController,
    getAcademicSectionsController,
    getAcademicSectionByIdController,
    updateAcademicSectionController,
    deleteAcademicSectionController,
} from "../controllers/academicSectionController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createAcademicSectionSchema,
    updateAcademicSectionSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Academic Section Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createAcademicSectionSchema),
    createAcademicSectionController
);

router.get("/", protect, getAcademicSectionsController);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getAcademicSectionByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAcademicSectionSchema),
    updateAcademicSectionController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAcademicSectionController
);

export default router;
