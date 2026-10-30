import express from "express";

import {
    createAcademicSessionController,
    getAcademicSessionsController,
    getAcademicSessionByIdController,
    updateAcademicSessionController,
    deleteAcademicSessionController,
} from "../controllers/academicSessionController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createAcademicSessionSchema,
    updateAcademicSessionSchema,
} from "../validators/academicValidators.js";

const router = express.Router();

// ======================================================
// Academic Session Routes
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createAcademicSessionSchema),
    createAcademicSessionController
);

router.get("/", protect, getAcademicSessionsController);

router.get(
    "/:id",
    protect,
    validate(idParam("id"), "params"),
    getAcademicSessionByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAcademicSessionSchema),
    updateAcademicSessionController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAcademicSessionController
);

export default router;
