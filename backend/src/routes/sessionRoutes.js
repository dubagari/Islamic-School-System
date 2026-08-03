import express from "express";
import { createSession } from "../controllers/sessionController.js";

const router = express.Router();

router.post("/", createSession);

export default router;