import express from "express";
import { createAcademicClass, getAcademicClasses } from "../controllers/academicClassController.js";

const router = express.Router();

router.post("/", createAcademicClass);
router.get("/", getAcademicClasses);


export default router;

