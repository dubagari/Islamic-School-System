import express from "express";
import { createTerm } from "../controllers/termController.js";

const router = express.Router();

router.post("/", createTerm);

export default router;