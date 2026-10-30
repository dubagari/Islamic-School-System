import express from "express";

import {
    getNotificationsController,
    markNotificationReadController,
    markAllNotificationsReadController,
    getUnreadNotificationCountController,
    deleteNotificationController,
    broadcastNotificationController,
} from "../controllers/communicationController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    broadcastNotificationSchema,
    notificationQuerySchema,
} from "../validators/communicationValidators.js";

const router = express.Router();

router.use(protect);

router.get(
    "/unread-count",
    getUnreadNotificationCountController
);

router.patch(
    "/read-all",
    markAllNotificationsReadController
);

router.post(
    "/broadcast",
    authorize("admin"),
    validate(broadcastNotificationSchema),
    broadcastNotificationController
);

router.get(
    "/",
    validate(notificationQuerySchema, "query"),
    getNotificationsController
);

router.patch(
    "/:id/read",
    validate(idParam("id"), "params"),
    markNotificationReadController
);

router.delete(
    "/:id",
    validate(idParam("id"), "params"),
    deleteNotificationController
);

export default router;
