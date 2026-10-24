import express from "express";

import {
    createFeeStructureController,
    getFeeStructuresController,
    getFeeStructureByIdController,
    updateFeeStructureController,
    deleteFeeStructureController,
} from "../controllers/financeController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createFeeStructureSchema,
    feeStructureQuerySchema,
    updateFeeStructureSchema,
} from "../validators/financeValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.post(
    "/",
    validate(createFeeStructureSchema),
    createFeeStructureController
);

router.get(
    "/",
    validate(feeStructureQuerySchema, "query"),
    getFeeStructuresController
);

router.get(
    "/:id",
    validate(idParam("id"), "params"),
    getFeeStructureByIdController
);

router.patch(
    "/:id",
    validate(idParam("id"), "params"),
    validate(updateFeeStructureSchema),
    updateFeeStructureController
);

router.delete(
    "/:id",
    validate(idParam("id"), "params"),
    deleteFeeStructureController
);

export default router;
