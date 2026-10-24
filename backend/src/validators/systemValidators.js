import { z } from "zod";

import { dateString, objectId } from "./common.js";

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

const dateRangeRefinement = (query) =>
    !query.from ||
    !query.to ||
    Date.parse(query.from) <= Date.parse(query.to);

const dateRangeMessage = {
    message: "The from date must be on or before the to date.",
    path: ["from"],
};

// ======================================================
// Audit Logs
// ======================================================

export const auditLogQuerySchema = z
    .object({
        user: objectId.optional(),
        role: z
            .enum(["admin", "teacher", "student", "parent"])
            .optional(),
        method: z
            .enum(["POST", "PATCH", "PUT", "DELETE"])
            .optional(),
        path: z.string().trim().max(300).optional(),
        success: z.enum(["true", "false"]).optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        ...paginationFields,
    })
    .passthrough()
    .refine(dateRangeRefinement, dateRangeMessage);

// ======================================================
// Users
// ======================================================

export const userQuerySchema = z
    .object({
        role: z
            .enum(["admin", "teacher", "student", "parent"])
            .optional(),
        isActive: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

const optionalEmail = z
    .string()
    .trim()
    .email("A valid email address is required.")
    .optional()
    .or(z.literal(""));

export const updateUserSchema = z
    .object({
        fullName: z.string().trim().min(2).max(150).optional(),
        email: optionalEmail,
        isActive: z.boolean().optional(),
        mustChangePassword: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const resetUserPasswordSchema = z.object({
    newPassword: z.string().min(8).max(128).optional(),
});

// ======================================================
// System Settings
// ======================================================

export const settingKeySchema = z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Keys may only contain letters, numbers, dots, dashes and underscores."
    );

export const settingKeyParamSchema = z.object({
    key: settingKeySchema,
});

export const settingBodySchema = z.object({
    value: z.any().refine((value) => value !== undefined, {
        message: "A setting value is required.",
    }),
    category: z.string().trim().max(50).optional(),
    description: z.string().trim().max(500).optional(),
    isPublic: z.boolean().optional(),
});

export const settingQuerySchema = z
    .object({
        category: z.string().trim().max(50).optional(),
        search: z.string().trim().max(150).optional(),
        isPublic: z.enum(["true", "false"]).optional(),
    })
    .passthrough();
