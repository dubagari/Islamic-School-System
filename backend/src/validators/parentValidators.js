import { z } from "zod";

import { objectId } from "./common.js";

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

const optionalEmail = z
    .string()
    .trim()
    .email("A valid email address is required.")
    .optional()
    .or(z.literal(""));

export const createParentSchema = z.object({
    fullName: z.string().trim().min(2).max(150),
    username: z.string().trim().min(3).max(50),
    email: optionalEmail,
    password: z.string().min(8).max(128),
    phone: z.string().trim().max(30).optional(),
    alternatePhone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(500).optional(),
    occupation: z.string().trim().max(150).optional(),
    studentIds: z
        .array(objectId)
        .min(1, "At least one child must be linked.")
        .max(50),
});

export const updateParentSchema = z
    .object({
        fullName: z.string().trim().min(2).max(150).optional(),
        email: optionalEmail,
        phone: z.string().trim().max(30).optional(),
        alternatePhone: z
            .string()
            .trim()
            .max(30)
            .optional(),
        address: z.string().trim().max(500).optional(),
        occupation: z.string().trim().max(150).optional(),
        isActive: z.boolean().optional(),
        studentIds: z.array(objectId).min(1).max(50).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const parentQuerySchema = z
    .object({
        search: z.string().trim().max(150).optional(),
        isActive: z.enum(["true", "false"]).optional(),
        ...paginationFields,
    })
    .passthrough();

export const linkStudentsSchema = z.object({
    studentIds: z.array(objectId).min(1).max(50),
});
