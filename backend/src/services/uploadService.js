import fs from "fs";
import path from "path";

import {
    cloudinary,
    isCloudinaryConfigured,
} from "../config/cloudinary.js";
import { env } from "../config/env.js";
import {
    ensureUploadsDir,
    buildPhotoFileName,
} from "../utils/uploads.js";

const uploadBufferToCloudinary = (buffer, folder) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });

const saveLocally = (buffer, mimetype) => {
    const dir = ensureUploadsDir("admissions");
    const fileName = buildPhotoFileName(mimetype);

    fs.writeFileSync(path.join(dir, fileName), buffer);

    return `/uploads/admissions/${fileName}`;
};

export const uploadAdmissionPhoto = async (
    buffer,
    mimetype
) => {
    if (!isCloudinaryConfigured) {
        if (env.isProduction) {
            throw new Error(
                "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
            );
        }

        return {
            photoUrl: saveLocally(buffer, mimetype),
            publicId: null,
            storage: "local",
        };
    }

    const result = await uploadBufferToCloudinary(
        buffer,
        env.cloudinaryFolder
    );

    return {
        photoUrl: result.secure_url,
        publicId: result.public_id,
        storage: "cloudinary",
    };
};
