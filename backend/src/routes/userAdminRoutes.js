import express from "express";

import {
    getUsersController,
    getUserByIdController,
    updateUserController,
    resetUserPasswordController,
    deactivateUserController,
} from "../controllers/systemController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    resetUserPasswordSchema,
    updateUserSchema,
    userQuerySchema,
} from "../validators/systemValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
    "/",
    validate(userQuerySchema, "query"),
    getUsersController
);

router.get(
    "/:id",
    validate(idParam("id"), "params"),
    getUserByIdController
);

router.patch(
    "/:id",
    validate(idParam("id"), "params"),
    validate(updateUserSchema),
    updateUserController
);

router.post(
    "/:id/reset-password",
    validate(idParam("id"), "params"),
    validate(resetUserPasswordSchema),
    resetUserPasswordController
);

router.delete(
    "/:id",
    validate(idParam("id"), "params"),
    deactivateUserController
);

export default router;
