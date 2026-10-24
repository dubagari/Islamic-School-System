import { z } from "zod";

import { dateString, objectId } from "./common.js";

const paginationFields = {
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
};

export const announcementAudience = z.enum([
    "all",
    "students",
    "teachers",
    "parents",
    "class",
]);

export const announcementPriority = z.enum([
    "Low",
    "Normal",
    "High",
    "Urgent",
]);

// ======================================================
// Announcements
// ======================================================

export const createAnnouncementSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        content: z.string().trim().min(1).max(10000),
        audience: announcementAudience.optional(),
        academicClass: objectId.optional(),
        priority: announcementPriority.optional(),
        publishAt: dateString.optional(),
        expiresAt: dateString.optional(),
        isPublished: z.boolean().optional(),
    })
    .refine(
        (data) =>
            data.audience !== "class" ||
            Boolean(data.academicClass),
        {
            message:
                "An academic class is required for class announcements.",
            path: ["academicClass"],
        }
    );

export const updateAnnouncementSchema = z
    .object({
        title: z.string().trim().min(1).max(200).optional(),
        content: z
            .string()
            .trim()
            .min(1)
            .max(10000)
            .optional(),
        audience: announcementAudience.optional(),
        academicClass: objectId
            .nullable()
            .optional(),
        priority: announcementPriority.optional(),
        publishAt: dateString.optional(),
        expiresAt: dateString.nullable().optional(),
        isPublished: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided.",
    });

export const announcementQuerySchema = z
    .object({
        audience: announcementAudience.optional(),
        priority: announcementPriority.optional(),
        academicClass: objectId.optional(),
        isPublished: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

// ======================================================
// Messages
// ======================================================

export const sendMessageSchema = z.object({
    recipient: objectId,
    subject: z.string().trim().max(200).optional(),
    body: z.string().trim().min(1).max(5000),
});

export const messageQuerySchema = z
    .object({
        box: z.enum(["inbox", "sent", "all"]).optional(),
        isRead: z.enum(["true", "false"]).optional(),
        search: z.string().trim().max(150).optional(),
        ...paginationFields,
    })
    .passthrough();

export const conversationQuerySchema = z
    .object({
        ...paginationFields,
    })
    .passthrough();

// ======================================================
// Notifications
// ======================================================

export const notificationQuerySchema = z
    .object({
        type: z
            .enum([
                "announcement",
                "message",
                "fee",
                "result",
                "attendance",
                "system",
            ])
            .optional(),
        isRead: z.enum(["true", "false"]).optional(),
        ...paginationFields,
    })
    .passthrough();

export const broadcastNotificationSchema = z.object({
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    type: z
        .enum([
            "announcement",
            "message",
            "fee",
            "result",
            "attendance",
            "system",
        ])
        .optional(),
    role: z
        .enum([
            "all",
            "admin",
            "teacher",
            "student",
            "parent",
        ])
        .optional(),
    userIds: z.array(objectId).max(2000).optional(),
});
