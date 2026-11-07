import express from "express";

import { completeStudentRegistrationController } from "../controllers/studentRegistrationController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";

const router = express.Router();

// ======================================================
// Admin - Complete Student Registration
// ======================================================

router.post(
    "/:applicationId",
    protect,
    authorize("admin"),
    validate(idParam("applicationId"), "params"),
    completeStudentRegistrationController
);

export default router;
