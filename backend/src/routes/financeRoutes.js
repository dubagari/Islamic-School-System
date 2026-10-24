import express from "express";

import {
    getFinanceSummaryController,
    getCollectionsController,
    getOutstandingInvoicesController,
} from "../controllers/financeController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
    collectionsQuerySchema,
    financeSummaryQuerySchema,
    outstandingQuerySchema,
} from "../validators/financeValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
    "/summary",
    validate(financeSummaryQuerySchema, "query"),
    getFinanceSummaryController
);

router.get(
    "/collections",
    validate(collectionsQuerySchema, "query"),
    getCollectionsController
);

router.get(
    "/outstanding",
    validate(outstandingQuerySchema, "query"),
    getOutstandingInvoicesController
);

export default router;
