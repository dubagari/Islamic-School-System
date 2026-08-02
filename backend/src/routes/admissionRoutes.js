import express from "express";
import {submitAdmissionApplication, getAdmissions,  approveAdmissionApplication} from "../controllers/admissionController.js";

const router = express.Router();

router.post("/", submitAdmissionApplication);

router.get("/", getAdmissions);

router.patch("/approve/:admissionId", approveAdmissionApplication); 

export default router;