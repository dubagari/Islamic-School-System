import express from "express";

import {
    createSubjectController,
    getSubjectsController,
    getSubjectByIdController,
    updateSubjectController,
    deleteSubjectController,
} from "../controllers/subjectController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createSubjectSchema,
    updateSubjectSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Subject Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createSubjectSchema),
    createSubjectController
);

router.get("/", protect, getSubjectsController);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getSubjectByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateSubjectSchema),
    updateSubjectController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteSubjectController
);

export default router;
