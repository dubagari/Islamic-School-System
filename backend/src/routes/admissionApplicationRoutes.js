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

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    admissionApplicationQuerySchema,
    createAdmissionApplicationSchema,
    rejectAdmissionApplicationSchema,
    updateAdmissionApplicationSchema,
} from "../validators/admissionValidators.js";

const router = express.Router();

// ======================================================
// Public - Submit Application
// ======================================================

router.post(
    "/",
    validate(createAdmissionApplicationSchema),
    createAdmissionApplicationController
);

// ======================================================
// Public - Check Application Status By Number
// ======================================================

router.get(
    "/number/:applicationNumber",
    getAdmissionApplicationByNumberController
);

// ======================================================
// Admin - List Applications
// ======================================================

router.get(
    "/",
    protect,
    authorize("admin"),
    validate(admissionApplicationQuerySchema, "query"),
    getAdmissionApplicationsController
);

// ======================================================
// Admin - Get Application By ID
// ======================================================

router.get(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    getAdmissionApplicationByIdController
);

// ======================================================
// Admin - Update Application
// ======================================================

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAdmissionApplicationSchema),
    updateAdmissionApplicationController
);

// ======================================================
// Admin - Approve Application
// ======================================================

router.patch(
    "/:id/approve",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    approveAdmissionApplicationController
);

// ======================================================
// Admin - Reject Application
// ======================================================

router.patch(
    "/:id/reject",
    protect,
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(rejectAdmissionApplicationSchema),
    rejectAdmissionApplicationController
);

export default router;
