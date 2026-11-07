import express from "express";
import multer from "multer";

import { uploadLimiter } from "../middleware/rateLimiters.js";
import { uploadAdmissionPhoto } from "../services/uploadService.js";
import { badRequest } from "../utils/AppError.js";
import { EXTENSIONS_BY_MIME } from "../utils/uploads.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (EXTENSIONS_BY_MIME[file.mimetype]) {
            cb(null, true);
        } else {
            cb(
                badRequest(
                    "Only JPG, PNG or WEBP images are allowed."
                )
            );
        }
    },
});

router.post(
    "/photo",
    uploadLimiter,
    upload.single("photo"),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return next(
                    badRequest("No photo file was provided.")
                );
            }

            const uploaded = await uploadAdmissionPhoto(
                req.file.buffer,
                req.file.mimetype
            );

            res.status(201).json({
                success: true,
                message: "Photo uploaded successfully.",
                data: {
                    photoUrl: uploaded.photoUrl,
                    publicId: uploaded.publicId,
                    storage: uploaded.storage,
                },
            });
        } catch (error) {
            if (error instanceof multer.MulterError) {
                return next(
                    badRequest(
                        error.code === "LIMIT_FILE_SIZE"
                            ? "Photo must be smaller than 2MB."
                            : error.message
                    )
                );
            }

            next(error);
        }
    }
);

export default router;
