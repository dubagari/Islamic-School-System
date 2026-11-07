import express from "express";

import {
    createParentController,
    getParentsController,
    getParentByIdController,
    updateParentController,
    deactivateParentController,
    linkStudentsController,
    unlinkStudentController,
} from "../controllers/parentController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { idParam } from "../validators/common.js";
import {
    createParentSchema,
    linkStudentsSchema,
    parentQuerySchema,
    updateParentSchema,
} from "../validators/parentValidators.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.post(
    "/",
    validate(createParentSchema),
    createParentController
);

router.get(
    "/",
    validate(parentQuerySchema, "query"),
    getParentsController
);

router.post(
    "/:id/students",
    validate(idParam("id"), "params"),
    validate(linkStudentsSchema),
    linkStudentsController
);

router.delete(
    "/:id/students/:studentId",
    validate(idParam("id"), "params"),
    validate(idParam("studentId"), "params"),
    unlinkStudentController
);

router.get(
    "/:id",
    validate(idParam("id"), "params"),
    getParentByIdController
);

router.patch(
    "/:id",
    validate(idParam("id"), "params"),
    validate(updateParentSchema),
    updateParentController
);

router.delete(
    "/:id",
    validate(idParam("id"), "params"),
    deactivateParentController
);

export default router;
