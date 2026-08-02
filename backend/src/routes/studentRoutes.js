import express from "express";
import { confirmStudentPayment } from "../controllers/studentController.js";

const router = express.Router();

router.patch(
    "/confirm-payment/:admissionId",
    confirmStudentPayment
);

export default router;