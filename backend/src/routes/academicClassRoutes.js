import express from "express";
import { createAcademicClass } from "../controllers/academicClassController.js";

const router = express.Router();

router.post("/", createAcademicClass);

export default router;