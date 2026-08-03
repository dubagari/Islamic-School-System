import express from "express";
import { createClass } from "../controllers/classController.js";

const router = express.Router();

router.post("/", createClass);

export default router;