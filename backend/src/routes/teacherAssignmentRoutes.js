import express from "express";

import {
    createTeacherAssignmentController,
    getTeacherAssignmentsController,
    getTeacherAssignmentsByTeacherController,
    getTeacherAssignmentByIdController,
    updateTeacherAssignmentController,
    deleteTeacherAssignmentController,
    getMyTeacherAssignmentsController,
    getMyTeacherClassesController,
} from "../controllers/teacherAssignmentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createTeacherAssignmentSchema,
    updateTeacherAssignmentSchema,
} from "../validators/teacherValidators.js";

const router = express.Router();

// ======================================================
// Teacher - My Assignments
// ======================================================

router.get(
    "/my-assignments",
    protect,
    authorize("teacher"),
    getMyTeacherAssignmentsController
);

router.get(
    "/my-classes",
    protect,
    authorize("teacher"),
    getMyTeacherClassesController
);

// ======================================================
// Admin - Assignments
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createTeacherAssignmentSchema),
    createTeacherAssignmentController
);

router.get(
    "/",
    protect,
    authorize("admin"),
    getTeacherAssignmentsController
);

router.get(
    "/teacher/:teacher",
    protect,
    authorize("admin"),
    getTeacherAssignmentsByTeacherController
);

router.get(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    getTeacherAssignmentByIdController
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateTeacherAssignmentSchema),
    updateTeacherAssignmentController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteTeacherAssignmentController
);

export default router;
