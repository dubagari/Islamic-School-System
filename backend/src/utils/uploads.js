import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_ROOT = path.join(
    __dirname,
    "..",
    "..",
    "uploads"
);

export const ensureUploadsDir = (subDir) => {
    const target = path.join(UPLOADS_ROOT, subDir);
    fs.mkdirSync(target, { recursive: true });
    return target;
};

export const EXTENSIONS_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

export const buildPhotoFileName = (mimeType) =>
    `${crypto.randomUUID()}${EXTENSIONS_BY_MIME[mimeType] ?? ".jpg"}`;
