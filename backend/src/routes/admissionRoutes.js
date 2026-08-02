import express from "express";
import {submitAdmissionApplication, getAdmissions} from "../controllers/admissionController.js";

const router = express.Router();

router.post("/", submitAdmissionApplication);

router.get("/", getAdmissions);

export default router;