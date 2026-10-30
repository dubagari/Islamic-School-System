import express from "express";

import {
    createAnnouncementController,
    getAnnouncementsController,
    getAnnouncementByIdController,
    markAnnouncementReadController,
    updateAnnouncementController,
    deleteAnnouncementController,
    getAnnouncementUnreadCountController,
} from "../controllers/communicationController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    announcementQuerySchema,
    createAnnouncementSchema,
    updateAnnouncementSchema,
    publicAnnouncementQuerySchema,
} from "../validators/communicationValidators.js";
import { getPublicAnnouncementsController } from "../controllers/communicationController.js";

const router = express.Router();

router.get(
    "/public",
    validate(publicAnnouncementQuerySchema, "query"),
    getPublicAnnouncementsController
);

router.use(protect);

router.get(
    "/unread-count",
    getAnnouncementUnreadCountController
);

router.post(
    "/",
    authorize("admin"),
    validate(createAnnouncementSchema),
    createAnnouncementController
);

router.get(
    "/",
    validate(announcementQuerySchema, "query"),
    getAnnouncementsController
);

router.get(
    "/:id",
    validate(idParam("id"), "params"),
    getAnnouncementByIdController
);

router.post(
    "/:id/read",
    validate(idParam("id"), "params"),
    markAnnouncementReadController
);

router.patch(
    "/:id",
    authorize("admin"),
    validate(idParam("id"), "params"),
    validate(updateAnnouncementSchema),
    updateAnnouncementController
);

router.delete(
    "/:id",
    authorize("admin"),
    validate(idParam("id"), "params"),
    deleteAnnouncementController
);

export default router;
