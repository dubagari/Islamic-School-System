import express from "express";

import {
    createTeacherController,
    getTeachersController,
    getTeacherByIdController,
    getTeacherByNumberController,
    updateTeacherController,
    deleteTeacherController,
    getTeacherProfileController,
    getTeacherDashboardController,
} from "../controllers/teacherController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam, paginationQuery } from "../validators/common.js";
import {
    createTeacherSchema,
    updateTeacherSchema,
} from "../validators/teacherValidators.js";

const router = express.Router();

// ======================================================
// Teacher - Self Service
// ======================================================

router.get(
    "/profile",
    protect,
    authorize("teacher"),
    getTeacherProfileController
);

router.get(
    "/dashboard",
    protect,
    authorize("teacher"),
    getTeacherDashboardController
);

// ======================================================
// Admin - Teacher Management
// ======================================================

router.post(
    "/",
    protect,
    authorize("admin"),
    validate(createTeacherSchema),
    createTeacherController
);

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(paginationQuery, "query"),
    getTeachersController
);

router.get(
    "/number/:teacherNumber",
    protect,
    authorize("admin"),
    getTeacherByNumberController
);

router.get(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    getTeacherByIdController
);

router.put(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateTeacherSchema),
    updateTeacherController
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteTeacherController
);

export default router;
