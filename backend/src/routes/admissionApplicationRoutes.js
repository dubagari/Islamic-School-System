
import express from "express";

import {
    createAdmissionApplicationController,
    getAdmissionApplicationsController,
    getAdmissionApplicationByIdController,
    getAdmissionApplicationByNumberController,
    approveAdmissionApplicationController,
    rejectAdmissionApplicationController,
    updateAdmissionApplicationController,
} from "../controllers/admissionApplicationController.js";

const router = express.Router();

// ======================================================
// Create Admission Application
// ======================================================

router.post("/", createAdmissionApplicationController);

// ======================================================
// Get All Admission Applications
// ======================================================

router.get("/", getAdmissionApplicationsController);

// ======================================================
// Get Application By Application Number
// ======================================================

router.get("/number/:applicationNumber", getAdmissionApplicationByNumberController);

// ======================================================
// Get Application By ID
// ======================================================

router.get("/:id", getAdmissionApplicationByIdController);

// ======================================================
// Update Application
// ======================================================

router.patch("/:id", updateAdmissionApplicationController);

// ======================================================
// Approve Application
// ======================================================

router.patch("/:id/approve", approveAdmissionApplicationController);

// ======================================================
// Reject Application
// ======================================================

router.patch("/:id/reject", rejectAdmissionApplicationController);

export default router;
