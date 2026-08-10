
import express from "express";

import {
    resetStudentPasswordController,
} from "../controllers/studentPasswordController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Admin - Reset Student Password
// ======================================================

router.post("/reset/:studentId",protect,authorize("admin"),resetStudentPasswordController);

export default router;
