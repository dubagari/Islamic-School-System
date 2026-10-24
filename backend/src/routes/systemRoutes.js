import express from "express";

import {
    getSystemInfoController,
    getDatabaseStatsController,
    syncIndexesController,
} from "../controllers/systemController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/info", getSystemInfoController);

router.get("/database", getDatabaseStatsController);

router.post("/sync-indexes", syncIndexesController);

export default router;
