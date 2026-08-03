import express from "express";
import { createAcademicSection } from "../controllers/academicSectionController.js";

const router = express.Router();

router.post("/", createAcademicSection);

export default router;