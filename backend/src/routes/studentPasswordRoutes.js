
// import express from "express";

// import {
//     resetStudentPasswordController,
// } from "../controllers/studentPasswordController.js";

// import {
//     protect,
//     authorize,
// } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // ======================================================
// // Admin - Reset Student Password
// // ======================================================

// router.post("/reset/:studentId",protect,authorize("admin"),resetStudentPasswordController);

// export default router;



// import express from "express";

// import {
//     getAllStudentsController,
//     getStudentByIdController,
//     getStudentProfileController,
// } from "../controllers/studentController.js";

// import {    protect, authorize,} from "../middleware/authMiddleware.js";
// import { resetStudentPasswordController } from "../controllers/studentPasswordController.js";

// const router = express.Router();


// // ======================================================
// // Student - Get Own Profile
// // ======================================================


// router.get("/profile",protect,authorize("student"),getStudentProfileController);

// // ======================================================
// // Admin - Get All Students
// // ======================================================

// router.get("/",protect,authorize("admin"),getAllStudentsController);



// // ======================================================
// // Admin - Get Student By ID
// // ======================================================

// router.get("/:studentId",protect,authorize("admin"),getStudentByIdController);

// // ======================================================
// // Admin - Reset Student Password
// // ======================================================

// router.post("/:studentId/reset", protect, authorize("admin"), resetStudentPasswordController);

// export default router;



import express from "express";

import {
    resetStudentPasswordController,
} from "../controllers/studentPasswordController.js";

import {
    protect,
    authorize,
} from "../middleware/authMiddleware.js";
import { getAllStudentsController, getStudentByIdController } from "../controllers/studentController.js";

const router = express.Router();
// ======================================================
// Admin - Get All Students
// ======================================================

router.get("/",protect,authorize("admin"),getAllStudentsController);



// ======================================================
// Admin - Get Student By ID
// ======================================================

router.get("/:studentId",protect,authorize("admin"),getStudentByIdController);

// ======================================================
// Admin - Reset Student Password
// ======================================================

router.post("/:studentId/reset", protect, authorize("admin"), resetStudentPasswordController);


export default router;