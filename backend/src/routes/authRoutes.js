import express from "express";

import {
    loginController,
    changePasswordController,
    getProfileController,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
    changePasswordSchema,
    loginSchema,
} from "../validators/authValidators.js";

const router = express.Router();

// ======================================================
// Authentication Routes
// ======================================================

router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    loginController
);

router.patch(
    "/change-password",
    protect,
    validate(changePasswordSchema),
    changePasswordController
);

router.get("/profile", protect, getProfileController);

export default router;
