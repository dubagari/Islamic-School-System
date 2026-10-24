import express from "express";

import {
    getSettingsController,
    getSettingController,
    getPublicSettingsController,
    upsertSettingController,
    deleteSettingController,
} from "../controllers/systemController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
    settingBodySchema,
    settingKeyParamSchema,
    settingQuerySchema,
} from "../validators/systemValidators.js";

const router = express.Router();

// Public branding / school information.
router.get(
    "/public",
    getPublicSettingsController
);

// Admin settings management.
router.use(protect, authorize("admin"));

router.get(
    "/",
    validate(settingQuerySchema, "query"),
    getSettingsController
);

router.get(
    "/:key",
    validate(settingKeyParamSchema, "params"),
    getSettingController
);

router.put(
    "/:key",
    validate(settingKeyParamSchema, "params"),
    validate(settingBodySchema),
    upsertSettingController
);

router.delete(
    "/:key",
    validate(settingKeyParamSchema, "params"),
    deleteSettingController
);

export default router;
