import { z } from "zod";

// ======================================================
// Shared Validation Helpers
// ======================================================

export const objectId = z
    .string()
    .regex(
        /^[a-fA-F0-9]{24}$/,
        "Must be a valid 24-character MongoDB ObjectId."
    );

export const optionalObjectId = objectId.optional();

export const paginationQuery = z
    .object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
        search: z.string().trim().max(100).optional(),
        status: z.string().trim().max(50).optional(),
        sort: z.string().trim().max(50).optional(),
        order: z.enum(["asc", "desc"]).optional(),
    })
    .passthrough();

export const paramsWithId = z.object({
    id: objectId,
});

export const idParam = (name) =>
    z.object({
        [name]: objectId,
    });

export const dateString = z
    .string()
    .trim()
    .min(1, "Date is required.")
    .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Must be a valid date."
    );
