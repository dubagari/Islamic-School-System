import express from "express";
import { createAdmissionApplication } from "../controllers/admissionController.js";

const router = express.Router();

router.post("/", createAdmissionApplication);

export default router;