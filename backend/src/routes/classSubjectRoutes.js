import express from "express";

import {
    createClassSubjectController,
    getClassSubjectsController,
    getClassSubjectsBySectionController,
    getClassSubjectByIdController,
    updateClassSubjectController,
    deleteClassSubjectController,
} from "../controllers/classSubjectController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createClassSubjectSchema,
    updateClassSubjectSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Class Subject Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createClassSubjectSchema),
    createClassSubjectController
);

router.get("/", protect, getClassSubjectsController);

router.get(
    "/section/:section",
    protect,
    getClassSubjectsBySectionController
);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getClassSubjectByIdController
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateClassSubjectSchema),
    updateClassSubjectController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteClassSubjectController
);

export default router;
