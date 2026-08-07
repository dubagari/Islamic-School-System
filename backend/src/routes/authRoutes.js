import express from "express";
import { loginController, changePasswordController, getProfileController, } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginController);

router.patch("/change-password", protect, changePasswordController);

router.get("/profile", protect, getProfileController);

export default router;