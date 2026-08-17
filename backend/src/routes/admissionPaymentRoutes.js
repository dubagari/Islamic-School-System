
import express from "express";

import {
    confirmCashPaymentController,
    initializePaystackPaymentController,
    verifyPaystackPaymentController,
} from "../controllers/admissionPaymentController.js";

const router = express.Router();

// ======================================================
// Cash Payment
// ======================================================

router.post("/cash/:applicationId", confirmCashPaymentController);

// ======================================================
// Paystack - Initialize
// ======================================================

router.post("/paystack/initialize/:applicationId",initializePaystackPaymentController);

// ======================================================
// Paystack - Verify
// ======================================================

router.post("/paystack/verify",verifyPaystackPaymentController);


export default router;
