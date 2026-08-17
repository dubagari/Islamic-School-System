import express from "express";

import {completeStudentRegistrationController} from "../controllers/studentRegistrationController.js";

const router = express.Router();

// ======================================================
// Complete Student Registration
// ======================================================

router.post("/:applicationId", completeStudentRegistrationController);

export default router;
