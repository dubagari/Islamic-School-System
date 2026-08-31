import express from "express";

import {completeStudentRegistrationController} from "../controllers/studentRegistrationController.js";

import {protect,authorize} from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// Complete Student Registration
// Admin
// ======================================================

router.post("/:applicationId", protect, authorize("admin"), completeStudentRegistrationController);

export default router;