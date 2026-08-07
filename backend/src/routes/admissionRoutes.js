import express from "express";
import {
    submitAdmissionApplication, 
    getAdmissions,  
    approveAdmissionApplication,
    confirmStudentPayment,
} from "../controllers/admissionController.js";
import { confirmStudentPaymentService } from "../services/studentService.js";

const router = express.Router();

router.post("/", submitAdmissionApplication);

router.get("/", getAdmissions);

router.patch("/approve/:admissionId", approveAdmissionApplication); 

router.patch("/confirm-payment/:admissionId", confirmStudentPaymentService);

export default router;