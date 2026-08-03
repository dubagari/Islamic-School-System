import express from "express";
import { changePassword } from "../controllers/passwordController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/change", authenticateUser, changePassword);

export default router;