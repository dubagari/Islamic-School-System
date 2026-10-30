import express from "express";

import {
    getAuditLogsController,
    getAuditLogByIdController,
} from "../controllers/systemController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import { auditLogQuerySchema } from "../validators/systemValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
    "/",
    validate(auditLogQuerySchema, "query"),
    getAuditLogsController
);

router.get(
    "/:id",
    validate(idParam("id"), "params"),
    getAuditLogByIdController
);

export default router;
