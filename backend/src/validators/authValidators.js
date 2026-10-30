import { z } from "zod";

export const loginSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1, "Username or email is required.")
        .max(150),

    password: z
        .string()
        .min(1, "Password is required.")
        .max(128),
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password is required.")
        .max(128),

    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters.")
        .max(128, "New password must be at most 128 characters."),
});
