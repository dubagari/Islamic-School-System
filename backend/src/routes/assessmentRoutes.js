import express from "express";

import {
    createAssessmentController,
    getAssessmentsController,
    getAssessmentByIdController,
    updateAssessmentController,
    deleteAssessmentController,
    bulkUpsertScoresController,
    getAssessmentScoresController,
    updateScoreController,
    deleteScoreController,
} from "../controllers/assessmentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    assessmentQuerySchema,
    createAssessmentSchema,
    scoreEntrySchema,
    updateAssessmentSchema,
    updateScoreSchema,
} from "../validators/assessmentValidators.js";

const router = express.Router();

// ======================================================
// Assessment Routes
// Admin / Teacher
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin", "teacher"),
    validate(createAssessmentSchema),
    createAssessmentController
);

router.get(
    "/",
    protect,
    authorize("admin", "teacher"),
    validate(assessmentQuerySchema, "query"),
    getAssessmentsController
);

router.patch(
    "/scores/:scoreId",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("scoreId"), "params"),
    validate(updateScoreSchema),
    updateScoreController
);

router.delete(
    "/scores/:scoreId",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("scoreId"), "params"),
    deleteScoreController
);

router.post(
    "/:id/scores",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(scoreEntrySchema),
    bulkUpsertScoresController
);

router.get(
    "/:id/scores",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getAssessmentScoresController
);

router.get(
    "/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getAssessmentByIdController
);

router.patch(
    "/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(updateAssessmentSchema),
    updateAssessmentController
);

router.delete(
    "/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    deleteAssessmentController
);

export default router;
