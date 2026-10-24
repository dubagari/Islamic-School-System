import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
    ensureUploadsDir,
    UPLOADS_ROOT,
    EXTENSIONS_BY_MIME,
    buildPhotoFileName,
} from "../utils/uploads.js";

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
                new Error(
                    "Only JPG, PNG or WEBP images are allowed."
                )
            );
        }
    },
});

router.post(
    "/photo",
    upload.single("photo"),
    (req, res, next) => {
        try {
            if (!req.file) {
                return next(
                    new Error("No photo file was provided.")
                );
            }

            const dir = ensureUploadsDir("admissions");
            const fileName = buildPhotoFileName(
                req.file.mimetype
            );

            fs.writeFileSync(
                path.join(dir, fileName),
                req.file.buffer
            );

            res.status(201).json({
                success: true,
                message: "Photo uploaded successfully.",
                data: {
                    photoUrl: `/uploads/admissions/${fileName}`,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
