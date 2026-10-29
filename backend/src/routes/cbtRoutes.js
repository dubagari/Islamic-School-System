import express from "express";

import {
    createCbtQuestionController,
    getCbtQuestionsController,
    getCbtQuestionByIdController,
    updateCbtQuestionController,
    deleteCbtQuestionController,
    createCbtExamController,
    getCbtExamsController,
    getCbtExamByIdController,
    updateCbtExamController,
    deleteCbtExamController,
    publishCbtExamController,
    publishCbtResultsController,
    getCbtExamQuestionsController,
    attachCbtQuestionsController,
    updateCbtExamQuestionController,
    reorderCbtExamQuestionsController,
    removeCbtExamQuestionController,
    getCbtExamAttemptsController,
    getCbtExamStatisticsController,
    voidCbtAttemptController,
    getStudentCbtExamsController,
    startCbtAttemptController,
    getStudentCbtAttemptController,
    saveCbtAnswersController,
    submitCbtAttemptController,
    getStudentCbtAttemptsController,
    getCbtAttemptResultController,
    getStudentCbtAttemptsForStudentController,
} from "../controllers/cbtController.js";

import {
    authorize,
    protect,
} from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    attachCbtQuestionsSchema,
    cbtAttemptQuerySchema,
    cbtExamQuestionParams,
    cbtExamQuerySchema,
    cbtPublishResultsSchema,
    cbtPublishSchema,
    cbtQuestionQuerySchema,
    cbtStudentExamQuerySchema,
    createCbtExamSchema,
    createCbtQuestionSchema,
    reorderCbtQuestionsSchema,
    saveCbtAnswersSchema,
    updateCbtExamQuestionSchema,
    updateCbtExamSchema,
    updateCbtQuestionSchema,
} from "../validators/cbtValidators.js";

const router = express.Router();

// ======================================================
// Question Bank
// Admin / Teacher
// ======================================================

router.get(
    "/questions",
    protect,
    authorize("admin", "teacher"),
    validate(cbtQuestionQuerySchema, "query"),
    getCbtQuestionsController
);

router.post(
    "/questions",
    protect,
    authorize("admin", "teacher"),
    validate(createCbtQuestionSchema),
    createCbtQuestionController
);

router.get(
    "/questions/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getCbtQuestionByIdController
);

router.patch(
    "/questions/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(updateCbtQuestionSchema),
    updateCbtQuestionController
);

router.delete(
    "/questions/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    deleteCbtQuestionController
);

// ======================================================
// Exams
// Admin / Teacher
// ======================================================

router.get(
    "/exams",
    protect,
    authorize("admin", "teacher"),
    validate(cbtExamQuerySchema, "query"),
    getCbtExamsController
);

router.post(
    "/exams",
    protect,
    authorize("admin", "teacher"),
    validate(createCbtExamSchema),
    createCbtExamController
);

router.get(
    "/exams/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getCbtExamByIdController
);

router.patch(
    "/exams/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(updateCbtExamSchema),
    updateCbtExamController
);

router.delete(
    "/exams/:id",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    deleteCbtExamController
);

router.post(
    "/exams/:id/publish",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(cbtPublishSchema),
    publishCbtExamController
);

router.post(
    "/exams/:id/results/publish",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(cbtPublishResultsSchema),
    publishCbtResultsController
);

router.get(
    "/exams/:id/questions",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getCbtExamQuestionsController
);

router.post(
    "/exams/:id/questions",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(attachCbtQuestionsSchema),
    attachCbtQuestionsController
);

router.patch(
    "/exams/:id/questions/reorder",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(reorderCbtQuestionsSchema),
    reorderCbtExamQuestionsController
);

router.patch(
    "/exams/:id/questions/:examQuestionId",
    protect,
    authorize("admin", "teacher"),
    validate(cbtExamQuestionParams, "params"),
    validate(updateCbtExamQuestionSchema),
    updateCbtExamQuestionController
);

router.delete(
    "/exams/:id/questions/:examQuestionId",
    protect,
    authorize("admin", "teacher"),
    validate(cbtExamQuestionParams, "params"),
    removeCbtExamQuestionController
);

router.get(
    "/exams/:id/attempts",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    validate(cbtAttemptQuerySchema, "query"),
    getCbtExamAttemptsController
);

router.get(
    "/exams/:id/statistics",
    protect,
    authorize("admin", "teacher"),
    validate(idParam("id"), "params"),
    getCbtExamStatisticsController
);

// ======================================================
// Attempt Administration
// Admin
// ======================================================

router.patch(
    "/attempts/:attemptId/void",
    protect,
    authorize("admin"),
    validate(idParam("attemptId"), "params"),
    voidCbtAttemptController
);

// ======================================================
// Student Exams / Attempts
// Student
// ======================================================

router.get(
    "/student/exams",
    protect,
    authorize("student"),
    validate(cbtStudentExamQuerySchema, "query"),
    getStudentCbtExamsController
);

router.post(
    "/student/exams/:examId/start",
    protect,
    authorize("student"),
    validate(idParam("examId"), "params"),
    startCbtAttemptController
);

router.get(
    "/student/attempts",
    protect,
    authorize("student"),
    validate(cbtAttemptQuerySchema, "query"),
    getStudentCbtAttemptsController
);

router.get(
    "/student/attempts/:attemptId",
    protect,
    authorize("student"),
    validate(idParam("attemptId"), "params"),
    getStudentCbtAttemptController
);

router.patch(
    "/student/attempts/:attemptId/answers",
    protect,
    authorize("student"),
    validate(idParam("attemptId"), "params"),
    validate(saveCbtAnswersSchema),
    saveCbtAnswersController
);

router.post(
    "/student/attempts/:attemptId/submit",
    protect,
    authorize("student"),
    validate(idParam("attemptId"), "params"),
    submitCbtAttemptController
);

// ======================================================
// Shared Results
// Admin / Teacher / Student / Parent
// ======================================================

router.get(
    "/attempts/:attemptId/result",
    protect,
    authorize(
        "admin",
        "teacher",
        "student",
        "parent"
    ),
    validate(idParam("attemptId"), "params"),
    getCbtAttemptResultController
);

router.get(
    "/students/:studentId/attempts",
    protect,
    authorize(
        "admin",
        "teacher",
        "student",
        "parent"
    ),
    validate(idParam("studentId"), "params"),
    validate(cbtAttemptQuerySchema, "query"),
    getStudentCbtAttemptsForStudentController
);

export default router;
