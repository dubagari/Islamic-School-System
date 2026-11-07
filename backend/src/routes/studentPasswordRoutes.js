import express from "express";

import { resetStudentPasswordController } from "../controllers/studentPasswordController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";

const router = express.Router();

// ======================================================
// Admin - Reset Student Password
// ======================================================

router.post(
    "/:studentId/reset",
    protect,
    authorize("admin"),
    validate(idParam("studentId"), "params"),
    resetStudentPasswordController
);

export default router;
