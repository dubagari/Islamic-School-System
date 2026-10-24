import express from "express";

import {
    getAllStudentsController,
    getStudentByIdController,
    getStudentProfileController,
    getStudentDashboardController,
} from "../controllers/studentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam, paginationQuery } from "../validators/common.js";

const router = express.Router();

// ======================================================
// Student - Self Service
// ======================================================

router.get(
    "/dashboard",
    protect,
    authorize("student"),
    getStudentDashboardController
);

router.get(
    "/profile",
    protect,
    authorize("student"),
    getStudentProfileController
);

// ======================================================
// Admin - Student Management
// ======================================================

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(paginationQuery, "query"),
    getAllStudentsController
);

router.get(
    "/:studentId",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    getStudentByIdController
);

export default router;
