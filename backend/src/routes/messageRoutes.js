import express from "express";

import {
    sendMessageController,
    getMessagesController,
    getConversationController,
    markMessageReadController,
    markAllMessagesReadController,
    getUnreadMessageCountController,
} from "../controllers/communicationController.js";

import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    conversationQuerySchema,
    messageQuerySchema,
    sendMessageSchema,
} from "../validators/communicationValidators.js";

const router = express.Router();

router.use(protect);

router.get(
    "/unread-count",
    getUnreadMessageCountController
);

router.patch(
    "/read-all",
    markAllMessagesReadController
);

router.post(
    "/",
    validate(sendMessageSchema),
    sendMessageController
);

router.get(
    "/",
    validate(messageQuerySchema, "query"),
    getMessagesController
);

router.get(
    "/conversation/:userId",
    validate(idParam("userId"), "params"),
    validate(conversationQuerySchema, "query"),
    getConversationController
);

router.patch(
    "/:id/read",
    validate(idParam("id"), "params"),
    markMessageReadController
);

export default router;
